"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export type VREnvironment = "concert" | "lofi" | "lake" | "cyberpunk";
export type CameraPreset =
  | "front_row"
  | "crowd_pit"
  | "stage_pov"
  | "balcony"
  | "campfire"
  | "lake"
  | "mountain"
  | "stargaze";

interface VRConcertSceneProps {
  environment: VREnvironment;
  isStereoVR: boolean; // Side-by-side Cardboard / VR headset mode
  isGyroEnabled: boolean;
  cameraPreset?: CameraPreset;
  isPlaying: boolean;
  progress: number;
  trackTitle?: string;
  artistName?: string;
  thumbnailUrl?: string;
}

export default function VRConcertScene({
  environment,
  isStereoVR,
  isGyroEnabled,
  cameraPreset = "front_row",
  isPlaying,
  progress,
  trackTitle = "Track",
  artistName = "Artist",
  thumbnailUrl,
}: VRConcertSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameId = useRef<number | null>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const stereoCameraRef = useRef<THREE.StereoCamera | null>(null);

  // Dynamic elements
  const envGroupRef = useRef<THREE.Group | null>(null);
  const dynamicUpdatersRef = useRef<((delta: number, elapsed: number) => void)[]>([]);
  const ledCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ledTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const albumImgRef = useRef<HTMLImageElement | null>(null);
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());

  // Interaction / Orientation state
  const isPointerDown = useRef<boolean>(false);
  const prevPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngles = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 0));
  const currentCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 0));
  const gyroOrientation = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);

  // Load album artwork image for LED screen
  useEffect(() => {
    if (!thumbnailUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = thumbnailUrl;
    img.onload = () => {
      albumImgRef.current = img;
    };
  }, [thumbnailUrl]);

  // Handle Preset Camera Positions
  useEffect(() => {
    switch (cameraPreset) {
      case "front_row":
        targetCameraPos.current.set(0, 1.8, 8);
        cameraAngles.current = { yaw: 0, pitch: 0.05 };
        break;
      case "crowd_pit":
        targetCameraPos.current.set(0, 1.8, 0);
        cameraAngles.current = { yaw: 0, pitch: 0.1 };
        break;
      case "stage_pov":
        targetCameraPos.current.set(0, 3.2, -6);
        cameraAngles.current = { yaw: Math.PI, pitch: -0.05 };
        break;
      case "balcony":
        targetCameraPos.current.set(0, 8.0, 18);
        cameraAngles.current = { yaw: 0, pitch: -0.2 };
        break;
      case "campfire":
        targetCameraPos.current.set(0, 1.4, 3.2);
        cameraAngles.current = { yaw: 0, pitch: 0.08 };
        break;
      case "lake":
        targetCameraPos.current.set(-4, 1.5, 6);
        cameraAngles.current = { yaw: 0.35, pitch: 0.1 };
        break;
      case "mountain":
        targetCameraPos.current.set(0, 3.5, 0);
        cameraAngles.current = { yaw: 0, pitch: 0.05 };
        break;
      case "stargaze":
        targetCameraPos.current.set(0, 1.0, 1.5);
        cameraAngles.current = { yaw: 0, pitch: 0.85 }; // Looking up at Milky Way
        break;
    }
  }, [cameraPreset]);

  // Handle DeviceOrientation Gyroscope
  useEffect(() => {
    if (!isGyroEnabled) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        gyroOrientation.current = {
          alpha: e.alpha,
          beta: e.beta,
          gamma: e.gamma,
        };
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [isGyroEnabled]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.copy(currentCameraPos.current);
    cameraRef.current = camera;

    const stereoCamera = new THREE.StereoCamera();
    stereoCamera.eyeSep = 0.064;
    stereoCameraRef.current = stereoCamera;

    // Pointer events for smooth 360 look-around
    const onPointerDown = (e: PointerEvent) => {
      isPointerDown.current = true;
      prevPointer.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown.current) return;
      const dx = e.clientX - prevPointer.current.x;
      const dy = e.clientY - prevPointer.current.y;
      prevPointer.current = { x: e.clientX, y: e.clientY };

      const sens = 0.0035;
      cameraAngles.current.yaw -= dx * sens;
      cameraAngles.current.pitch = Math.max(
        -Math.PI / 2.2,
        Math.min(Math.PI / 2.2, cameraAngles.current.pitch + dy * sens)
      );
    };

    const onPointerUp = () => {
      isPointerDown.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Helper to load 360 Photosphere texture
  const loadPanoTexture = (url: string, onLoad: (tex: THREE.Texture) => void) => {
    if (textureCacheRef.current.has(url)) {
      onLoad(textureCacheRef.current.get(url)!);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      textureCacheRef.current.set(url, tex);
      onLoad(tex);
    });
  };

  // Rebuild 3D Environment on Switch
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (envGroupRef.current) {
      scene.remove(envGroupRef.current);
      envGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
    }

    const envGroup = new THREE.Group();
    scene.add(envGroup);
    envGroupRef.current = envGroup;
    dynamicUpdatersRef.current = [];

    if (environment === "concert") {
      buildRealisticConcert(scene, envGroup);
    } else if (environment === "lofi") {
      buildRealisticMountainNight(scene, envGroup);
    } else if (environment === "lake") {
      buildRealisticLakeNight(scene, envGroup);
    } else {
      buildCyberpunkEnvironment(scene, envGroup);
    }
  }, [environment]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. REALISTIC STADIUM CONCERT ARENA (The Weeknd / Massive Stadium Show)
  // ─────────────────────────────────────────────────────────────────────────────
  const buildRealisticConcert = (scene: THREE.Scene, envGroup: THREE.Group) => {
    scene.background = new THREE.Color(0x05060a);
    scene.fog = new THREE.FogExp2(0x0a0c16, 0.012);

    // Realistic 360 Concert Stadium Dome
    loadPanoTexture("/vr/concert_stadium_360.jpg", (tex) => {
      const panoGeo = new THREE.SphereGeometry(350, 64, 32);
      panoGeo.scale(-1, 1, 1);
      const panoMat = new THREE.MeshBasicMaterial({ map: tex });
      const panoMesh = new THREE.Mesh(panoGeo, panoMat);
      panoMesh.rotation.y = -Math.PI / 2;
      envGroup.add(panoMesh);
    });

    const ambientLight = new THREE.AmbientLight(0x2d1a45, 1.2);
    envGroup.add(ambientLight);

    // --- INTERACTIVE FOREGROUND CONCERT STAGE ---
    const stageWidth = 24;
    const stageDepth = 12;
    const stageHeight = 2.0;

    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x12141c,
      roughness: 0.2,
      metalness: 0.8,
    });
    const stage = new THREE.Mesh(new THREE.BoxGeometry(stageWidth, stageHeight, stageDepth), stageMat);
    stage.position.set(0, stageHeight / 2, -10);
    envGroup.add(stage);

    // Runway thrust towards viewer
    const runway = new THREE.Mesh(new THREE.BoxGeometry(4.5, stageHeight, 10), stageMat);
    runway.position.set(0, stageHeight / 2, -1);
    envGroup.add(runway);

    // Neon edge strip on runway
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xd7192f });
    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 10), stripMat);
    stripL.position.set(-2.25, stageHeight + 0.05, -1);
    const stripR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 10), stripMat);
    stripR.position.set(2.25, stageHeight + 0.05, -1);
    envGroup.add(stripL, stripR);

    // --- GIANT LED STAGE BACKDROP SCREEN ---
    const ledCanvas = document.createElement("canvas");
    ledCanvas.width = 1024;
    ledCanvas.height = 512;
    ledCanvasRef.current = ledCanvas;
    const ledTexture = new THREE.CanvasTexture(ledCanvas);
    ledTextureRef.current = ledTexture;

    const ledScreenGeo = new THREE.PlaneGeometry(22, 10);
    const ledScreenMat = new THREE.MeshBasicMaterial({ map: ledTexture });
    const ledScreen = new THREE.Mesh(ledScreenGeo, ledScreenMat);
    ledScreen.position.set(0, stageHeight + 5.5, -15.8);
    envGroup.add(ledScreen);

    // LED glow light casting on arena
    const ledGlow = new THREE.PointLight(0xd7192f, 4.5, 40);
    ledGlow.position.set(0, stageHeight + 5.5, -12);
    envGroup.add(ledGlow);

    // Overhead truss rigging
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x1a1c24, metalness: 0.9, roughness: 0.2 });
    const overheadTruss = new THREE.Mesh(new THREE.BoxGeometry(26, 0.8, 1.2), trussMat);
    overheadTruss.position.set(0, stageHeight + 11.5, -12);
    envGroup.add(overheadTruss);

    // --- REAL-TIME MOVING SPOTLIGHT BEAMS ---
    const spotColors = [0xd7192f, 0x00f0ff, 0x9d00ff, 0xffaa00, 0xd7192f, 0x00d4ff];
    const spotLights: {
      light: THREE.SpotLight;
      target: THREE.Object3D;
      cone: THREE.Mesh;
      baseAngle: number;
      speed: number;
    }[] = [];

    const numSpots = 6;
    for (let i = 0; i < numSpots; i++) {
      const color = spotColors[i % spotColors.length];
      const light = new THREE.SpotLight(color, 6, 60, Math.PI / 7, 0.35, 1.2);
      const x = -10 + (20 / (numSpots - 1)) * i;
      light.position.set(x, stageHeight + 11.2, -12);

      const target = new THREE.Object3D();
      target.position.set(x * 0.8, 0, 6);
      envGroup.add(target);
      light.target = target;
      envGroup.add(light);

      // Volumetric beam cone
      const coneGeo = new THREE.ConeGeometry(3.5, 42, 16, 1, true);
      coneGeo.translate(0, -21, 0);
      coneGeo.rotateX(Math.PI / 2);
      const coneMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.copy(light.position);
      envGroup.add(cone);

      spotLights.push({
        light,
        target,
        cone,
        baseAngle: (i * Math.PI) / 3,
        speed: 1.2 + (i % 2) * 0.4,
      });
    }

    // --- PYRO / SPARK EMITTER PARTICLES ---
    const sparkCount = 180;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = (Math.random() - 0.5) * 18;
      sparkPositions[i * 3 + 1] = stageHeight;
      sparkPositions[i * 3 + 2] = -14 + Math.random() * 2;
      sparkVelocities.push({
        x: (Math.random() - 0.5) * 2,
        y: 6 + Math.random() * 10,
        z: (Math.random() - 0.5) * 2,
      });
    }
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffaa22,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const sparkSystem = new THREE.Points(sparkGeo, sparkMat);
    envGroup.add(sparkSystem);

    // Animation Loop
    dynamicUpdatersRef.current.push((delta, elapsed) => {
      // 1. Moving spotlights
      spotLights.forEach((item, idx) => {
        const sweepTime = elapsed * item.speed;
        const tx = Math.sin(sweepTime + item.baseAngle) * 18;
        const tz = 4 + Math.cos(sweepTime * 0.7 + item.baseAngle) * 14;
        const ty = Math.sin(sweepTime * 1.5) * 2;
        item.target.position.set(tx, Math.max(0, ty), tz);
        item.cone.lookAt(item.target.position);

        const pulse = isPlaying ? 0.7 + Math.sin(elapsed * 8 + idx) * 0.3 : 0.4;
        item.light.intensity = 5 * pulse;
        (item.cone.material as THREE.MeshBasicMaterial).opacity = 0.2 * pulse;
      });

      // 2. Pyro sparks
      if (isPlaying) {
        const posAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
        const positions = posAttr.array as Float32Array;
        for (let i = 0; i < sparkCount; i++) {
          const idx = i * 3;
          positions[idx] += sparkVelocities[i].x * delta;
          positions[idx + 1] += sparkVelocities[i].y * delta;
          positions[idx + 2] += sparkVelocities[i].z * delta;
          sparkVelocities[i].y -= 9.8 * delta;

          if (positions[idx + 1] < stageHeight) {
            positions[idx] = (Math.random() - 0.5) * 18;
            positions[idx + 1] = stageHeight;
            positions[idx + 2] = -14 + Math.random() * 2;
            sparkVelocities[i].y = 5 + Math.random() * 9;
          }
        }
        posAttr.needsUpdate = true;
      }

      // 3. LED Screen
      updateLedScreen(elapsed);
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. REALISTIC LOFI NIGHT MOUNTAIN (Qwantani Plateau & Milky Way Galaxy)
  // ─────────────────────────────────────────────────────────────────────────────
  const buildRealisticMountainNight = (scene: THREE.Scene, envGroup: THREE.Group) => {
    scene.background = new THREE.Color(0x02040c);
    scene.fog = new THREE.FogExp2(0x040816, 0.008);

    // Real 360 Mountain & Milky Way Photosphere
    loadPanoTexture("/vr/mountain_night_360.jpg", (tex) => {
      const panoGeo = new THREE.SphereGeometry(350, 64, 32);
      panoGeo.scale(-1, 1, 1);
      const panoMat = new THREE.MeshBasicMaterial({ map: tex });
      const panoMesh = new THREE.Mesh(panoGeo, panoMat);
      envGroup.add(panoMesh);
    });

    // Moonlight ambiance
    const ambientLight = new THREE.AmbientLight(0x203254, 0.95);
    envGroup.add(ambientLight);

    // Warm campsite clearing ground
    const groundGeo = new THREE.CircleGeometry(8, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x121722,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.02;
    envGroup.add(ground);

    // --- COZY 3D INTERACTIVE CAMPFIRE ---
    const firePos = new THREE.Vector3(0, 0.1, 0);

    // Stone ring around fire
    const stoneGeo = new THREE.DodecahedronGeometry(0.22);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.95 });
    for (let i = 0; i < 11; i++) {
      const angle = (i / 11) * Math.PI * 2;
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(firePos.x + Math.cos(angle) * 0.85, firePos.y + 0.1, firePos.z + Math.sin(angle) * 0.85);
      stone.scale.set(1 + Math.random() * 0.3, 0.7, 1 + Math.random() * 0.3);
      envGroup.add(stone);
    }

    // Campfire wood logs
    const logGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x221309, roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(logGeo, logMat);
      log.position.set(firePos.x, firePos.y + 0.12, firePos.z);
      log.rotation.x = 0.35;
      log.rotation.y = (i * Math.PI) / 2;
      log.rotation.z = 0.2;
      envGroup.add(log);
    }

    // Warm Flickering Campfire Light
    const fireLight = new THREE.PointLight(0xff7722, 5.5, 20, 1.3);
    fireLight.position.set(firePos.x, firePos.y + 0.5, firePos.z);
    envGroup.add(fireLight);

    const fireGlow = new THREE.PointLight(0xff3300, 2.5, 10);
    fireGlow.position.set(firePos.x, firePos.y + 0.2, firePos.z);
    envGroup.add(fireGlow);

    // Rising Animated Embers & Sparks
    const emberCount = 120;
    const emberGeo = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    const emberData: { vx: number; vy: number; vz: number; life: number; maxLife: number }[] = [];

    for (let i = 0; i < emberCount; i++) {
      emberPositions[i * 3] = firePos.x + (Math.random() - 0.5) * 0.5;
      emberPositions[i * 3 + 1] = firePos.y + Math.random() * 1.8;
      emberPositions[i * 3 + 2] = firePos.z + (Math.random() - 0.5) * 0.5;
      emberData.push({
        vx: (Math.random() - 0.5) * 0.25,
        vy: 0.6 + Math.random() * 1.4,
        vz: (Math.random() - 0.5) * 0.25,
        life: Math.random() * 2.5,
        maxLife: 2.0 + Math.random() * 1.5,
      });
    }
    emberGeo.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));
    const emberMat = new THREE.PointsMaterial({
      color: 0xffaa22,
      size: 0.14,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    envGroup.add(embers);

    // --- FLOATING FIREFLIES ---
    const fireflyCount = 50;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPositions = new Float32Array(fireflyCount * 3);
    const fireflyOffsets: { cx: number; cy: number; cz: number; r: number; speed: number; phase: number }[] = [];

    for (let i = 0; i < fireflyCount; i++) {
      const cx = (Math.random() - 0.5) * 14;
      const cy = 1.2 + Math.random() * 2.8;
      const cz = (Math.random() - 0.5) * 14;
      fireflyPositions[i * 3] = cx;
      fireflyPositions[i * 3 + 1] = cy;
      fireflyPositions[i * 3 + 2] = cz;
      fireflyOffsets.push({
        cx,
        cy,
        cz,
        r: 0.6 + Math.random() * 1.4,
        speed: 0.6 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }
    fireflyGeo.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));
    const fireflyMat = new THREE.PointsMaterial({
      color: 0xaaff55,
      size: 0.2,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
    envGroup.add(fireflies);

    // Animation Loop
    dynamicUpdatersRef.current.push((delta, elapsed) => {
      // 1. Campfire light flicker
      const flicker = Math.sin(elapsed * 16) * 0.22 + Math.cos(elapsed * 24) * 0.26;
      fireLight.intensity = (isPlaying ? 5.8 : 4.2) + flicker;

      // 2. Rising embers
      const emberPos = emberGeo.attributes.position as THREE.BufferAttribute;
      const eArr = emberPos.array as Float32Array;
      for (let i = 0; i < emberCount; i++) {
        const idx = i * 3;
        const dat = emberData[i];
        dat.life += delta;
        eArr[idx] += dat.vx * delta + Math.sin(elapsed * 3 + i) * 0.004;
        eArr[idx + 1] += dat.vy * delta;
        eArr[idx + 2] += dat.vz * delta;

        if (dat.life >= dat.maxLife) {
          dat.life = 0;
          eArr[idx] = firePos.x + (Math.random() - 0.5) * 0.4;
          eArr[idx + 1] = firePos.y + 0.1;
          eArr[idx + 2] = firePos.z + (Math.random() - 0.5) * 0.4;
        }
      }
      emberPos.needsUpdate = true;

      // 3. Fireflies
      const ffPos = fireflyGeo.attributes.position as THREE.BufferAttribute;
      const ffArr = ffPos.array as Float32Array;
      for (let i = 0; i < fireflyCount; i++) {
        const idx = i * 3;
        const off = fireflyOffsets[i];
        ffArr[idx] = off.cx + Math.cos(elapsed * off.speed + off.phase) * off.r;
        ffArr[idx + 1] = off.cy + Math.sin(elapsed * (off.speed * 1.5) + off.phase) * 0.35;
        ffArr[idx + 2] = off.cz + Math.sin(elapsed * off.speed + off.phase) * off.r;
      }
      ffPos.needsUpdate = true;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. REALISTIC LOFI ALPINE LAKE NIGHT
  // ─────────────────────────────────────────────────────────────────────────────
  const buildRealisticLakeNight = (scene: THREE.Scene, envGroup: THREE.Group) => {
    scene.background = new THREE.Color(0x030510);
    scene.fog = new THREE.FogExp2(0x050a1a, 0.009);

    loadPanoTexture("/vr/lake_night_360.jpg", (tex) => {
      const panoGeo = new THREE.SphereGeometry(350, 64, 32);
      panoGeo.scale(-1, 1, 1);
      const panoMat = new THREE.MeshBasicMaterial({ map: tex });
      const panoMesh = new THREE.Mesh(panoGeo, panoMat);
      envGroup.add(panoMesh);
    });

    const ambientLight = new THREE.AmbientLight(0x1a2846, 1.0);
    envGroup.add(ambientLight);

    // Warm campfire at lake edge
    const firePos = new THREE.Vector3(0, 0.1, 1.5);
    const fireLight = new THREE.PointLight(0xff7722, 5.0, 18, 1.3);
    fireLight.position.set(firePos.x, firePos.y + 0.5, firePos.z);
    envGroup.add(fireLight);

    dynamicUpdatersRef.current.push((delta, elapsed) => {
      const flicker = Math.sin(elapsed * 15) * 0.2 + Math.cos(elapsed * 23) * 0.25;
      fireLight.intensity = (isPlaying ? 5.5 : 4.0) + flicker;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. CYBERPUNK SYNTHWAVE ROOFTOP
  // ─────────────────────────────────────────────────────────────────────────────
  const buildCyberpunkEnvironment = (scene: THREE.Scene, envGroup: THREE.Group) => {
    scene.background = new THREE.Color(0x060214);
    scene.fog = new THREE.FogExp2(0x110426, 0.016);

    const ambientLight = new THREE.AmbientLight(0x381254, 1.0);
    envGroup.add(ambientLight);

    const roofGeo = new THREE.BoxGeometry(30, 2, 30);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x110c1f, roughness: 0.2, metalness: 0.8 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 0, 0);
    envGroup.add(roof);

    const railMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const railGeo = new THREE.BoxGeometry(30.2, 0.15, 0.15);
    const railFront = new THREE.Mesh(railGeo, railMat);
    railFront.position.set(0, 1.2, 15);
    const railBack = new THREE.Mesh(railGeo, railMat);
    railBack.position.set(0, 1.2, -15);
    envGroup.add(railFront, railBack);

    const towerCount = 36;
    const towers: { mesh: THREE.Mesh; baseH: number; phase: number }[] = [];
    for (let i = 0; i < towerCount; i++) {
      const angle = (i / towerCount) * Math.PI * 2;
      const dist = 45 + Math.random() * 35;
      const w = 6 + Math.random() * 8;
      const h = 25 + Math.random() * 55;
      const towerGeo = new THREE.BoxGeometry(w, h, w);
      const isPink = i % 2 === 0;
      const towerMat = new THREE.MeshStandardMaterial({
        color: isPink ? 0x1d0830 : 0x071e2e,
        roughness: 0.4,
        metalness: 0.7,
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(Math.cos(angle) * dist, h / 2 - 20, Math.sin(angle) * dist);
      envGroup.add(tower);

      towers.push({ mesh: tower, baseH: h, phase: i * 0.4 });
    }

    dynamicUpdatersRef.current.push((delta, elapsed) => {
      towers.forEach((t) => {
        if (isPlaying) {
          const bounce = Math.sin(elapsed * 6 + t.phase) * 4;
          t.mesh.scale.y = Math.max(0.7, 1 + bounce * 0.04);
        }
      });
    });
  };

  // Render LED Backstage Screen for Concert
  const updateLedScreen = (elapsed: number) => {
    const canvas = ledCanvasRef.current;
    const texture = ledTextureRef.current;
    if (!canvas || !texture) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#090910";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (albumImgRef.current) {
      try {
        const artSize = 340;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(60, 86, artSize, artSize, 24);
        ctx.clip();
        ctx.drawImage(albumImgRef.current, 60, 86, artSize, artSize);
        ctx.restore();

        ctx.strokeStyle = "#D7192F";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(58, 84, artSize + 4, artSize + 4, 24);
        ctx.stroke();
      } catch (_) {}
    }

    const numBars = 24;
    const barWidth = 16;
    const barGap = 6;
    const startX = 450;
    const baseY = 380;

    for (let b = 0; b < numBars; b++) {
      const freq = Math.sin(elapsed * 9 + b * 0.6) * 0.5 + 0.5;
      const height = isPlaying ? 30 + freq * 240 : 15;

      const grad = ctx.createLinearGradient(0, baseY, 0, baseY - height);
      grad.addColorStop(0, "#D7192F");
      grad.addColorStop(0.6, "#FF4D6D");
      grad.addColorStop(1, "#00F0FF");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(startX + b * (barWidth + barGap), baseY - height, barWidth, height, 4);
      ctx.fill();
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 38px Inter, sans-serif";
    ctx.fillText(trackTitle.length > 22 ? trackTitle.slice(0, 22) + "..." : trackTitle, 450, 150);

    ctx.fillStyle = "#A0A5B2";
    ctx.font = "500 24px Inter, sans-serif";
    ctx.fillText(artistName, 450, 195);

    ctx.fillStyle = "#D7192F";
    ctx.beginPath();
    ctx.roundRect(450, 70, 100, 32, 16);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillText("LIVE 3D", 472, 92);

    texture.needsUpdate = true;
  };

  // Main Render Loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      animFrameId.current = requestAnimationFrame(animate);

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      const elapsed = time / 1000;

      dynamicUpdatersRef.current.forEach((updater) => updater(delta, elapsed));

      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const stereoCamera = stereoCameraRef.current;

      if (!renderer || !scene || !camera) return;

      currentCameraPos.current.lerp(targetCameraPos.current, 0.06);
      camera.position.copy(currentCameraPos.current);

      if (isGyroEnabled && gyroOrientation.current) {
        const { alpha, beta, gamma } = gyroOrientation.current;
        const euler = new THREE.Euler(
          THREE.MathUtils.degToRad(beta - 45),
          THREE.MathUtils.degToRad(-alpha),
          THREE.MathUtils.degToRad(-gamma),
          "YXZ"
        );
        camera.quaternion.setFromEuler(euler);
      } else {
        const yaw = cameraAngles.current.yaw;
        const pitch = cameraAngles.current.pitch;
        camera.rotation.set(pitch, yaw, 0, "YXZ");
      }

      if (isStereoVR && stereoCamera) {
        const size = renderer.getSize(new THREE.Vector2());
        const widthHalf = Math.floor(size.x / 2);
        const height = size.y;

        camera.updateMatrixWorld();
        stereoCamera.update(camera);

        renderer.setScissorTest(true);

        renderer.setScissor(0, 0, widthHalf, height);
        renderer.setViewport(0, 0, widthHalf, height);
        renderer.render(scene, stereoCamera.cameraL);

        renderer.setScissor(widthHalf, 0, widthHalf, height);
        renderer.setViewport(widthHalf, 0, widthHalf, height);
        renderer.render(scene, stereoCamera.cameraR);

        renderer.setScissorTest(false);
      } else {
        renderer.setViewport(
          0,
          0,
          containerRef.current?.clientWidth || 800,
          containerRef.current?.clientHeight || 600
        );
        renderer.render(scene, camera);
      }
    };

    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isStereoVR, isGyroEnabled, isPlaying]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
    />
  );
}
