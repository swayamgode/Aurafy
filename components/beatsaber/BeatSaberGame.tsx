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
  onBlockHit: (isLeft: boolean, intensity: number) => void;
  onMiss: () => void;
  bpm: number;
  recenterTrigger?: number;
  onGyroActive?: (active: boolean) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LANE_X   = [-1.2, -0.4, 0.4, 1.2];
const SPAWN_Z  = -28;
const MISS_Z   = 3.2;
const SABER_LEN = 1.1;
const BLOCK_SZ  = 0.44;
const ARROW_DIRS = ["↑","↓","←","→","↖","↗","↙","↘","●"];

interface Block {
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  isLeft: boolean;
  isBomb: boolean;
  hit: boolean;
  missed: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface TouchPoint {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  side: "left" | "right";
}

export default function BeatSaberGame({
  isPlaying,
  difficulty,
  onScoreUpdate,
  onBlockHit,
  onMiss,
  bpm,
  recenterTrigger = 0,
  onGyroActive,
}: BeatSaberGameProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef      = useRef<THREE.Scene | null>(null);
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);
  const animRef       = useRef<number | null>(null);

  // Camera gyro & recenter
  const gyroRef       = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const gyroActiveRef = useRef(false);
  const refQuat       = useRef(new THREE.Quaternion());
  const needsRecenter = useRef(true);

  // Keyboard slash triggers
  const keySlashLeft  = useRef(0);
  const keySlashRight = useRef(0);

  // Sabers
  const leftSaberRef  = useRef<THREE.Group | null>(null);
  const rightSaberRef = useRef<THREE.Group | null>(null);

  // Saber world positions (updated per frame)
  const leftPos   = useRef(new THREE.Vector3(-0.55, 1.0, 1.2));
  const rightPos  = useRef(new THREE.Vector3( 0.55, 1.0, 1.2));
  const leftPrev  = useRef(new THREE.Vector3(-0.55, 1.0, 1.2));
  const rightPrev = useRef(new THREE.Vector3( 0.55, 1.0, 1.2));

  // Split-touch tracking
  const touchesRef = useRef<Map<number, TouchPoint>>(new Map());

  // Blocks / particles
  const blocksRef    = useRef<Block[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Score
  const scoreRef = useRef({ score: 0, combo: 0, multiplier: 1, misses: 0, hits: 0 });

  // Spawning
  const lastSpawnRef = useRef(0);

  // Trigger recenter on prop change
  useEffect(() => {
    needsRecenter.current = true;
  }, [recenterTrigger]);

  const getDiffCfg = useCallback(() => {
    switch (difficulty) {
      case "easy":   return { speed: 6,  rate: 1.8, lanes: [1,2] };
      case "normal": return { speed: 9,  rate: 1.1, lanes: [0,1,2,3] };
      case "hard":   return { speed: 13, rate: 0.65, lanes: [0,1,2,3] };
      case "expert": return { speed: 18, rate: 0.38, lanes: [0,1,2,3] };
    }
  }, [difficulty]);

  // ── Block face canvas texture ─────────────────────────────────────────────
  const makeBlockTex = (isLeft: boolean, dir: number, isBomb: boolean) => {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64,64,8,64,64,72);
    if (isBomb) {
      g.addColorStop(0,"#555566"); g.addColorStop(1,"#222233");
    } else if (isLeft) {
      g.addColorStop(0,"#ff4455"); g.addColorStop(1,"#aa0011");
    } else {
      g.addColorStop(0,"#33bbff"); g.addColorStop(1,"#0055aa");
    }
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(4,4,120,120,18); ctx.fill();
    ctx.strokeStyle = isBomb ? "#9999aa" : isLeft ? "#ff8899" : "#88ddff";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(10,10,108,108,14); ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 52px Arial";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(isBomb ? "💣" : ARROW_DIRS[dir] ?? "●", 64, 68);
    return new THREE.CanvasTexture(c);
  };

