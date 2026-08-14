"use client";

import React, { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import FilterPill from "@/components/FilterPill";
import SongCard from "@/components/SongCard";
import { FOR_YOU_SONGS, RECENTLY_PLAYED_INITIAL } from "@/lib/youtube";
import { Track } from "@/types/music";
import { Heart, Play, Clock, Music } from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const GUEST_USER_ID = "guest";

export default function FavoritesPage() {
  const [activeFilter, setActiveFilter] = useState("All Songs");
  const { playTrack } = usePlayer();
  const [localListenLater, setLocalListenLater] = useState<Track[]>([]);

  const favoriteSongs = FOR_YOU_SONGS.concat(RECENTLY_PLAYED_INITIAL);

  // Safe Convex query
  let convexListenLater: any[] = [];
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useQuery(api.listenLater.getListenLater, { userId: GUEST_USER_ID });
    if (q) convexListenLater = q;
  } catch {}

  // Sync from localStorage as well
  useEffect(() => {
    try {
      const stored = localStorage.getItem("aurafy_listen_later");
      if (stored) {
        setLocalListenLater(JSON.parse(stored));
      }
    } catch {}
  }, [activeFilter]);

  const filters = ["All Songs", "Listen Later", "Recently Added"];

  // Combined listen later tracks
  const combinedListenLater: Track[] =
    convexListenLater.length > 0
      ? convexListenLater.map((item: any) => ({
          youtubeId: item.youtubeId,
          title: item.title,
          artist: item.artist,
          thumbnailUrl: item.thumbnailUrl,
          duration: item.duration,
        }))
      : localListenLater;

  const displayedSongs: Track[] =
    activeFilter === "Listen Later"
      ? combinedListenLater
      : favoriteSongs;

  return (
    <div className="min-h-screen">
      <AppHeader title="Favourites" showSearch={true} showProfile={false} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* Favourites Banner Header */}
        <div className="bg-gradient-to-r from-red-600 to-[#D7192F] rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-white/80 mb-1">
              {activeFilter === "Listen Later" ? (
                <Clock className="w-4 h-4 text-white" />
              ) : (
                <Heart className="w-4 h-4 fill-white text-white" />
              )}
              <span className="text-[11px] font-extrabold uppercase tracking-widest">
                YOUR LIBRARY
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {activeFilter === "Listen Later" ? "Listen Later" : "Liked Songs"}
            </h2>
            <p className="text-xs text-white/80 font-medium mt-1">
              {displayedSongs.length} {displayedSongs.length === 1 ? "track" : "tracks"} saved
            </p>
          </div>

          {displayedSongs.length > 0 && (
            <button
              onClick={() => playTrack(displayedSongs[0], displayedSongs)}
              aria-label="Play all songs"
              className="w-14 h-14 rounded-full bg-white text-[#D7192F] flex items-center justify-center shadow-lg active:scale-95 hover:scale-105 transition-transform cursor-pointer"
            >
              <Play className="w-6 h-6 fill-[#D7192F] ml-0.5" />
            </button>
          )}
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

        {/* Song List */}
        <section aria-label="Songs List" className="space-y-3">
          {displayedSongs.length === 0 ? (
            <div className="py-12 text-center text-[#8A8D91] space-y-2">
              <Music className="w-10 h-10 mx-auto text-[#8A8D91]/60" />
              <p className="text-sm font-semibold">No tracks in Listen Later yet.</p>
              <p className="text-xs">Search for songs and tap &ldquo;⋮&rdquo; &rarr; &ldquo;Listen Later&rdquo; to save.</p>
            </div>
          ) : (
            displayedSongs.map((song, i) => (
              <SongCard
                key={`${song.youtubeId}-${i}`}
                track={song}
                variant="favorite"
                isFavoritedInitial={true}
              />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
