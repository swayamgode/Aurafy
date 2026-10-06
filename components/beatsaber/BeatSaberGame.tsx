"use client";

import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Difficulty = "easy" | "normal" | "hard" | "expert";

export interface ScoreUpdate {
  score: number;
  combo: number;
  multiplier: number;
  misses: number;
  accuracy: number;
  hits: number;
}

interface BeatSaberGameProps {
  isPlaying: boolean;
  difficulty: Difficulty;
  onScoreUpdate: (update: ScoreUpdate) => void;
  onBlockHit: (isSpecial: boolean, intensity: number) => void;
  onMiss: () => void;
  onTargetLock?: (isLocked: boolean, cubeType: "pink" | "cyan" | "gold" | "hazard" | null) => void;
  onMisfire?: () => void;
  bpm?: number;
  recenterTrigger?: number;
  isGyroEnabled?: boolean;
  onGyroActive?: (active: boolean) => void;
}

// ─── Sound FX Synthesizer (Instant arcade pops & crystal explosions) ─────────
function playBurstSfx(pitch = 560, isHazardOrMisfire = false) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isHazardOrMisfire ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(isHazardOrMisfire ? 150 : pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isHazardOrMisfire ? 55 : pitch * 1.8, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.17);
  } catch (_) {}
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LANE_X = [-1.5, -0.5, 0.5, 1.5];
const SPAWN_Z = -36;
const MISS_Z = 2.8;
const BLOCK_SZ = 0.52;
const LOCK_ON_RADIUS = 0.72; // Tight radius matching smaller crosshair

interface CubeItem {
  group: THREE.Group;
  outerMesh: THREE.Mesh;
  innerCore: THREE.Mesh;
  ring: THREE.Mesh;
  type: "pink" | "cyan" | "gold" | "hazard";
  lane: number;
  hit: boolean;
  missed: boolean;
  speed: number;
}

interface ShardParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface ShockwaveRing {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  scaleSpeed: number;
}

