"use client";

import React from "react";
import Image from "next/image";
import { Play, Plus } from "lucide-react";
import { Playlist } from "@/types/music";

interface PlaylistCardProps {
  playlist: Playlist;
  onPlay?: () => void;
  onAdd?: () => void;
  variant?: "default" | "recommendation";
}

export default function PlaylistCard({
  playlist,
  onPlay,
  onAdd,
  variant = "default",
}: PlaylistCardProps) {
  return (
    <div className="group flex flex-col bg-white rounded-2xl p-3 border border-[#E3E4E6] hover:border-gray-300 transition-all hover:shadow-md cursor-pointer">
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3">
        <Image
          src={playlist.coverUrl || "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400&auto=format&fit=crop"}
          alt={playlist.title}
          fill
          sizes="(max-width: 640px) 160px, 200px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onPlay) onPlay();
          }}
          aria-label={`Play ${playlist.title}`}
          className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform opacity-0 group-hover:opacity-100 hover:bg-[#D7192F]"
        >
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </button>
      </div>

      <h4 className="text-sm font-bold text-black truncate group-hover:text-[#D7192F] transition-colors">
        {playlist.title}
      </h4>
      <p className="text-xs text-[#5F6368] truncate mt-0.5">
        {playlist.creator || "Curated Playlist"}
      </p>

      {variant === "recommendation" && onAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          aria-label="Add playlist"
          className="mt-3 w-full py-1.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-[#D7192F] transition-colors flex items-center justify-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ADD</span>
        </button>
      )}
    </div>
  );
}
