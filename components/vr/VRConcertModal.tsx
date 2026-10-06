"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Compass,
  Headphones,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Flame,
  Music2,
  Building2,
  Sliders,
  Radio,
} from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";
import { useToast } from "@/lib/ToastContext";
import VRConcertScene, { VREnvironment, CameraPreset } from "./VRConcertScene";
import { ambientAudio } from "@/lib/vr/ambientAudio";

export default function VRConcertModal() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isVROpen,
    closeVR,
    vrEnvironment,
    setVREnvironment,
  } = usePlayer();

  const { showToast } = useToast();

  // VR Options State
  const [isStereoVR, setIsStereoVR] = useState<boolean>(false);
  const [isGyroEnabled, setIsGyroEnabled] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("front_row");
  const [showHUD, setShowHUD] = useState<boolean>(true);
  const [isAmbienceActive, setIsAmbienceActive] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showPresetMenu, setShowPresetMenu] = useState<boolean>(false);

  // Sync ambient sound with environment
  useEffect(() => {
    if (!isVROpen) {
      ambientAudio.stop();
      setIsAmbienceActive(false);
      return;
    }

    if (isAmbienceActive) {
      if (vrEnvironment === "concert") {
        ambientAudio.start("concert", 0.3);
      } else if (vrEnvironment === "lofi") {
        ambientAudio.start("lofi", 0.35);
      } else {
        ambientAudio.stop();
      }
    }
  }, [isVROpen, vrEnvironment, isAmbienceActive]);

  // Adjust camera preset when changing environment
  const handleEnvChange = (env: VREnvironment) => {
    setVREnvironment(env);
    if (env === "concert") {
      setCameraPreset("front_row");
      showToast("Entering 3D Stadium Concert Arena", "info");
    } else if (env === "lofi") {
      setCameraPreset("campfire");
      showToast("Entering Milky Way Mountain Camp", "info");
    } else if (env === "lake") {
      setCameraPreset("lake");
      showToast("Entering Alpine Lake Night", "info");
    } else {
      setCameraPreset("front_row");
      showToast("Entering Cyberpunk Skyline", "info");
    }
  };

  // Toggle Gyroscope with iOS permission request
  const handleToggleGyro = async () => {
    if (isGyroEnabled) {
      setIsGyroEnabled(false);
      showToast("Switched to Touch / Drag Look", "info");
      return;
    }

    if (
      typeof window !== "undefined" &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function"
    ) {
      try {
        const resp = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (resp === "granted") {
          setIsGyroEnabled(true);
          showToast("Motion Sensor / Gyroscope Active! Move your device to look around.", "success");
        } else {
          showToast("Motion sensor permission denied", "info");
        }
      } catch (_) {
        setIsGyroEnabled(true);
      }
    } else if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      setIsGyroEnabled(true);
      showToast("Motion Sensor / Gyroscope Active! Move device to look around.", "success");
    } else {
      showToast("Motion sensors not supported on this device", "info");
    }
  };

  // Toggle Ambience Audio
  const handleToggleAmbience = () => {
    if (isAmbienceActive) {
      ambientAudio.stop();
      setIsAmbienceActive(false);
      showToast("Ambience muted", "info");
    } else {
      setIsAmbienceActive(true);
      if (vrEnvironment === "concert") {
        ambientAudio.start("concert", 0.3);
        showToast("Stadium Crowd Murmur & Cheering enabled", "success");
      } else if (vrEnvironment === "lofi" || vrEnvironment === "lake") {
        ambientAudio.start("lofi", 0.35);
        showToast("Campfire Crackle & Night Crickets enabled", "success");
      }
    }
  };

  // Toggle Stereo Side-by-Side Cardboard VR mode
  const handleToggleStereo = () => {
    setIsStereoVR((prev) => !prev);
    if (!isStereoVR) {
      showToast("Stereo VR Mode ON: Insert phone into VR Cardboard / Headset!", "success");
      // Turn on gyro by default for VR headset
      if (!isGyroEnabled) {
        handleToggleGyro();
      }
    } else {
      showToast("Single Viewport Mode ON", "info");
    }
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  if (!isVROpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black overflow-hidden flex flex-col animate-in fade-in duration-300">
      {/* 3D WebGL Canvas Viewport */}
      <VRConcertScene
        environment={vrEnvironment}
        isStereoVR={isStereoVR}
        isGyroEnabled={isGyroEnabled}
        cameraPreset={cameraPreset}
        isPlaying={isPlaying}
        progress={progress}
        trackTitle={currentTrack?.title}
        artistName={currentTrack?.artist}
        thumbnailUrl={currentTrack?.thumbnailUrl}
      />

      {/* Stereo VR Center Divider Line for Headset */}
      {isStereoVR && (
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-black/80 pointer-events-none z-40 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border border-white/30 bg-black/50" />
        </div>
      )}

      {/* Tap Overlay to Toggle HUD in Zen Mode */}
      <div
        onClick={() => setShowHUD((prev) => !prev)}
        className="absolute inset-0 z-20"
        title="Tap to toggle HUD"
      />

      {/* TOP FLOATING HEADER HUD */}
      <header
        className={`relative z-30 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 transition-all duration-300 pointer-events-auto ${
          showHUD ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        {/* Left: Close Button & Current Mode */}
        <div className="flex items-center space-x-2">
          <button
            onClick={closeVR}
            aria-label="Exit 3D VR"
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center border border-white/15 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#D7192F] animate-pulse" />
            <span>3D VIRTUAL REALITY</span>
          </div>
        </div>

        {/* Center: Environment Switcher Pills */}
        <div className="flex items-center p-1 rounded-full bg-black/70 backdrop-blur-lg border border-white/15 shadow-2xl">
          <button
            onClick={() => handleEnvChange("concert")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              vrEnvironment === "concert"
                ? "bg-[#D7192F] text-white shadow-md shadow-red-900/50"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>Concert</span>
          </button>

          <button
            onClick={() => handleEnvChange("lofi")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              vrEnvironment === "lofi"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Mountain</span>
          </button>

          <button
            onClick={() => handleEnvChange("lake")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              vrEnvironment === "lake"
                ? "bg-sky-600 text-white shadow-md shadow-sky-900/50"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lake Night</span>
            <span className="sm:hidden">Lake</span>
          </button>

          <button
            onClick={() => handleEnvChange("cyberpunk")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
              vrEnvironment === "cyberpunk"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-900/50"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cyberpunk</span>
          </button>
        </div>

        {/* Right: Quick Tool Buttons */}
        <div className="flex items-center space-x-2">
          {/* Cardboard VR Headset SBS Toggle */}
          <button
            onClick={handleToggleStereo}
            aria-label="VR Headset Stereo Mode"
            title="Split-Screen VR Goggles (Google Cardboard / Meta Quest)"
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-all active:scale-95 shadow-lg cursor-pointer ${
              isStereoVR
                ? "bg-[#D7192F] border-red-400 text-white shadow-red-900/50"
                : "bg-black/60 hover:bg-black/90 border-white/15 text-zinc-300"
            }`}
          >
            <Headphones className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Gyroscope Motion Look */}
          <button
            onClick={handleToggleGyro}
            aria-label="Toggle Gyroscope Motion"
            title="Tilt Phone to Look Around"
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-all active:scale-95 shadow-lg cursor-pointer ${
              isGyroEnabled
                ? "bg-emerald-600 border-emerald-400 text-white shadow-emerald-900/50"
                : "bg-black/60 hover:bg-black/90 border-white/15 text-zinc-300"
            }`}
          >
            <Compass className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Ambient Sound Layer */}
          <button
            onClick={handleToggleAmbience}
            aria-label="Toggle Ambient Audio"
            title="Stadium Cheer or Campfire Ambience"
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-all active:scale-95 shadow-lg cursor-pointer ${
              isAmbienceActive
                ? "bg-amber-600 border-amber-400 text-white shadow-amber-900/50"
                : "bg-black/60 hover:bg-black/90 border-white/15 text-zinc-300"
            }`}
          >
            <Radio className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Zen Hide HUD Mode */}
          <button
            onClick={() => setShowHUD(false)}
            aria-label="Immersion Mode"
            title="Hide HUD (Tap screen to restore)"
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-zinc-300 backdrop-blur-md flex items-center justify-center border border-white/15 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <EyeOff className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </header>

      {/* CAMERA VIEWPOINT PRESETS PILL (Floating center-top) */}
      <div
        className={`relative z-30 self-center transition-all duration-300 pointer-events-auto ${
          showHUD ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center space-x-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white">
          <span className="text-[10px] uppercase font-bold text-zinc-400 pl-2 pr-1">Angle:</span>

          {vrEnvironment === "concert" ? (
            <>
              <button
                onClick={() => setCameraPreset("front_row")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  cameraPreset === "front_row" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Front Row
              </button>
              <button
                onClick={() => setCameraPreset("crowd_pit")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  cameraPreset === "crowd_pit" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Crowd Pit
              </button>
              <button
                onClick={() => setCameraPreset("stage_pov")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  cameraPreset === "stage_pov" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Stage POV
              </button>
              <button
                onClick={() => setCameraPreset("balcony")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  cameraPreset === "balcony" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Balcony
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCameraPreset("campfire")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  cameraPreset === "campfire" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Campfire
              </button>
              <button
                onClick={() => setCameraPreset("lake")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  cameraPreset === "lake" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Lake Shore
              </button>
              <button
                onClick={() => setCameraPreset("mountain")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  cameraPreset === "mountain" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Peak
              </button>
              <button
                onClick={() => setCameraPreset("stargaze")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  cameraPreset === "stargaze" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                Stargaze
              </button>
            </>
          )}
        </div>
      </div>

      {/* SPACER */}
      <div className="flex-1" />

      {/* BOTTOM FLOATING MUSIC HUD PLAYER */}
      <footer
        className={`relative z-30 p-4 sm:p-6 transition-all duration-300 pointer-events-auto max-w-xl mx-auto w-full ${
          showHUD ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-black/75 backdrop-blur-xl border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl text-white">
          {/* Track Info Bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                {currentTrack?.thumbnailUrl ? (
                  <Image
                    src={currentTrack.thumbnailUrl}
                    alt={currentTrack.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Music2 className="w-6 h-6 text-zinc-500" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-bold truncate text-white leading-tight">
                  {currentTrack?.title || "No track playing"}
                </h4>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {currentTrack?.artist || "Pick a track to start"}
                </p>
              </div>
            </div>

            {/* Quick volume / mute */}
            <button
              onClick={toggleMute}
              aria-label="Toggle Mute"
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#D7192F]" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Progress Slider */}
          <div className="mb-3">
            <div className="relative flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={progress}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#D7192F] focus:outline-hidden"
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-400 font-medium mt-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls: Prev / Play / Next */}
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={prevTrack}
              aria-label="Previous Track"
              className="text-zinc-300 hover:text-white active:scale-90 transition-all cursor-pointer"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-12 h-12 rounded-full bg-[#D7192F] hover:bg-[#b01324] text-white flex items-center justify-center shadow-lg shadow-red-900/40 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              aria-label="Next Track"
              className="text-zinc-300 hover:text-white active:scale-90 transition-all cursor-pointer"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
