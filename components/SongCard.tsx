"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play, Pause, Heart, MoreVertical, Trash2 } from "lucide-react";
import { Track } from "@/types/music";
import { usePlayer } from "@/lib/PlayerContext";
import { useToast } from "@/lib/ToastContext";
import SongActionSheet from "@/components/SongActionSheet";

interface SongCardProps {
  track: Track;
  variant?: "default" | "compact" | "favorite" | "playlist";
  onRemove?: () => void;
  isFavoritedInitial?: boolean;
}

export default function SongCard({
  track,
  variant = "default",
  onRemove,
  isFavoritedInitial = false,
}: SongCardProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay, addToQueue } = usePlayer();
  const { showToast } = useToast();
  const [isFavorited, setIsFavorited] = useState(isFavoritedInitial || variant === "favorite");
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const isCurrent = currentTrack?.youtubeId === track.youtubeId;

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited((prev) => {
      const nextState = !prev;
      if (nextState) {
        showToast(`Saved "${track.title}" to Favourites`, "favorite");
      } else {
        showToast(`Removed "${track.title}" from Favourites`, "info");
      }
      return nextState;
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "3:42";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (variant === "compact") {
    return (
      <div
        onClick={handlePlayClick}
        className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
          isCurrent ? "bg-[#D7192F]/10 border border-[#D7192F]/20" : "hover:bg-[#F1F2F3]"
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0 pr-2">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-200">
            <Image src={track.thumbnailUrl} alt={track.title} fill sizes="40px" className="object-cover" />
            <div
              className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {isCurrent && isPlaying ? (
                <Pause className="w-4 h-4 fill-white text-white" />
              ) : (
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <h4 className={`text-xs font-semibold truncate ${isCurrent ? "text-[#D7192F]" : "text-black"}`}>
              {track.title}
            </h4>
            <p className="text-[11px] text-[#5F6368] truncate">{track.artist}</p>
          </div>
        </div>
        <span className="text-xs text-[#8A8D91] shrink-0 font-medium">
          {formatDuration(track.duration)}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={handlePlayClick}
      className={`group flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${
        isCurrent
          ? "bg-white border-[#D7192F]/40 shadow-sm"
          : "bg-white border-[#E3E4E6] hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center space-x-3.5 min-w-0 pr-3">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 shadow-xs">
          <Image src={track.thumbnailUrl} alt={track.title} fill sizes="48px" className="object-cover" />
          <div
            className={`absolute inset-0 bg-black/35 flex items-center justify-center transition-opacity ${
              isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 fill-white text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            )}
          </div>
        </div>

        <div className="min-w-0">
          <h4
            className={`text-sm font-semibold truncate ${
              isCurrent ? "text-[#D7192F]" : "text-black group-hover:text-[#D7192F]"
            }`}
          >
            {track.title}
          </h4>
          <p className="text-xs text-[#5F6368] truncate mt-0.5 font-normal">
            {track.artist} {track.album ? `• ${track.album}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <span className="text-xs text-[#8A8D91] font-medium hidden sm:inline">
          {formatDuration(track.duration)}
        </span>

        {variant === "playlist" && onRemove ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove from playlist"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6368] hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleHeartClick}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6368] hover:text-[#D7192F] transition-transform active:scale-125"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorited
                  ? "fill-[#D7192F] text-[#D7192F]"
                  : "text-[#5F6368] hover:text-[#D7192F]"
              }`}
            />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsActionSheetOpen(true);
          }}
          aria-label="More options"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6368] hover:bg-[#F1F2F3] hover:text-black transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <SongActionSheet
        track={track}
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
      />
    </div>
  );
}
