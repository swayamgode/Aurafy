"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Shuffle,
  Repeat,
  Lock,
  ChevronUp,
} from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";

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

  const [isFav, setIsFav] = useState(false);

  if (!isLockScreenOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111111] text-white flex flex-col justify-between p-6 overflow-y-auto animate-in fade-in duration-300">
      {/* Clock & Date Header */}
      <div className="text-center pt-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-white/95">
          03:48
        </h1>
        <p className="text-xs font-bold tracking-widest text-[#8A8D91] uppercase mt-2">
          MONDAY, JUNE 12
        </p>
      </div>

      {/* Center Artwork & Info Card */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full my-6">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 mb-6 group">
          <Image
            src={currentTrack.thumbnailUrl}
            alt={currentTrack.title}
            fill
            sizes="300px"
            priority
            className="object-cover"
          />
        </div>

        {/* Title & Artist & Favorite */}
        <div className="w-full bg-[#2D2D2D]/90 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 pr-3">
              <h3 className="text-lg font-bold text-white truncate">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-[#8A8D91] font-semibold truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
            <button
              onClick={() => setIsFav((p) => !p)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFav ? "fill-[#D7192F] text-[#D7192F]" : "text-white/70"
                }`}
              />
            </button>
          </div>

          {/* Progress Slider */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full accent-[#D7192F] h-1 bg-white/20 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#8A8D91] font-semibold mt-1.5">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-around">
            <button
              onClick={prevTrack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10"
            >
              <SkipBack className="w-5 h-5 fill-white" />
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-black" />
              ) : (
                <Play className="w-6 h-6 fill-black ml-0.5" />
              )}
            </button>
            <button
              onClick={nextTrack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10"
            >
              <SkipForward className="w-5 h-5 fill-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Unlock Footer Button */}
      <div className="text-center pb-4">
        <button
          onClick={toggleLockScreen}
          className="inline-flex flex-col items-center justify-center text-xs font-semibold text-[#8A8D91] hover:text-white transition-colors cursor-pointer group"
        >
          <ChevronUp className="w-5 h-5 animate-bounce text-white/80" />
          <span className="tracking-widest text-[10px] uppercase">
            SWIPE UP TO UNLOCK
          </span>
        </button>
      </div>
    </div>
  );
}
