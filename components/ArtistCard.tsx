"use client";

import React from "react";
import Image from "next/image";
import { Artist } from "@/types/music";

interface ArtistCardProps {
  artist: Artist;
  onClick?: () => void;
}

export default function ArtistCard({ artist, onClick }: ArtistCardProps) {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col items-center w-24 sm:w-28 shrink-0 cursor-pointer transition-transform hover:scale-105 duration-200"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-xs group-hover:border-[#D7192F] transition-colors">
        <Image
          src={artist.imageUrl}
          alt={artist.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
      <h4 className="text-xs sm:text-sm font-semibold text-black text-center truncate w-full mt-2 group-hover:text-[#D7192F] transition-colors">
        {artist.name}
      </h4>
      {artist.genre && (
        <span className="text-[10px] text-[#8A8D91] font-medium uppercase tracking-wider">
          {artist.genre}
        </span>
      )}
    </div>
  );
}
