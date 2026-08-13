"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Repeat,
  Shuffle,
  ListMusic,
  Speaker,
  Volume2,
  Lock,
} from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";

export default function NowPlayingModal() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    repeatMode,
    isShuffle,
    isNowPlayingOpen,
    closeNowPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleLockScreen,
    queue,
    clearQueue,
    removeFromQueue,
  } = usePlayer();

  const [isFav, setIsFav] = useState(false);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);

  if (!isNowPlayingOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9FA] overflow-y-auto flex flex-col justify-between animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#E3E4E6]">
        <button
          onClick={closeNowPlaying}
          aria-label="Close Now Playing"
          className="w-10 h-10 rounded-full flex items-center justify-center text-black hover:bg-[#E3E4E6] active:scale-95 transition-all cursor-pointer"
        >
          <ChevronDown className="w-6 h-6 stroke-[2]" />
        </button>

        <span className="text-xs font-extrabold uppercase tracking-widest text-[#5F6368]">
          Now Playing
        </span>

        <button
          onClick={toggleLockScreen}
          aria-label="Open Lock Screen Mode"
          className="w-10 h-10 rounded-full flex items-center justify-center text-black hover:bg-[#E3E4E6] active:scale-95 transition-all cursor-pointer"
        >
          <Lock className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 max-w-md mx-auto w-full">
        {/* Hi-Res Badge */}
        <div className="mb-4 px-2.5 py-0.5 rounded-full bg-black/5 text-[#5F6368] text-[10px] font-bold tracking-widest uppercase">
          HI-RES AUDIO 24-BIT / 96KHZ
        </div>

        {/* Large Album Artwork */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl bg-gray-200 border border-black/5 mb-8">
          <Image
            src={currentTrack.thumbnailUrl}
            alt={currentTrack.title}
            fill
            sizes="300px"
            priority
            className="object-cover"
          />
        </div>

        {/* Track Metadata & Favorite Button */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="min-w-0 pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-black truncate tracking-tight">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-[#5F6368] font-medium truncate mt-1">
              {currentTrack.artist}
            </p>
          </div>
          <button
            onClick={() => setIsFav((p) => !p)}
            aria-label="Favorite song"
            className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[#E3E4E6] active:scale-125 transition-transform cursor-pointer"
          >
            <Heart
              className={`w-6 h-6 ${
                isFav ? "fill-[#D7192F] text-[#D7192F]" : "text-[#5F6368]"
              }`}
            />
          </button>
        </div>

        {/* Progress Bar & Timers */}
        <div className="w-full mb-6">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={(e) => seekTo(Number(e.target.value))}
            aria-label="Seek track position"
            className="w-full accent-[#D7192F] h-1.5 bg-[#E3E4E6] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-xs text-[#8A8D91] font-semibold mt-2">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Primary Playback Controls */}
        <div className="w-full flex items-center justify-between px-2 mb-8">
          <button
            onClick={toggleShuffle}
            aria-label="Toggle Shuffle"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isShuffle ? "text-[#D7192F] bg-[#D7192F]/10" : "text-[#5F6368] hover:text-black"
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={prevTrack}
            aria-label="Previous track"
            className="w-12 h-12 rounded-full flex items-center justify-center text-black hover:bg-[#E3E4E6] active:scale-90 transition-transform cursor-pointer"
          >
            <SkipBack className="w-6 h-6 fill-black" />
          </button>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </button>

          <button
            onClick={nextTrack}
            aria-label="Next track"
            className="w-12 h-12 rounded-full flex items-center justify-center text-black hover:bg-[#E3E4E6] active:scale-90 transition-transform cursor-pointer"
          >
            <SkipForward className="w-6 h-6 fill-black" />
          </button>

          <button
            onClick={toggleRepeat}
            aria-label="Toggle Repeat Mode"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${
              repeatMode !== "off"
                ? "text-[#D7192F] bg-[#D7192F]/10"
                : "text-[#5F6368] hover:text-black"
            }`}
          >
            <Repeat className="w-5 h-5" />
            {repeatMode === "one" && (
              <span className="absolute text-[9px] font-bold top-1 right-1 bg-[#D7192F] text-white rounded-full w-3 h-3 flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Device Output Card & Queue Drawer Toggle */}
        <div className="w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#E3E4E6] shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#F1F2F3] flex items-center justify-center text-black">
              <Speaker className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#8A8D91] uppercase tracking-wider block">
                PLAYING ON
              </span>
              <h5 className="text-xs font-bold text-black">Studio Pro One</h5>
            </div>
          </div>
          <button
            onClick={() => setShowQueueDrawer((prev) => !prev)}
            aria-label="Toggle Queue Drawer"
            className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-[#D7192F] transition-colors flex items-center space-x-1"
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>QUEUE ({queue.length})</span>
          </button>
        </div>

        {/* Queue Drawer Panel */}
        {showQueueDrawer && (
          <div className="w-full mt-4 bg-white rounded-2xl border border-[#E3E4E6] p-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3 border-b border-[#E3E4E6] pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                Up Next ({queue.length})
              </h4>
              <button
                onClick={clearQueue}
                className="text-[11px] font-semibold text-[#D7192F] hover:underline"
              >
                Clear Queue
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {queue.map((item, idx) => (
                <div
                  key={`${item.youtubeId}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F2F3] transition-colors text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-black truncate">{item.title}</p>
                    <p className="text-[10px] text-[#5F6368] truncate">{item.artist}</p>
                  </div>
                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="text-[#8A8D91] hover:text-black text-xs px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