export default function BeatSaberGame({
  isPlaying,
  difficulty,
  onScoreUpdate,
  onBlockHit,
  onMiss,
  onTargetLock,
  onMisfire,
  bpm = 128,
  recenterTrigger = 0,
  isGyroEnabled = true,
  onGyroActive,
}: BeatSaberGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animRef = useRef<number | null>(null);

  // VR Gyro Tracking
  const gyroRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const gyroActiveRef = useRef(false);
  const refQuat = useRef(new THREE.Quaternion());
  const needsRecenter = useRef(true);

  // Desktop Orbit Look state
  const mouseDragRef = useRef({ isDown: false, startX: 0, startY: 0, yaw: 0, pitch: 0 });

  // Cubes, Shards & FX
  const cubesRef = useRef<CubeItem[]>([]);
  const shardsRef = useRef<ShardParticle[]>([]);
  const shockwavesRef = useRef<ShockwaveRing[]>([]);
  const archwaysRef = useRef<THREE.Mesh[]>([]);
  const eqBarsRef = useRef<THREE.Mesh[]>([]);
  const searchlightsRef = useRef<THREE.SpotLight[]>([]);

  // Currently locked target cube
  const lockedCubeRef = useRef<CubeItem | null>(null);
  const prevLockStateRef = useRef<{ isLocked: boolean; type: string | null }>({ isLocked: false, type: null });

  // Score
  const scoreRef = useRef({ score: 0, combo: 0, multiplier: 1, misses: 0, hits: 0 });

  // Song Beat Synchronizer
  const lastSpawnedBeatRef = useRef(-1);

  // Recenter trigger
  useEffect(() => {
    needsRecenter.current = true;
    mouseDragRef.current.yaw = 0;
    mouseDragRef.current.pitch = 0;
  }, [recenterTrigger]);

  // ── Rhythm & Beat Configuration ───────────────────────────────────────────
  const getBeatConfig = useCallback(() => {
    const songBpm = bpm || 128;
    const beatDuration = 60 / songBpm;

    switch (difficulty) {
      case "easy":
        return {
          beatDuration,
          spawnBeatStep: 2, // Spawn every 2 beats (half notes)
          travelBeats: 6,   // Takes exactly 6 beats to travel from SPAWN_Z to 0
          speed: Math.abs(SPAWN_Z) / (6 * beatDuration),
          hazardChance: 0.04,
          goldChance: 0.16,
        };
      case "normal":
        return {
          beatDuration,
          spawnBeatStep: 1, // Spawn every 1 beat (quarter notes)
          travelBeats: 4,   // Takes exactly 4 beats to travel to 0
          speed: Math.abs(SPAWN_Z) / (4 * beatDuration),
          hazardChance: 0.08,
          goldChance: 0.20,
        };
      case "hard":
        return {
          beatDuration,
          spawnBeatStep: 1, // Spawn every 1 beat, with syncopated doubles
          travelBeats: 3,   // Fast 3-beat travel
          speed: Math.abs(SPAWN_Z) / (3 * beatDuration),
          hazardChance: 0.12,
          goldChance: 0.24,
        };
      case "expert":
        return {
          beatDuration,
          spawnBeatStep: 0.5, // Spawn every 8th note!
          travelBeats: 2.5,   // Intense 2.5-beat rush
          speed: Math.abs(SPAWN_Z) / (2.5 * beatDuration),
          hazardChance: 0.15,
          goldChance: 0.28,
        };
    }
  }, [bpm, difficulty]);

  // ── Score Helpers ─────────────────────────────────────────────────────────
  const registerHit = (type: CubeItem["type"]) => {
    const s = scoreRef.current;
    if (type === "hazard") {
      s.combo = 0;
      s.multiplier = 1;
      s.misses++;
      playBurstSfx(130, true);
      try { navigator.vibrate?.([60, 40, 60]); } catch (_) {}
      onMiss();
      onScoreUpdate({
        ...s,
        accuracy: s.hits > 0 ? (s.hits / (s.hits + s.misses)) * 100 : 0,
      });
      return;
    }

    s.combo++;
    s.multiplier = Math.min(8, 1 + Math.floor(s.combo / 6));
    const basePts = type === "gold" ? 300 : 100;
    s.score += basePts * s.multiplier;
    s.hits++;
    playBurstSfx(type === "gold" ? 820 : type === "pink" ? 640 : 520, false);
    try { navigator.vibrate?.(type === "gold" ? [40, 20, 40] : 30); } catch (_) {}
    onBlockHit(type === "gold", 1.0);
    onScoreUpdate({
      ...s,
      accuracy: (s.hits / (s.hits + s.misses)) * 100,
    });
  };

  const registerMiss = () => {
    const s = scoreRef.current;
    s.combo = 0;
    s.multiplier = 1;
    s.misses++;
    onMiss();
    onScoreUpdate({
      ...s,
      accuracy: s.hits > 0 ? (s.hits / (s.hits + s.misses)) * 100 : 0,
    });
  };

  // ── Burst / Shatter Explosion Effect ──────────────────────────────────────
  const spawnBurstEffect = (scene: THREE.Scene, pos: THREE.Vector3, type: CubeItem["type"]) => {
    const baseColor =
      type === "gold" ? 0xffd700 : type === "pink" ? 0xff007f : type === "hazard" ? 0xff3333 : 0x00f0ff;

    // 1. Expanding Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.2, 0.45, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(pos);
    ringMesh.rotation.x = Math.PI / 2;
    scene.add(ringMesh);
    shockwavesRef.current.push({ mesh: ringMesh, life: 0, maxLife: 0.35, scaleSpeed: 7 });

    // 2. Crystal Shards & Particles
    const shardCount = 32;
    for (let i = 0; i < shardCount; i++) {
      const sz = 0.05 + Math.random() * 0.12;
      const geo = Math.random() > 0.4 ? new THREE.OctahedronGeometry(sz) : new THREE.ConeGeometry(sz, sz * 1.8, 5);
      const mat = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
      });
      const shard = new THREE.Mesh(geo, mat);
      shard.position.copy(pos);
      scene.add(shard);

      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const speed = 3.5 + Math.random() * 5.5;

      shardsRef.current.push({
        mesh: shard,
        vel: new THREE.Vector3(
          Math.cos(theta) * Math.cos(phi) * speed,
          Math.sin(phi) * speed + 0.8,
          Math.sin(theta) * Math.cos(phi) * speed
        ),
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        ),
        life: 0,
        maxLife: 0.45 + Math.random() * 0.3,
      });
    }

    // 3. Flash Point Light
    const flashLight = new THREE.PointLight(baseColor, 5.0, 6);
    flashLight.position.copy(pos);
    scene.add(flashLight);
    setTimeout(() => {
      scene.remove(flashLight);
      flashLight.dispose();
    }, 120);
  };

  // ── STRICT CROSSHAIR SHOOTING MECHANIC ────────────────────────────────────
  // The player CANNOT tap cubes off-screen or off-center.
  // The shot is ALWAYS cast strictly through the center crosshair (0, 0).
  // Only if an incoming cube aligns with the crosshair does it burst!
  const triggerShootFromCrosshair = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const target = lockedCubeRef.current;
    if (target && !target.hit && !target.missed) {
      // Direct Hit on aligned target!
      target.hit = true;
      scene.remove(target.group);
      spawnBurstEffect(scene, target.group.position, target.type);
      registerHit(target.type);
      lockedCubeRef.current = null;
      if (onTargetLock) onTargetLock(false, null);
    } else {
      // Empty Shot / Misfire (Crosshair was not pointing at any cube)
      playBurstSfx(180, true);
      onMisfire?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMisfire, onTargetLock]);

  // ── Spawn Futuristic Crystal Cube ─────────────────────────────────────────
  const spawnCube = useCallback(
    (scene: THREE.Scene, speed: number, forceLane?: number) => {
      const cfg = getBeatConfig();
      const lane = forceLane !== undefined ? forceLane : Math.floor(Math.random() * LANE_X.length);
      const rand = Math.random();

      let type: CubeItem["type"] = "cyan";
      if (rand < cfg.hazardChance) type = "hazard";
      else if (rand < cfg.hazardChance + cfg.goldChance) type = "gold";
      else if (rand < 0.6) type = "pink";

      const group = new THREE.Group();
      const colorHex =
        type === "gold" ? 0xffd700 : type === "pink" ? 0xff007f : type === "hazard" ? 0xff2222 : 0x00f0ff;

      // 1. Outer Holographic Crystal Cube
      const outerGeo = new THREE.BoxGeometry(BLOCK_SZ, BLOCK_SZ, BLOCK_SZ);
      const outerMat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        emissive: new THREE.Color(colorHex),
        emissiveIntensity: 0.7,
        roughness: 0.1,
        metalness: 0.4,
        transparent: true,
        opacity: 0.85,
        transmission: 0.25,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      group.add(outerMesh);

      // Neon Wireframe Edges
      const edgesGeo = new THREE.EdgesGeometry(outerGeo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2,
        transparent: true,
        opacity: 0.9,
      });
      const edgeLines = new THREE.LineSegments(edgesGeo, edgesMat);
      outerMesh.add(edgeLines);

      // 2. Inner Pulsating Energy Core
      const innerGeo =
        type === "hazard"
          ? new THREE.SphereGeometry(BLOCK_SZ * 0.35, 12, 12)
          : new THREE.OctahedronGeometry(BLOCK_SZ * 0.32);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: type === "hazard",
      });
      const innerCore = new THREE.Mesh(innerGeo, innerMat);
      group.add(innerCore);

      // 3. Orbiting Gyro Ring
      const ringGeo = new THREE.TorusGeometry(BLOCK_SZ * 0.65, 0.02, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 4;
      group.add(ring);

      group.position.set(LANE_X[lane], 1.25 + (Math.random() - 0.5) * 0.35, SPAWN_Z);
      scene.add(group);

      cubesRef.current.push({
        group,
        outerMesh,
        innerCore,
        ring,
        type,
        lane,
        hit: false,
        missed: false,
        speed,
      });
    },
    [getBeatConfig]
  );

  // ── Three.js Scene Setup ──────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a);
    scene.fog = new THREE.FogExp2(0x040816, 0.024);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(76, container.clientWidth / container.clientHeight, 0.1, 300);
    camera.position.set(0, 1.45, 3.2);
    cameraRef.current = camera;

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0x1a243b, 1.6));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(0, 10, 5);
    scene.add(mainLight);

    // Sweeping Searchlights
    const slColors = [0x00f0ff, 0xff007f, 0x9d00ff, 0x00ff88];
    const searchlights: THREE.SpotLight[] = [];
    slColors.forEach((col, i) => {
      const sl = new THREE.SpotLight(col, 4.5, 35, Math.PI / 6, 0.5);
      sl.position.set((i - 1.5) * 4, 12, -10);
      sl.target.position.set((i - 1.5) * 2, 0, -25);
      scene.add(sl);
      scene.add(sl.target);
      searchlights.push(sl);
    });
    searchlightsRef.current = searchlights;

    // ── Reflective Cyber Track ──
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x050814,
      roughness: 0.15,
      metalness: 0.9,
    });
    const track = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 80), trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, 0, -28);
    scene.add(track);

    // Neon Track Divider Rails
    for (let l = -2; l <= 2; l++) {
      const railGeo = new THREE.BoxGeometry(0.04, 0.02, 80);
      const railMat = new THREE.MeshBasicMaterial({
        color: l === -2 || l === 2 ? 0xff007f : 0x00f0ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(l * 1.08, 0.02, -28);
      scene.add(rail);
    }

    // ── Neon Hexagonal Archways Over Highway ──
    const archways: THREE.Mesh[] = [];
    for (let z = -32; z <= 2; z += 6) {
      const archGeo = new THREE.TorusGeometry(3.1, 0.035, 6, 6);
      const archMat = new THREE.MeshBasicMaterial({
        color: z % 12 === 0 ? 0xff007f : 0x00f0ff,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      });
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(0, 1.4, z);
      scene.add(arch);
      archways.push(arch);
    }
    archwaysRef.current = archways;

    // ── Flanking Equalizer Visualizer Towers ──
    const eqBars: THREE.Mesh[] = [];
    const eqGeo = new THREE.BoxGeometry(0.2, 1, 0.2);
    for (let i = 0; i < 20; i++) {
      const zPos = -32 + i * 1.8;
      // Left side tower
      const matL = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x00f0ff : 0x9d00ff,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const barL = new THREE.Mesh(eqGeo, matL);
      barL.position.set(-3.2, 0.5, zPos);
      scene.add(barL);
      eqBars.push(barL);

      // Right side tower
      const matR = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff007f : 0x00ff88,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const barR = new THREE.Mesh(eqGeo, matR);
      barR.position.set(3.2, 0.5, zPos);
      scene.add(barR);
      eqBars.push(barR);
    }
    eqBarsRef.current = eqBars;

    // ── Ambient Starfield ──
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 60;
      starPositions[i + 1] = Math.random() * 25 + 1;
      starPositions[i + 2] = -Math.random() * 60;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.12,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ── Mobile Device Orientation (Gyro VR Look) ──
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        gyroRef.current = { alpha: e.alpha, beta: e.beta, gamma: e.gamma };
        if (!gyroActiveRef.current) {
          gyroActiveRef.current = true;
          onGyroActive?.(true);
        }
      }
    };
    window.addEventListener("deviceorientation", onOrientation);

    // ── Touch and Pointer Shooting ──
    // Any tap on the screen or mouse click fires through the CENTER CROSSHAIR.
    // It does NOT click on cubes directly — head aiming is required!
    const dom = renderer.domElement;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!("touches" in e)) {
        mouseDragRef.current.isDown = true;
        mouseDragRef.current.startX = (e as MouseEvent).clientX;
        mouseDragRef.current.startY = (e as MouseEvent).clientY;
      }
      triggerShootFromCrosshair();
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!mouseDragRef.current.isDown) return;
      const dx = e.clientX - mouseDragRef.current.startX;
      const dy = e.clientY - mouseDragRef.current.startY;
      mouseDragRef.current.startX = e.clientX;
      mouseDragRef.current.startY = e.clientY;
      mouseDragRef.current.yaw -= dx * 0.005;
      mouseDragRef.current.pitch = Math.max(-0.6, Math.min(0.6, mouseDragRef.current.pitch - dy * 0.005));
    };

    const onPointerUp = () => {
      mouseDragRef.current.isDown = false;
    };

    dom.addEventListener("touchstart", onPointerDown, { passive: true });
    dom.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Render Loop ──
    let lastTime = performance.now();

    const animate = (now: number) => {
      animRef.current = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;
      const elapsed = now / 1000;

      // ── Song Time & Real Beat Phase ──
      const realAudioTime = typeof window !== "undefined" && window._aurafyGetTime ? window._aurafyGetTime() : 0;
      const songTime = realAudioTime > 0 ? realAudioTime : elapsed;
      const bCfg = getBeatConfig();
      const beatDuration = bCfg.beatDuration;

      // Beat Phase: 0 to 1, with exponential kick decay
      const beatPhase = (songTime % beatDuration) / beatDuration;
      const beatPulse = Math.pow(Math.max(0, 1 - beatPhase), 2.5);

      // Pulse Equalizer Towers to Song Beat
      eqBarsRef.current.forEach((bar, idx) => {
        const h = Math.max(0.35, Math.sin(songTime * 8 + idx * 0.6) * 1.5 + beatPulse * 2.8 + 0.6);
        bar.scale.y = h;
        bar.position.y = h / 2;
      });

      // Sway Searchlights to Song Rhythm
      searchlightsRef.current.forEach((sl, idx) => {
        const sweep = Math.sin((songTime / beatDuration) * Math.PI * 0.5 + idx * 1.5) * 6;
        sl.target.position.x = sweep;
      });

      // ── 360° VR Gyro Look ──
      if (isGyroEnabled && gyroActiveRef.current && gyroRef.current) {
        const { alpha, beta, gamma } = gyroRef.current;
        const screenAngle =
          (typeof window !== "undefined" && ((window.screen?.orientation?.angle) ?? (window.orientation as number) ?? 0)) || 0;

        const _alpha = THREE.MathUtils.degToRad(alpha);
        const _beta  = THREE.MathUtils.degToRad(beta);
        const _gamma = THREE.MathUtils.degToRad(gamma);
        const _orient = THREE.MathUtils.degToRad(screenAngle);

        const euler = new THREE.Euler(_beta, _alpha, -_gamma, "YXZ");
        const deviceQ = new THREE.Quaternion().setFromEuler(euler);
        const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
        deviceQ.multiply(q1);
        const zee = new THREE.Vector3(0, 0, 1);
        deviceQ.multiply(new THREE.Quaternion().setFromAxisAngle(zee, -_orient));

        if (needsRecenter.current) {
          refQuat.current.copy(deviceQ).invert();
          needsRecenter.current = false;
        }

        const targetQ = refQuat.current.clone().multiply(deviceQ);
        camera.quaternion.slerp(targetQ, 0.12);
      } else {
        // Desktop mouse drag or steady view
        const { yaw, pitch } = mouseDragRef.current;
        camera.rotation.set(pitch, yaw, 0, "YXZ");
      }

      // ── Song-Beat Quantized Spawning ──
      // Spawns strictly on song beat indices so every cube lands on the hit line on a beat!
      const beatStep = bCfg.spawnBeatStep;
      const currentBeatIndex = Math.floor(songTime / (beatDuration * beatStep));

      if (isPlaying && currentBeatIndex > lastSpawnedBeatRef.current) {
        lastSpawnedBeatRef.current = currentBeatIndex;

        let shouldSpawn = false;
        if (difficulty === "easy") {
          shouldSpawn = true;
        } else if (difficulty === "normal") {
          // 3 beats on, 1 beat phrase rest
          shouldSpawn = currentBeatIndex % 4 !== 3;
        } else if (difficulty === "hard") {
          shouldSpawn = true;
        } else if (difficulty === "expert") {
          shouldSpawn = currentBeatIndex % 8 !== 7;
        }

        if (shouldSpawn) {
          spawnCube(scene, bCfg.speed);

          // On strong beats (bar drop), spawn dual cubes on hard/expert
          if ((difficulty === "hard" || difficulty === "expert") && currentBeatIndex % 4 === 0) {
            const lane1 = Math.floor(Math.random() * 2);
            const lane2 = 2 + Math.floor(Math.random() * 2);
            spawnCube(scene, bCfg.speed, lane1);
            spawnCube(scene, bCfg.speed, lane2);
          }
        }
      }

      // ── Move & Rotate Cubes ──
      cubesRef.current.forEach((c) => {
        if (c.hit || c.missed) return;
        c.group.position.z += c.speed * dt;
        c.innerCore.rotation.x += dt * 3.5;
        c.innerCore.rotation.y += dt * 4.0;
        c.ring.rotation.z += dt * 2.8;

        // Cube beat pulse
        const s = 1 + beatPulse * 0.22;
        c.outerMesh.scale.set(s, s, s);

        // Check miss
        if (c.group.position.z > MISS_Z) {
          c.missed = true;
          scene.remove(c.group);
          if (c.type !== "hazard") {
            registerMiss();
          }
        }
      });

      // ── Real-Time Crosshair Lock-On Raycasting ──
      // Casts ray strictly through the center crosshair (0, 0)
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const centerRay = raycaster.ray;

      const activeCubes = cubesRef.current.filter(
        (c) => !c.hit && !c.missed && c.group.position.z >= -18 && c.group.position.z <= 2.2
      );

      let closestCube: CubeItem | null = null;
      let closestDist = LOCK_ON_RADIUS;

      activeCubes.forEach((c) => {
        const dist = centerRay.distanceToPoint(c.group.position);
        if (dist < closestDist) {
          closestDist = dist;
          closestCube = c;
        }
      });

      lockedCubeRef.current = closestCube;
      const isLocked = !!closestCube;
      const lockType = closestCube ? (closestCube as CubeItem).type : null;

      if (
        isLocked !== prevLockStateRef.current.isLocked ||
        lockType !== prevLockStateRef.current.type
      ) {
        prevLockStateRef.current = { isLocked, type: lockType };
        onTargetLock?.(isLocked, lockType);
      }

      // ── Update Shards & Particle FX ──
      for (let i = shardsRef.current.length - 1; i >= 0; i--) {
        const sh = shardsRef.current[i];
        sh.life += dt;
        if (sh.life >= sh.maxLife) {
          scene.remove(sh.mesh);
          sh.mesh.geometry.dispose();
          shardsRef.current.splice(i, 1);
          continue;
        }
        sh.vel.y -= 9.8 * dt; // Gravity
        sh.mesh.position.addScaledVector(sh.vel, dt);
        sh.mesh.rotation.x += sh.rotVel.x * dt;
        sh.mesh.rotation.y += sh.rotVel.y * dt;
        sh.mesh.rotation.z += sh.rotVel.z * dt;
        const progress = sh.life / sh.maxLife;
        (sh.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
      }

      // ── Update Shockwaves ──
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.life += dt;
        if (sw.life >= sw.maxLife) {
          scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          shockwavesRef.current.splice(i, 1);
          continue;
        }
        const s = 1 + sw.life * sw.scaleSpeed;
        sw.mesh.scale.set(s, s, s);
        const progress = sw.life / sw.maxLife;
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.9;
      }

      // Cleanup finished cubes
      cubesRef.current = cubesRef.current.filter((c) => !c.hit && !c.missed);

      renderer.render(scene, camera);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      dom.removeEventListener("touchstart", onPointerDown);
      dom.removeEventListener("mousedown", onPointerDown);

      cubesRef.current.forEach((c) => scene.remove(c.group));
      shardsRef.current.forEach((s) => scene.remove(s.mesh));
      shockwavesRef.current.forEach((s) => scene.remove(s.mesh));
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getBeatConfig, onGyroActive, onTargetLock, triggerShootFromCrosshair]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-crosshair touch-none select-none overflow-hidden"
    />
  );
}
