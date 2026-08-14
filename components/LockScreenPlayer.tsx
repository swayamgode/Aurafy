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
  const month = time.toLocaleDateString("en-US", { month: "long" });
  const day = time.getDate();

  return { clock: `${hours}:${minutes}`, dateStr: `${weekday}, ${month} ${day}` };
}

// ─── Format seconds → m:ss ────────────────────────────────────────────────────
function formatTime(secs: number) {
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
    isLockScreenOpen,
    toggleLockScreen,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
  } = usePlayer();

  const { clock, dateStr } = useLiveClock();
  const [isFav, setIsFav] = useState(false);

  // Swipe-up-to-unlock gesture
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    // Swipe up > 60px → unlock
    if (deltaY > 60) {
      toggleLockScreen();
    }
    touchStartY.current = null;
  };

  if (!isLockScreenOpen || !currentTrack) return null;

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[60] flex flex-col select-none overflow-hidden"
      style={{ touchAction: "none" }}
    >
      {/* ── Blurred album art background ── */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={currentTrack.thumbnailUrl}
          alt="background"
          fill
          sizes="100vw"
          priority
          className="object-cover scale-110"
          style={{ filter: "blur(40px) saturate(1.6) brightness(0.45)" }}
        />
        {/* Dark gradient overlay for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.65) 100%)",
          }}
        />
      </div>

      {/* ── Safe area top spacer ── */}
      <div className="pt-safe-top pt-8" />

      {/* ── Clock & Date ── */}
      <div className="text-center px-6 mt-4">
        <div
          className="text-7xl font-black text-white tracking-tighter leading-none"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
        >
          {clock}
        </div>
        <p className="text-sm font-semibold tracking-[0.18em] text-white/70 uppercase mt-2">
          {dateStr}
        </p>
      </div>

      {/* ── Album Art ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl"
          style={{
            width: "min(72vw, 280px)",
            height: "min(72vw, 280px)",
            boxShadow: isPlaying
              ? "0 0 0 4px rgba(215,25,47,0.35), 0 24px 64px rgba(0,0,0,0.7)"
              : "0 24px 64px rgba(0,0,0,0.7)",
            transition: "box-shadow 0.5s ease",
          }}
        >
          <Image
            src={currentTrack.thumbnailUrl}
            alt={currentTrack.title}
            fill
            sizes="280px"
            priority
            className="object-cover"
            style={{
              transform: isPlaying ? "scale(1.04)" : "scale(1)",
              transition: "transform 0.6s ease",
            }}
          />
          {/* Subtle playing pulse ring */}
          {isPlaying && (
            <div
              className="absolute inset-0 rounded-3xl border-2 border-white/20 animate-pulse"
              style={{ animationDuration: "2s" }}
            />
          )}
        </div>

        {/* ── Song Info ── */}
        <div className="w-full max-w-xs text-center">
          <h2
            className="text-xl font-extrabold text-white truncate leading-tight"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
          >
            {currentTrack.title}
          </h2>
          <p className="text-sm font-semibold text-white/60 truncate mt-1">
            {currentTrack.artist}
          </p>
        </div>

        {/* ── Glass Controls Card ── */}
        <div
          className="w-full max-w-xs rounded-3xl px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(24px) saturate(1.8)",
            WebkitBackdropFilter: "blur(24px) saturate(1.8)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          {/* Progress bar */}
          <div className="mb-3">
            <div
              className="relative w-full h-1 rounded-full overflow-hidden cursor-pointer"
              style={{ background: "rgba(255,255,255,0.20)" }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seekTo(pct * duration);
              }}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #D7192F, #ff5f6d)",
                  transition: "width 0.8s linear",
                }}
              />
              {/* Draggable thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md"
                style={{
                  left: `calc(${progressPct}% - 6px)`,
                  transition: "left 0.8s linear",
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-white/50 mt-1.5">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback controls row */}
          <div className="flex items-center justify-between">
            {/* Favorite */}
            <button
              onClick={() => setIsFav((p) => !p)}
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFav ? "fill-[#D7192F] text-[#D7192F]" : "text-white/60"
                }`}
              />
            </button>

            {/* Prev */}
            <button
              onClick={prevTrack}
              aria-label="Previous track"
              className="w-11 h-11 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <SkipBack className="w-5 h-5 fill-white" />
            </button>

            {/* Play / Pause — main CTA */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
              style={{
                background: "linear-gradient(135deg, #D7192F 0%, #ff5f6d 100%)",
                boxShadow: "0 6px 24px rgba(215,25,47,0.55)",
              }}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-white text-white" />
              ) : (
                <Play className="w-7 h-7 fill-white text-white ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              aria-label="Next track"
              className="w-11 h-11 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <SkipForward className="w-5 h-5 fill-white" />
            </button>

            {/* Placeholder spacer to balance favorite button */}
            <div className="w-10 h-10" />
          </div>
        </div>
      </div>

      {/* ── Swipe-up to unlock footer ── */}
      <div className="pb-safe-bottom pb-8 text-center">
        <button
          onClick={toggleLockScreen}
          aria-label="Unlock"
          className="inline-flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
        >
          <ChevronUp
            className="w-6 h-6"
            style={{ animation: "lockBounce 1.8s ease-in-out infinite" }}
          />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
            Swipe up to unlock
          </span>
        </button>
      </div>

      {/* ── Keyframes injected inline ── */}
      <style>{`
        @keyframes lockBounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
