"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import FilterPill from "@/components/FilterPill";
import SongCard from "@/components/SongCard";
import PlaylistCard from "@/components/PlaylistCard";
import { FOR_YOU_SONGS, RECENTLY_PLAYED_INITIAL, TRENDING_PLAYLISTS } from "@/lib/youtube";
import { Track, Playlist } from "@/types/music";
import { Heart, Play, Clock, Music, ListMusic, Plus } from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const GUEST_USER_ID = "guest";

export default function FavoritesPage() {
  const [activeFilter, setActiveFilter] = useState("All Songs");
  const { playTrack } = usePlayer();
  const [localListenLater, setLocalListenLater] = useState<Track[]>([]);
  const [localPlaylists, setLocalPlaylists] = useState<Playlist[]>([]);

  const favoriteSongs = FOR_YOU_SONGS.concat(RECENTLY_PLAYED_INITIAL);

  // Safe Convex queries
  let convexListenLater: any[] = [];
  let convexPlaylists: any[] = [];
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q1 = useQuery(api.listenLater.getListenLater, { userId: GUEST_USER_ID });
    if (q1) convexListenLater = q1;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q2 = useQuery(api.playlists.getPlaylists, { userId: GUEST_USER_ID });
    if (q2) convexPlaylists = q2;
  } catch {}

  // Sync from localStorage
  useEffect(() => {
    try {
      const storedLL = localStorage.getItem("aurafy_listen_later");
      if (storedLL) setLocalListenLater(JSON.parse(storedLL));

      const storedPL = localStorage.getItem("aurafy_user_playlists");
      if (storedPL) setLocalPlaylists(JSON.parse(storedPL));
    } catch {}
  }, [activeFilter]);

  const filters = ["All Songs", "Playlists", "Listen Later", "Recently Added"];

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

  // Combined user playlists + trending
  const allUserPlaylists: Playlist[] = [
    ...(convexPlaylists.length > 0
      ? convexPlaylists.map((p: any) => ({
          id: p._id?.toString() || p.id,
          title: p.title,
          description: p.description,
          coverUrl: p.coverUrl,
          creator: p.creator || "You",
          songsCount: p.songsCount ?? 0,
        }))
      : localPlaylists),
    ...TRENDING_PLAYLISTS,
  ];

  const displayedSongs: Track[] =
    activeFilter === "Listen Later"
      ? combinedListenLater
      : favoriteSongs;

  return (
    <div className="min-h-screen pb-32">
      <AppHeader title="Favourites" showSearch={true} showProfile={false} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-red-600 to-[#D7192F] rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-white/80 mb-1">
              {activeFilter === "Listen Later" ? (
                <Clock className="w-4 h-4 text-white" />
              ) : activeFilter === "Playlists" ? (
                <ListMusic className="w-4 h-4 text-white" />
              ) : (
                <Heart className="w-4 h-4 fill-white text-white" />
              )}
              <span className="text-[11px] font-extrabold uppercase tracking-widest">
                YOUR LIBRARY
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {activeFilter === "Listen Later"
                ? "Listen Later"
                : activeFilter === "Playlists"
                ? "Your Playlists"
                : "Liked Songs"}
            </h2>
            <p className="text-xs text-white/80 font-medium mt-1">
              {activeFilter === "Playlists"
                ? `${allUserPlaylists.length} playlists available`
                : `${displayedSongs.length} ${displayedSongs.length === 1 ? "track" : "tracks"} saved`}
            </p>
          </div>

          {activeFilter === "Playlists" ? (
            <Link
              href="/playlist/create"
              aria-label="Create new playlist"
              className="w-14 h-14 rounded-full bg-white text-[#D7192F] flex items-center justify-center shadow-lg active:scale-95 hover:scale-105 transition-transform cursor-pointer"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </Link>
          ) : (
            displayedSongs.length > 0 && (
              <button
                onClick={() => playTrack(displayedSongs[0], displayedSongs)}
                aria-label="Play all songs"
                className="w-14 h-14 rounded-full bg-white text-[#D7192F] flex items-center justify-center shadow-lg active:scale-95 hover:scale-105 transition-transform cursor-pointer"
              >
                <Play className="w-6 h-6 fill-[#D7192F] ml-0.5" />
              </button>
            )
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

        {/* Content Section */}
        {activeFilter === "Playlists" ? (
          <section aria-label="Playlists Grid" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Create Playlist Card */}
              <Link
                href="/playlist/create"
                className="group flex flex-col items-center justify-center bg-white rounded-2xl p-5 border-2 border-dashed border-[#E3E4E6] hover:border-[#D7192F] transition-all hover:shadow-md active:scale-98 cursor-pointer min-h-[190px] text-center"
              >
                <div className="w-12 h-12 rounded-full bg-red-50 group-hover:bg-[#D7192F] flex items-center justify-center transition-colors mb-2.5">
                  <Plus className="w-6 h-6 text-[#D7192F] group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-sm font-bold text-black group-hover:text-[#D7192F] transition-colors">
                  Create Playlist
                </h4>
                <p className="text-[11px] text-[#8A8D91] mt-1">Tap to create</p>
              </Link>

              {allUserPlaylists.map((pl) => (
                <PlaylistCard key={pl.id} playlist={pl} />
              ))}
            </div>
          </section>
        ) : (
          <section aria-label="Songs List" className="space-y-2.5">
            {displayedSongs.length === 0 ? (
              <div className="py-12 text-center text-[#8A8D91] space-y-2">
                <Music className="w-10 h-10 mx-auto text-[#8A8D91]/60" />
                <p className="text-sm font-semibold">
                  {activeFilter === "Listen Later"
                    ? "No tracks in Listen Later yet."
                    : "No songs saved yet."}
                </p>
                <p className="text-xs">
                  Search for songs and tap &ldquo;⋮&rdquo; &rarr; &ldquo;Listen Later&rdquo; to save.
                </p>
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
        )}
      </div>
    </div>
  );
}
