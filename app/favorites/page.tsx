"use client";

import React, { useState } from "react";
import AppHeader from "@/components/AppHeader";
import FilterPill from "@/components/FilterPill";
import SongCard from "@/components/SongCard";
import { FOR_YOU_SONGS, RECENTLY_PLAYED_INITIAL } from "@/lib/youtube";
import { Heart, Play } from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";

export default function FavoritesPage() {
  const [activeFilter, setActiveFilter] = useState("All Songs");
  const { playTrack } = usePlayer();

  const favoriteSongs = FOR_YOU_SONGS.concat(RECENTLY_PLAYED_INITIAL);

  const filters = ["All Songs", "Recently Added", "Albums"];

  return (
    <div className="min-h-screen">
      <AppHeader title="Favourites" showSearch={true} showProfile={false} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* Favourites Banner Header */}
        <div className="bg-gradient-to-r from-red-600 to-[#D7192F] rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-white/80 mb-1">
              <Heart className="w-4 h-4 fill-white text-white" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest">
                YOUR LIBRARY
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Liked Songs
            </h2>
            <p className="text-xs text-white/80 font-medium mt-1">
              {favoriteSongs.length} tracks saved
            </p>
          </div>

          <button
            onClick={() => playTrack(favoriteSongs[0], favoriteSongs)}
            aria-label="Play all favorite songs"
            className="w-14 h-14 rounded-full bg-white text-[#D7192F] flex items-center justify-center shadow-lg active:scale-95 hover:scale-105 transition-transform cursor-pointer"
          >
            <Play className="w-6 h-6 fill-[#D7192F] ml-0.5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map((filter) => (
            <FilterPill
              key={filter}
              label={filter}
              isActive={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            />
          ))}
        </div>

        {/* Favorite Song List */}
        <section aria-label="Favorite Songs List" className="space-y-3">
          {favoriteSongs.map((song) => (
            <SongCard
              key={song.youtubeId}
              track={song}
              variant="favorite"
              isFavoritedInitial={true}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
