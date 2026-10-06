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
}

interface BeatSaberGameProps {
  isPlaying: boolean;
  difficulty: Difficulty;
  onScoreUpdate: (update: ScoreUpdate) => void;
  onBlockHit: (isSpecial: boolean, intensity: number) => void;
  onMiss: () => void;
  bpm?: number;
  recenterTrigger?: number;
  isGyroEnabled?: boolean;
  onGyroActive?: (active: boolean) => void;
}

// ─── Sound FX Synthesizer (Zero dependencies, instant arcade pops) ────────────
function playBurstSfx(pitch = 560, isHazard = false) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isHazard ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(isHazard ? 140 : pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isHazard ? 60 : pitch * 1.8, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
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

interface CubeItem {
  group: THREE.Group;
  outerMesh: THREE.Mesh;
  innerCore: THREE.Mesh;
  ring: THREE.Mesh;
  pointLight?: THREE.PointLight;
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

  // Score
  const scoreRef = useRef({ score: 0, combo: 0, multiplier: 1, misses: 0, hits: 0 });

  // Rhythm Spawning
  const lastSpawnRef = useRef(0);
  const beatTimerRef = useRef(0);

  // Trigger recenter on prop change
  useEffect(() => {
    needsRecenter.current = true;
    mouseDragRef.current.yaw = 0;
    mouseDragRef.current.pitch = 0;
  }, [recenterTrigger]);

  const getDiffCfg = useCallback(() => {
    switch (difficulty) {
      case "easy":   return { speed: 8,  interval: 1.2,  hazardChance: 0.05, goldChance: 0.15 };
      case "normal": return { speed: 11, interval: 0.85, hazardChance: 0.08, goldChance: 0.20 };
      case "hard":   return { speed: 15, interval: 0.55, hazardChance: 0.12, goldChance: 0.25 };
      case "expert": return { speed: 20, interval: 0.38, hazardChance: 0.15, goldChance: 0.30 };
    }
  }, [difficulty]);

  // ── Score Helpers ─────────────────────────────────────────────────────────
  const registerHit = (type: CubeItem["type"]) => {
    const s = scoreRef.current;
    if (type === "hazard") {
      // Penalty for hazard orb
      s.combo = 0;
      s.multiplier = 1;
      s.misses++;
      playBurstSfx(120, true);
      try { navigator.vibrate?.([60, 40, 60]); } catch (_) {}
      onMiss();
      onScoreUpdate({ ...s, accuracy: s.hits > 0 ? (s.hits / (s.hits + s.misses)) * 100 : 0 });
      return;
    }

    s.combo++;
    s.multiplier = Math.min(8, 1 + Math.floor(s.combo / 6));
    const basePts = type === "gold" ? 300 : 100;
    s.score += basePts * s.multiplier;
    s.hits++;
    playBurstSfx(type === "gold" ? 780 : type === "pink" ? 640 : 520, false);
    try { navigator.vibrate?.(type === "gold" ? [40, 20, 40] : 30); } catch (_) {}
    onBlockHit(type === "gold", 1.0);
    onScoreUpdate({ ...s, accuracy: (s.hits / (s.hits + s.misses)) * 100 });
  };

  const registerMiss = () => {
    const s = scoreRef.current;
    s.combo = 0;
    s.multiplier = 1;
    s.misses++;
    onMiss();
    onScoreUpdate({ ...s, accuracy: s.hits > 0 ? (s.hits / (s.hits + s.misses)) * 100 : 0 });
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

  // ── Tap / Click Raycasting to Burst Cubes ──────────────────────────────────
  const handleBurstAtScreenCoord = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      const camera = cameraRef.current;
      const scene = sceneRef.current;
      if (!container || !camera || !scene) return;

      const rect = container.getBoundingClientRect();
      const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      // Check direct mesh raycasting
      const activeCubes = cubesRef.current.filter((c) => !c.hit && !c.missed);
      const meshesToTest = activeCubes.map((c) => c.outerMesh);
      const intersects = raycaster.intersectObjects(meshesToTest, false);

      let targetCube: CubeItem | null = null;

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        targetCube = activeCubes.find((c) => c.outerMesh === hitMesh) || null;
      }

      // Proximity assist (if tapped near an incoming cube or center tap)
      if (!targetCube) {
        const ray = raycaster.ray;
        let closestDist = 1.35; // generous hit radius
        activeCubes.forEach((c) => {
          if (c.group.position.z > -16 && c.group.position.z < 2.5) {
            const dist = ray.distanceToPoint(c.group.position);
            if (dist < closestDist) {
              closestDist = dist;
              targetCube = c;
            }
          }
        });
      }

      if (targetCube) {
        const c = targetCube as CubeItem;
        c.hit = true;
        scene.remove(c.group);
        spawnBurstEffect(scene, c.group.position, c.type);
        registerHit(c.type);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Spawn Futuristic Crystal Cube ─────────────────────────────────────────
  const spawnCube = useCallback(
    (scene: THREE.Scene) => {
      const cfg = getDiffCfg();
      const lane = Math.floor(Math.random() * LANE_X.length);
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
        emissiveIntensity: 0.65,
        roughness: 0.1,
        metalness: 0.4,
        transparent: true,
        opacity: 0.85,
        transmission: 0.25,
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      group.add(outerMesh);

      // Neon Wireframe Edge Edges
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

      group.position.set(LANE_X[lane], 1.2 + (Math.random() - 0.5) * 0.4, SPAWN_Z);
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
        speed: cfg.speed,
      });
    },
    [getDiffCfg]
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
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a);
    scene.fog = new THREE.FogExp2(0x040816, 0.024);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(78, container.clientWidth / container.clientHeight, 0.1, 300);
    camera.position.set(0, 1.5, 3.2);
    cameraRef.current = camera;

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0x1a243b, 1.5));
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

    // ── Infinite Reflective Cyber Track ──
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x050814,
      roughness: 0.15,
      metalness: 0.9,
    });
    const track = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 80), trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, 0, -28);
    scene.add(track);

    // Neon Track Divider Rails
    for (let l = -2; l <= 2; l++) {
      const railGeo = new THREE.BoxGeometry(0.04, 0.02, 80);
      const railMat = new THREE.MeshBasicMaterial({
        color: l === -2 || l === 2 ? 0xff007f : 0x00f0ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(l * 1.05, 0.02, -28);
      scene.add(rail);
    }

    // ── Neon Hexagonal Archways Over Highway ──
    const archways: THREE.Mesh[] = [];
    for (let a = 0; a < 6; a++) {
      const archGeo = new THREE.TorusGeometry(3.2, 0.05, 6, 6);
      const archMat = new THREE.MeshBasicMaterial({
        color: a % 2 === 0 ? 0x00f0ff : 0xff007f,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(0, 1.8, -6 - a * 6);
      scene.add(arch);
      archways.push(arch);
    }
    archwaysRef.current = archways;

    // ── Equalizer Visualizer Towers Flanking Track ──
    const eqBars: THREE.Mesh[] = [];
    const numBars = 18;
    for (let b = 0; b < numBars; b++) {
      [-3.6, 3.6].forEach((sideX) => {
        const barGeo = new THREE.BoxGeometry(0.35, 1, 0.35);
        const barMat = new THREE.MeshStandardMaterial({
          color: sideX < 0 ? 0xff007f : 0x00f0ff,
          emissive: sideX < 0 ? 0x660033 : 0x003366,
          roughness: 0.3,
          metalness: 0.7,
        });
        const barMesh = new THREE.Mesh(barGeo, barMat);
        barMesh.position.set(sideX, 0.5, -4 - b * 2);
        scene.add(barMesh);
        eqBars.push(barMesh);
      });
    }
    eqBarsRef.current = eqBars;

    // ── Deep Starfield & Floating Cyber Dust ──
    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let s = 0; s < starCount * 3; s += 3) {
      starPos[s] = (Math.random() - 0.5) * 60;
      starPos[s + 1] = Math.random() * 25 + 1;
      starPos[s + 2] = (Math.random() - 0.5) * 80;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ── Mobile Device Orientation (Gyro VR) ──
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

    // ── Touch and Mouse Input Handling (Tap to Burst!) ──
    const dom = renderer.domElement;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ("touches" in e) {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        }
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
        mouseDragRef.current.isDown = true;
        mouseDragRef.current.startX = clientX;
        mouseDragRef.current.startY = clientY;
      }
      handleBurstAtScreenCoord(clientX, clientY);
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

    dom.addEventListener("touchstart", onPointerDown, { passive: false });
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

      // ── Song Beat Pulse & Frequency ──
      const beatInterval = 60 / (bpm || 128);
      beatTimerRef.current += dt;
      const beatProgress = (beatTimerRef.current % beatInterval) / beatInterval;
      const beatPulse = Math.sin(beatProgress * Math.PI) * 0.25;

      // Pulse Equalizer Towers to Beat
      eqBarsRef.current.forEach((bar, idx) => {
        const h = Math.max(0.4, Math.sin(elapsed * 8 + idx * 0.6) * 1.8 + beatPulse * 2.2 + 0.8);
        bar.scale.y = h;
        bar.position.y = h / 2;
      });

      // Sway Searchlights to Beat
      searchlightsRef.current.forEach((sl, idx) => {
        const sweep = Math.sin(elapsed * 2.5 + idx * 1.5) * 6;
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
        // Desktop mouse drag or gentle idle bob
        const { yaw, pitch } = mouseDragRef.current;
        camera.rotation.set(pitch, yaw, 0, "YXZ");
      }

      // ── Spawn Cubes in Rhythm to Beat ──
      const cfg = getDiffCfg();
      if (isPlaying && elapsed - lastSpawnRef.current >= cfg.interval) {
        lastSpawnRef.current = elapsed;
        spawnCube(scene);
        if ((difficulty === "hard" || difficulty === "expert") && Math.random() < 0.4) {
          spawnCube(scene);
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
        const s = 1 + beatPulse * 0.15;
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
      cubesRef.current = cubesRef.current.filter((c) => !c.hit && !c.missed);

      // ── Animate Shards ──
      shardsRef.current.forEach((sh) => {
        sh.life += dt;
        sh.mesh.position.addScaledVector(sh.vel, dt);
        sh.vel.y -= 7.5 * dt; // gravity
        sh.mesh.rotation.x += sh.rotVel.x * dt;
        sh.mesh.rotation.y += sh.rotVel.y * dt;
        const progress = sh.life / sh.maxLife;
        (sh.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
        sh.mesh.scale.setScalar(1 - progress * 0.4);
      });
      shardsRef.current = shardsRef.current.filter((sh) => {
        if (sh.life >= sh.maxLife) {
          scene.remove(sh.mesh);
          sh.mesh.geometry.dispose();
          return false;
        }
        return true;
      });

      // ── Animate Shockwaves ──
      shockwavesRef.current.forEach((sw) => {
        sw.life += dt;
        const s = 1 + sw.life * sw.scaleSpeed;
        sw.mesh.scale.set(s, s, s);
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - sw.life / sw.maxLife;
      });
      shockwavesRef.current = shockwavesRef.current.filter((sw) => {
        if (sw.life >= sw.maxLife) {
          scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          return false;
        }
        return true;
      });

      renderer.render(scene, camera);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("resize", onResize);
      dom.removeEventListener("touchstart", onPointerDown);
      dom.removeEventListener("mousedown", onPointerDown);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      cubesRef.current = [];
      shardsRef.current = [];
      shockwavesRef.current = [];
    };
  }, [difficulty, isPlaying, isGyroEnabled, getDiffCfg, spawnCube, handleBurstAtScreenCoord, bpm]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-crosshair"
      style={{ touchAction: "none" }}
    />
  );
}