  // ── Spawn block ───────────────────────────────────────────────────────────
  const spawnBlock = useCallback((scene: THREE.Scene) => {
    const cfg = getDiffCfg();
    const lane = cfg.lanes[Math.floor(Math.random() * cfg.lanes.length)];
    const isLeft = Math.random() < 0.5;
    const isBomb = Math.random() < 0.07;
    const dir = isBomb ? 8 : Math.floor(Math.random() * 9);

    const tex = makeBlockTex(isLeft, dir, isBomb);
    const geo = new THREE.BoxGeometry(BLOCK_SZ, BLOCK_SZ, BLOCK_SZ);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(isBomb ? 0x111122 : isLeft ? 0x660010 : 0x002266),
      emissiveIntensity: 0.5,
      roughness: 0.2, metalness: 0.7,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(LANE_X[lane], 1.0 + (Math.random() - 0.5) * 0.5, SPAWN_Z);
    scene.add(mesh);

    // Outline glow ring
    const glowGeo = new THREE.BoxGeometry(BLOCK_SZ + 0.08, BLOCK_SZ + 0.08, BLOCK_SZ + 0.08);
    const glowMat = new THREE.MeshBasicMaterial({
      color: isBomb ? 0x555566 : isLeft ? 0xd7192f : 0x00aaff,
      transparent: true, opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(mesh.position);
    scene.add(glow);

    blocksRef.current.push({ mesh, glow, isLeft, isBomb, hit: false, missed: false });
  }, [getDiffCfg]);

  // ── Hit explosion ─────────────────────────────────────────────────────────
  const explode = (scene: THREE.Scene, pos: THREE.Vector3, isLeft: boolean) => {
    const color = isLeft ? 0xff3344 : 0x22ccff;
    for (let i = 0; i < 20; i++) {
      const sz = 0.05 + Math.random() * 0.08;
      const g = new THREE.OctahedronGeometry(sz);
      const m = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 1,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(g, m);
      mesh.position.copy(pos);
      scene.add(mesh);
      const speed = 2.5 + Math.random() * 4;
      const a = Math.random() * Math.PI * 2;
      const el = (Math.random() - 0.5) * Math.PI;
      particlesRef.current.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(a) * Math.cos(el) * speed,
          Math.sin(el) * speed,
          (Math.random() - 0.5) * speed,
        ),
        life: 0, maxLife: 0.4 + Math.random() * 0.25,
      });
    }
  };

  // ── Score helpers ─────────────────────────────────────────────────────────
  const addScore = (intensity: number) => {
    const s = scoreRef.current;
    s.combo++;
    s.multiplier = Math.min(8, 1 + Math.floor(s.combo / 8));
    s.score += Math.round(100 * s.multiplier * (0.7 + intensity * 0.3));
    s.hits++;
    onScoreUpdate({ ...s, accuracy: (s.hits / (s.hits + s.misses)) * 100 });
  };
  const doMiss = () => {
    const s = scoreRef.current;
    s.combo = 0; s.multiplier = 1; s.misses++;
    onMiss();
    onScoreUpdate({ ...s, accuracy: s.hits > 0 ? (s.hits / (s.hits + s.misses)) * 100 : 0 });
  };

  // ── Check hits ────────────────────────────────────────────────────────────
  const checkHits = (scene: THREE.Scene) => {
    blocksRef.current.forEach((b) => {
      if (b.hit || b.missed) return;
      const bp = b.mesh.position;

      const dL = leftPos.current.distanceTo(bp);
      const dR = rightPos.current.distanceTo(bp);

      if (!b.isBomb) {
        if (dL < 0.6 && b.isLeft) {
          b.hit = true;
          scene.remove(b.mesh); scene.remove(b.glow);
          explode(scene, bp.clone(), true);
          onBlockHit(true, 1 - Math.min(1, dL / 0.6));
          addScore(1 - dL / 0.6);
          return;
        }
        if (dR < 0.6 && !b.isLeft) {
          b.hit = true;
          scene.remove(b.mesh); scene.remove(b.glow);
          explode(scene, bp.clone(), false);
          onBlockHit(false, 1 - Math.min(1, dR / 0.6));
          addScore(1 - dR / 0.6);
          return;
        }
        // Wrong-saber miss
        if ((dL < 0.6 && !b.isLeft) || (dR < 0.6 && b.isLeft)) {
          b.missed = true;
          scene.remove(b.mesh); scene.remove(b.glow);
          doMiss();
        }
      } else {
        if (dL < 0.6 || dR < 0.6) {
          b.missed = true;
          scene.remove(b.mesh); scene.remove(b.glow);
          doMiss();
        }
      }
    });
  };

  // ── Three.js scene setup ──────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030508);
    scene.fog = new THREE.FogExp2(0x06091a, 0.022);
    sceneRef.current = scene;

    // Camera — first-person, looking forward down the track
    const camera = new THREE.PerspectiveCamera(80, container.clientWidth / container.clientHeight, 0.05, 200);
    camera.position.set(0, 1.6, 3.5);
    cameraRef.current = camera;

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x1a1a3a, 1.8));
    const lSpot = new THREE.SpotLight(0xd7192f, 5, 22, Math.PI / 5, 0.4);
    lSpot.position.set(-3, 7, 0); lSpot.target.position.set(-1, 0, -5);
    scene.add(lSpot, lSpot.target);
    const rSpot = new THREE.SpotLight(0x00b4ff, 5, 22, Math.PI / 5, 0.4);
    rSpot.position.set(3, 7, 0); rSpot.target.position.set(1, 0, -5);
    scene.add(rSpot, rSpot.target);

    // ── Floor track ──
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x080b18, roughness: 0.08, metalness: 0.95 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 60), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -25);
    scene.add(floor);

    // Lane dividers
    for (let i = 0; i <= 4; i++) {
      const lm = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.015, 60),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x334466 : 0x222244, transparent: true, opacity: 0.6 })
      );
      lm.position.set(-2.1 + i * 1.05, 0.01, -25); scene.add(lm);
    }

    // Neon edge rails
    const mkEdge = (x: number, col: number) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.07, 60),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
      );
      m.position.set(x, 0.04, -25); scene.add(m);
    };
    mkEdge(-2.1, 0xd7192f); mkEdge(2.1, 0x00b4ff);

    // Side walls (cyberpunk panels)
    [-3.8, 3.8].forEach((sx) => {
      const wall = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 6),
        new THREE.MeshStandardMaterial({ color: 0x080c1a, roughness: 0.7, metalness: 0.4 })
      );
      wall.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
      wall.position.set(sx, 3, -25); scene.add(wall);
    });

    // Ceiling light strip
    const ceilStrip = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.1, 60),
      new THREE.MeshBasicMaterial({ color: 0x111133, transparent: true, opacity: 0.9 })
    );
    ceilStrip.position.set(0, 5.5, -25); scene.add(ceilStrip);

    // ── Build sabers ──────────────────────────────────────────────────────
    const buildSaber = (isLeft: boolean): THREE.Group => {
      const g = new THREE.Group();
      // Handle
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.030, 0.035, 0.28, 12),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.15, metalness: 0.95 })
      );
      handle.position.y = 0.14; g.add(handle);

      // Blade
      const bladeCol = isLeft ? 0xd7192f : 0x00aaff;
      const blade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.017, 0.021, SABER_LEN, 10),
        new THREE.MeshBasicMaterial({ color: bladeCol })
      );
      blade.position.y = 0.28 + SABER_LEN / 2; g.add(blade);

      // Glow halo
      const glow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, SABER_LEN, 10),
        new THREE.MeshBasicMaterial({
          color: isLeft ? 0xff3344 : 0x22ccff,
          transparent: true, opacity: 0.28,
          blending: THREE.AdditiveBlending,
        })
      );
      glow.position.y = 0.28 + SABER_LEN / 2; g.add(glow);

      // Tip light
      const tip = new THREE.PointLight(bladeCol, 2.8, 2.0);
      tip.position.y = 0.28 + SABER_LEN + 0.1; g.add(tip);

      return g;
    };

    const lSaber = buildSaber(true);
    const rSaber = buildSaber(false);
    lSaber.position.copy(leftPos.current);
    rSaber.position.copy(rightPos.current);
    scene.add(lSaber); scene.add(rSaber);
    leftSaberRef.current = lSaber;
    rightSaberRef.current = rSaber;

    // ── Gyroscope (device orientation) → camera ───────────────────────────
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

    // ── Keyboard controls for PC / Laptop ─────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === "a" || k === "arrowleft" || k === "q") {
        keySlashLeft.current = performance.now();
      }
      if (k === "d" || k === "arrowright" || k === "e") {
        keySlashRight.current = performance.now();
      }
      if (k === " " || k === "w" || k === "arrowup") {
        keySlashLeft.current = performance.now();
        keySlashRight.current = performance.now();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // ── Split-touch: left half = left saber, right half = right saber ─────
    const W = () => container.clientWidth;
    const H = () => container.clientHeight;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((t) => {
        const side = t.clientX < W() / 2 ? "left" : "right";
        if (side === "left") keySlashLeft.current = performance.now();
        if (side === "right") keySlashRight.current = performance.now();
        touchesRef.current.set(t.identifier, {
          id: t.identifier,
          startX: t.clientX, startY: t.clientY,
          x: t.clientX, y: t.clientY, side,
        });
      });
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((t) => {
        const tp = touchesRef.current.get(t.identifier);
        if (tp) {
          // Detect rapid swipe velocity for slash effect
          const dy = Math.abs(t.clientY - tp.y);
          if (dy > 12) {
            if (tp.side === "left") keySlashLeft.current = performance.now();
            if (tp.side === "right") keySlashRight.current = performance.now();
          }
          tp.x = t.clientX;
          tp.y = t.clientY;
        }
      });
    };

    const onTouchEnd = (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach((t) => {
        touchesRef.current.delete(t.identifier);
      });
    };

    const dom = renderer.domElement;
    dom.addEventListener("touchstart", onTouchStart, { passive: false });
    dom.addEventListener("touchmove",  onTouchMove,  { passive: false });
    dom.addEventListener("touchend",   onTouchEnd,   { passive: false });

    // Mouse control — tracking + slash on click
    let mouseDown = false;
    let mx = container.clientWidth / 2;
    let my = container.clientHeight / 2;
    const onMouseDown = (e: MouseEvent) => {
      mouseDown = true;
      mx = e.clientX;
      my = e.clientY;
      if (e.button === 0) {
        keySlashLeft.current = performance.now();
      } else if (e.button === 2) {
        keySlashRight.current = performance.now();
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const onMouseUp = () => { mouseDown = false; };
    const onContextMenu = (e: MouseEvent) => { e.preventDefault(); };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    window.addEventListener("contextmenu", onContextMenu);

    // Resize
    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Render loop ───────────────────────────────────────────────────────
    let lastTime = performance.now();

    const animate = (now: number) => {
      animRef.current = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;
      const elapsed = now / 1000;

      // ── Camera: VR Gyro tilt / orientation look around ───────────────
      if (gyroActiveRef.current && gyroRef.current) {
        const { alpha, beta, gamma } = gyroRef.current;
        const screenAngle = (typeof window !== "undefined" && ((window.screen?.orientation?.angle) ?? (window.orientation as number) ?? 0)) || 0;

        const _alpha  = THREE.MathUtils.degToRad(alpha);
        const _beta   = THREE.MathUtils.degToRad(beta);
        const _gamma  = THREE.MathUtils.degToRad(gamma);
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
        camera.quaternion.slerp(targetQ, 0.16);
      } else {
        // No gyro: camera looks straight forward with slight idle bob
        const bob = Math.sin(elapsed * 1.2) * 0.005;
        camera.rotation.set(bob, 0, 0, "YXZ");
      }

      // ── Saber positions from touch ────────────────────────────────────
      const w = W(), h = H();
      let leftTouchX: number | null = null,  leftTouchY: number | null = null;
      let rightTouchX: number | null = null, rightTouchY: number | null = null;

      touchesRef.current.forEach((tp) => {
        if (tp.side === "left")  { leftTouchX  = tp.x; leftTouchY  = tp.y; }
        if (tp.side === "right") { rightTouchX = tp.x; rightTouchY = tp.y; }
      });

      if (leftTouchX !== null && leftTouchY !== null) {
        // Map touch position on screen → saber world position
        const nx = ((leftTouchX as number) / w) * 2 - 1;
        const ny = -((leftTouchY as number) / h) * 2 + 1;
        leftPos.current.x = THREE.MathUtils.lerp(leftPos.current.x, THREE.MathUtils.clamp(nx * 1.6 - 0.2, -1.9, 0.3), 0.35);
        leftPos.current.y = THREE.MathUtils.lerp(leftPos.current.y, THREE.MathUtils.clamp(ny * 0.9 + 1.0, 0.2, 2.5), 0.35);
      } else if (!touchesRef.current.size) {
        // Mouse control fallback
        const nx = (mx / w) * 2 - 1;
        const ny = -(my / h) * 2 + 1;
        leftPos.current.x = THREE.MathUtils.lerp(leftPos.current.x, nx * 1.4 - 0.35, 0.25);
        leftPos.current.y = THREE.MathUtils.lerp(leftPos.current.y, THREE.MathUtils.clamp(ny * 0.8 + 1.0, 0.3, 2.4), 0.25);
      } else {
        // Return left saber to idle
        leftPos.current.x = THREE.MathUtils.lerp(leftPos.current.x, -0.55 + Math.sin(elapsed * 1.8) * 0.03, 0.08);
        leftPos.current.y = THREE.MathUtils.lerp(leftPos.current.y, 1.0, 0.08);
      }

      if (rightTouchX !== null && rightTouchY !== null) {
        const nx = ((rightTouchX as number) / w) * 2 - 1;
        const ny = -((rightTouchY as number) / h) * 2 + 1;
        rightPos.current.x = THREE.MathUtils.lerp(rightPos.current.x, THREE.MathUtils.clamp(nx * 1.6 + 0.2, -0.3, 1.9), 0.35);
        rightPos.current.y = THREE.MathUtils.lerp(rightPos.current.y, THREE.MathUtils.clamp(ny * 0.9 + 1.0, 0.2, 2.5), 0.35);
      } else if (!touchesRef.current.size) {
        // Mouse control fallback
        const nx = (mx / w) * 2 - 1;
        const ny = -(my / h) * 2 + 1;
        rightPos.current.x = THREE.MathUtils.lerp(rightPos.current.x, nx * 1.4 + 0.35, 0.25);
        rightPos.current.y = THREE.MathUtils.lerp(rightPos.current.y, THREE.MathUtils.clamp(ny * 0.8 + 1.0, 0.3, 2.4), 0.25);
      } else {
        rightPos.current.x = THREE.MathUtils.lerp(rightPos.current.x, 0.55 - Math.sin(elapsed * 1.8) * 0.03, 0.08);
        rightPos.current.y = THREE.MathUtils.lerp(rightPos.current.y, 1.0, 0.08);
      }

      // ── Slash motion animation (Keys / Quick Swipes / Clicks) ───────────
      const leftSlashAge = now - keySlashLeft.current;
      let leftSlashZOffset = 0;
      let leftSlashTilt = 0;
      if (leftSlashAge < 200) {
        const p = leftSlashAge / 200;
        leftSlashZOffset = -Math.sin(p * Math.PI) * 0.6;
        leftSlashTilt = Math.sin(p * Math.PI) * 0.9;
      }

      const rightSlashAge = now - keySlashRight.current;
      let rightSlashZOffset = 0;
      let rightSlashTilt = 0;
      if (rightSlashAge < 200) {
        const p = rightSlashAge / 200;
        rightSlashZOffset = -Math.sin(p * Math.PI) * 0.6;
        rightSlashTilt = Math.sin(p * Math.PI) * 0.9;
      }

      // Saber swing rotation based on velocity + slash pulse
      const lVel = new THREE.Vector3().subVectors(leftPos.current,  lSaber.position);
      const rVel = new THREE.Vector3().subVectors(rightPos.current, rSaber.position);
      lSaber.rotation.z = THREE.MathUtils.lerp(lSaber.rotation.z, -Math.atan2(lVel.y, lVel.x) * 0.55 - 0.2, 0.25);
      rSaber.rotation.z = THREE.MathUtils.lerp(rSaber.rotation.z, -Math.atan2(rVel.y, rVel.x) * 0.55 + 0.2, 0.25);
      lSaber.rotation.x = THREE.MathUtils.lerp(lSaber.rotation.x, leftSlashTilt, 0.3);
      rSaber.rotation.x = THREE.MathUtils.lerp(rSaber.rotation.x, rightSlashTilt, 0.3);

      leftPos.current.z = 1.2 + leftSlashZOffset;
      rightPos.current.z = 1.2 + rightSlashZOffset;

      lSaber.position.copy(leftPos.current);
      rSaber.position.copy(rightPos.current);

      // ── Block spawning ────────────────────────────────────────────────
      const cfg = getDiffCfg();
      if (isPlaying && elapsed - lastSpawnRef.current >= cfg.rate) {
        lastSpawnRef.current = elapsed;
        spawnBlock(scene);
        if ((difficulty === "hard" || difficulty === "expert") && Math.random() < 0.4) {
          spawnBlock(scene);
        }
      }

      // ── Move blocks ───────────────────────────────────────────────────
      blocksRef.current.forEach((b) => {
        if (b.hit || b.missed) return;
        b.mesh.position.z += cfg.speed * dt;
        b.glow.position.z  += cfg.speed * dt;
        b.mesh.rotation.y  += dt * 0.6;
        b.glow.rotation.y  += dt * 0.6;
        if (b.mesh.position.z > MISS_Z) {
          b.missed = true;
          scene.remove(b.mesh); scene.remove(b.glow);
          doMiss();
        }
      });
      blocksRef.current = blocksRef.current.filter((b) => !b.hit && !b.missed);

      // ── Hit detection ─────────────────────────────────────────────────
      checkHits(scene);

      // ── Particles ─────────────────────────────────────────────────────
      particlesRef.current.forEach((p) => {
        p.life += dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.vel.y -= 5 * dt;
        const t = p.life / p.maxLife;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - t;
        p.mesh.scale.setScalar(1 - t * 0.5);
      });
      particlesRef.current = particlesRef.current.filter((p) => {
        if (p.life >= p.maxLife) { scene.remove(p.mesh); return false; }
        return true;
      });

      renderer.render(scene, camera);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("resize",    onResize);
      dom.removeEventListener("touchstart", onTouchStart);
      dom.removeEventListener("touchmove",  onTouchMove);
      dom.removeEventListener("touchend",   onTouchEnd);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      blocksRef.current = [];
      particlesRef.current = [];
    };
  }, [difficulty]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none"
      style={{ touchAction: "none" }}
    />
  );
}
