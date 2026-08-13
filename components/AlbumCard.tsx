"use client";

import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Track } from "@/types/music";
import { usePlayer } from "@/lib/PlayerContext";

interface AlbumCardProps {
  track: Track;
}

export default function AlbumCard({ track }: AlbumCardProps) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const isCurrent = currentTrack?.youtubeId === track.youtubeId;

  return (
    <div
      onClick={() => playTrack(track)}
      className="group w-36 sm:w-44 shrink-0 flex flex-col cursor-pointer transition-transform hover:-translate-y-1 duration-200"
    >
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-gray-200 shadow-sm border border-black/5">
        <Image
          src={track.thumbnailUrl}
          alt={track.title}
          fill
          sizes="(max-width: 640px) 144px, 176px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div
          className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity ${
            isCurrent && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>
      </div>
      <h4 className="text-xs sm:text-sm font-semibold text-black truncate mt-2 group-hover:text-[#D7192F] transition-colors">
        {track.title}
      </h4>
      <p className="text-[11px] sm:text-xs text-[#5F6368] truncate font-normal mt-0.5">
        {track.artist}
      </p>
    </div>
  );
}
