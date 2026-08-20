"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  ChevronUp,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Flashlight,
  Camera,
  Music,
  Lock,
  Sparkles,
} from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";

// ─── Live Clock Hook ──────────────────────────────────────────────────────────
function useLiveClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const weekday = time.toLocaleDateString("en-US", { weekday: "long" });
  const month = time.toLocaleDateString("en-US", { month: "short" });
  const day = time.getDate();

  return { clock: `${hours}:${minutes}`, dateStr: `${weekday}, ${month} ${day}` };
}

// ─── Format seconds → m:ss ────────────────────────────────────────────────────
function formatTime(secs: number) {
  if (isNaN(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// ─── LockScreenPlayer ─────────────────────────────────────────────────────────
export default function LockScreenPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    repeatMode,
    toggleRepeat,
    isShuffle,
    toggleShuffle,
    isLockScreenOpen,
    toggleLockScreen,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    isDownloaded,
  } = usePlayer();

  const { clock, dateStr } = useLiveClock();
  const [isFav, setIsFav] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);

  // Swipe-up-to-unlock gesture
  const touchStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.touches[0].clientY;
    if (deltaY > 0) {
      setDragOffset(Math.min(deltaY, 120));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (deltaY > 50) {
      toggleLockScreen();
    }
    setDragOffset(0);
    touchStartY.current = null;
  };

  if (!isLockScreenOpen || !currentTrack) return null;

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const isCurrentTrackDownloaded = isDownloaded(currentTrack.youtubeId);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[80] flex flex-col select-none overflow-hidden bg-black transition-transform duration-200"
      style={{
        transform: `translateY(-${dragOffset}px)`,
        touchAction: "none",
      }}
    >
      {/* ── Dynamic Ambient Blur Background ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={currentTrack.thumbnailUrl || "/cover-placeholder.png"}
          alt="background"
          fill
          sizes="100vw"
          priority
          className="object-cover scale-125 transition-all duration-700"
          style={{
            filter: "blur(60px) saturate(2.0) brightness(0.35)",
            transform: isPlaying ? "scale(1.3) rotate(2deg)" : "scale(1.2) rotate(0deg)",
          }}
        />
        {/* Subtle radial vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(215,25,47,0.18) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.92) 100%)",
          }}
        />
      </div>

      {/* ── Top Header / Dynamic Island ── */}
      <div className="pt-safe-top pt-3 px-6 flex items-center justify-between z-20">
        <div className="flex items-center space-x-1.5 text-white/70 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>Hue Mobile</span>
        </div>

        {/* Dynamic Island Capsule */}
        <div
          className="px-3.5 py-1.5 rounded-full bg-black/70 border border-white/15 backdrop-blur-xl flex items-center space-x-2 shadow-lg"
          style={{ animation: isPlaying ? "pulse 3s infinite" : "none" }}
        >
          <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
            <Image
              src={currentTrack.thumbnailUrl || "/cover-placeholder.png"}
              alt="cover"
              fill
              sizes="16px"
              className="object-cover"
            />
          </div>
          <span className="text-[11px] font-bold text-white max-w-[120px] truncate">
            {currentTrack.title}
          </span>
          {/* Animated mini sound bars */}
          <div className="flex items-end space-x-0.5 h-3">
            {[0.6, 1.0, 0.4, 0.8].map((h, i) => (
              <div
                key={i}
                className="w-0.5 bg-[#D7192F] rounded-full transition-all"
                style={{
                  height: isPlaying ? `${h * 100}%` : "30%",
                  animation: isPlaying ? `equalizer 0.8s ease-in-out ${i * 0.15}s infinite alternate` : "none",
                }}
              />
            ))}
          </div>
        </div>

        <div className="w-14 flex justify-end">
          {isCurrentTrackDownloaded && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* ── Clock & Date Header ── */}
      <div className="text-center px-6 mt-3">
        <div
          className="text-7xl sm:text-8xl font-black text-white tracking-tighter leading-none"
          style={{
            textShadow: "0 4px 30px rgba(0,0,0,0.8), 0 0 50px rgba(255,255,255,0.15)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clock}
        </div>
        <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-white/80 uppercase mt-2 drop-shadow-md">
          {dateStr}
        </p>
      </div>

      {/* ── Center Artwork & Song Info ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 gap-4 max-w-sm mx-auto w-full">
        {/* Album Art Card */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-500"
          style={{
            width: "min(64vw, 240px)",
            height: "min(64vw, 240px)",
            boxShadow: isPlaying
              ? "0 0 40px rgba(215,25,47,0.4), 0 20px 50px rgba(0,0,0,0.9)"
              : "0 15px 40px rgba(0,0,0,0.8)",
            transform: isPlaying ? "scale(1.02)" : "scale(0.97)",
          }}
        >
          <Image
            src={currentTrack.thumbnailUrl || "/cover-placeholder.png"}
            alt={currentTrack.title}
            fill
            sizes="240px"
            priority
            className="object-cover"
          />
          {/* Subtle vinyl groove reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/15 pointer-events-none" />
        </div>

        {/* Song Info */}
        <div className="w-full text-center px-2">
          <h2
            className="text-lg sm:text-xl font-extrabold text-white truncate leading-tight tracking-tight drop-shadow-md"
          >
            {currentTrack.title}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-white/70 truncate mt-1 drop-shadow-sm">
            {currentTrack.artist}
          </p>
        </div>

        {/* ── Glass Player Controls Card ── */}
        <div
          className="w-full rounded-3xl p-4 sm:p-5"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(30px) saturate(200%)",
            WebkitBackdropFilter: "blur(30px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          {/* Seekbar */}
          <div className="mb-3">
            <div
              className="relative w-full h-1.5 rounded-full overflow-hidden cursor-pointer"
              style={{ background: "rgba(255,255,255,0.18)" }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seekTo(pct * (duration || 210));
              }}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #D7192F, #ff6b6b)",
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg transition-all duration-300"
                style={{
                  left: `calc(${progressPct}% - 7px)`,
                  boxShadow: "0 0 10px rgba(215,25,47,0.8)",
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-white/60 mt-1.5 px-0.5">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration || 210)}</span>
            </div>
          </div>

          {/* Main Control Buttons */}
          <div className="flex items-center justify-between px-1">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              aria-label="Shuffle"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isShuffle ? "text-[#D7192F] bg-white/15" : "text-white/60 hover:text-white"
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Prev Track */}
            <button
              onClick={prevTrack}
              aria-label="Previous track"
              className="w-11 h-11 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 active:scale-90 transition-all shadow-md cursor-pointer"
            >
              <SkipBack className="w-5 h-5 fill-white" />
            </button>

            {/* Play / Pause Main Button */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #D7192F 0%, #ff4b5c 100%)",
                boxShadow: "0 6px 24px rgba(215,25,47,0.6), inset 0 1px 1px rgba(255,255,255,0.3)",
              }}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-white text-white" />
              ) : (
                <Play className="w-7 h-7 fill-white text-white ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={nextTrack}
              aria-label="Next track"
              className="w-11 h-11 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 active:scale-90 transition-all shadow-md cursor-pointer"
            >
              <SkipForward className="w-5 h-5 fill-white" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              aria-label="Repeat mode"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                repeatMode !== "off" ? "text-[#D7192F] bg-white/15" : "text-white/60 hover:text-white"
              }`}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Volume Row */}
          <div className="flex items-center space-x-3 mt-3 pt-2.5 border-t border-white/10 px-2">
            <button
              onClick={toggleMute}
              aria-label="Toggle mute"
              className="text-white/60 hover:text-white"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-white/70" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume slider"
              className="w-full h-1 bg-white/20 rounded-full appearance-none accent-[#D7192F] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── Bottom Lock Screen Actions & Swipe to Unlock ── */}
      <div className="pb-safe-bottom pb-6 px-8 flex items-center justify-between w-full max-w-sm mx-auto z-20">
        {/* Flashlight button */}
        <button
          onClick={() => setIsFlashlightOn((prev) => !prev)}
          aria-label="Flashlight"
          className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90 ${
            isFlashlightOn
              ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.8)]"
              : "bg-black/40 text-white/80 border-white/20 hover:bg-black/60"
          }`}
        >
          <Flashlight className="w-5 h-5" />
        </button>

        {/* Swipe up indicator */}
        <button
          onClick={toggleLockScreen}
          aria-label="Swipe up to unlock"
          className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors cursor-pointer group"
        >
          <ChevronUp
            className="w-6 h-6 text-white group-hover:translate-y-[-2px] transition-transform"
            style={{ animation: "lockBounce 1.6s ease-in-out infinite" }}
          />
          <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/80 drop-shadow">
            Swipe up to unlock
          </span>
        </button>

        {/* Camera button (opens search) */}
        <button
          onClick={toggleLockScreen}
          aria-label="Camera shortcut"
          className="w-12 h-12 rounded-full bg-black/40 text-white/80 border border-white/20 flex items-center justify-center backdrop-blur-xl hover:bg-black/60 transition-all active:scale-90"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* ── CSS Keyframes ── */}
      <style>{`
        @keyframes lockBounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-7px); opacity: 1; }
        }
        @keyframes equalizer {
          0% { height: 20%; }
          100% { height: 100%; }
        }
      `}</style>
    </div>
  );
}
