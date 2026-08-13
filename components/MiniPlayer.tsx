"use client";

import React from "react";
import Image from "next/image";
import { Play, Pause, SkipBack, SkipForward, Smartphone } from "lucide-react";
import AudioEqualizer from "@/components/AudioEqualizer";
import { usePlayer } from "@/lib/PlayerContext";

export default function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, openNowPlaying } = usePlayer();

  if (!currentTrack) return null;

  return (
    <aside
      aria-label="Mini Music Player"
      className="fixed bottom-[68px] left-3 right-3 sm:left-6 sm:right-6 max-w-lg sm:mx-auto z-40 bg-[#2D2D2D] text-white rounded-full p-2 pl-3 shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-lg animate-in slide-in-from-bottom duration-300"
    >
      {/* Artwork + Title + Artist */}
      <div
        onClick={openNowPlaying}
        className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer group"
      >
        <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 bg-black/40 border border-white/10 group-hover:scale-105 transition-transform flex items-center justify-center">
          <Image
            src={currentTrack.thumbnailUrl}
            alt={currentTrack.title}
            fill
            sizes="44px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center space-x-2">
            <h4 className="text-xs sm:text-sm font-semibold truncate text-white group-hover:text-red-400 transition-colors">
              {currentTrack.title}
            </h4>
            <AudioEqualizer isPlaying={isPlaying} />
          </div>
          <p className="text-[11px] text-[#8A8D91] truncate font-medium">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center space-x-1 shrink-0 pr-1">
        <button
          onClick={prevTrack}
          aria-label="Previous Track"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer"
        >
          <SkipBack className="w-4 h-4 fill-white" />
        </button>

        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause Track" : "Play Track"}
          className="w-10 h-10 rounded-full bg-white text-[#2D2D2D] flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer hover:bg-gray-100"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-[#2D2D2D]" />
          ) : (
            <Play className="w-5 h-5 fill-[#2D2D2D] ml-0.5" />
          )}
        </button>

        <button
          onClick={nextTrack}
          aria-label="Next Track"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer"
        >
          <SkipForward className="w-4 h-4 fill-white" />
        </button>
      </div>
    </aside>
  );
}
