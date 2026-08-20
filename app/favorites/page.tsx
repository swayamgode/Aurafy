"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import FilterPill from "@/components/FilterPill";
import SongCard from "@/components/SongCard";
import PlaylistCard from "@/components/PlaylistCard";
import { TRENDING_PLAYLISTS } from "@/lib/youtube";
import { getAllOfflineTracks, getOfflineStorageUsage } from "@/lib/offlineStorage";
import { Track, Playlist } from "@/types/music";
import { Heart, Play, Clock, Music, ListMusic, Plus, ArrowDownCircle, HardDrive } from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const GUEST_USER_ID = "guest";

export default function FavoritesPage() {
  const [activeFilter, setActiveFilter] = useState("All Songs");
  const { playTrack, downloadedIds } = usePlayer();
  const [localFavorites, setLocalFavorites] = useState<Track[]>([]);
  const [localListenLater, setLocalListenLater] = useState<Track[]>([]);
  const [localPlaylists, setLocalPlaylists] = useState<Playlist[]>([]);
  const [offlineTracks, setOfflineTracks] = useState<Track[]>([]);
  const [storageUsage, setStorageUsage] = useState<{ count: number; sizeMB: number }>({
    count: 0,
    sizeMB: 0,
  });

  // Safe Convex queries
  let convexFavorites: any[] = [];
  let convexListenLater: any[] = [];
  let convexPlaylists: any[] = [];
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q0 = useQuery(api.favorites.getFavorites, { userId: GUEST_USER_ID });
    if (q0) convexFavorites = q0;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q1 = useQuery(api.listenLater.getListenLater, { userId: GUEST_USER_ID });
    if (q1) convexListenLater = q1;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q2 = useQuery(api.playlists.getPlaylists, { userId: GUEST_USER_ID });
    if (q2) convexPlaylists = q2;
  } catch {}

  // Sync from localStorage & IndexedDB
  useEffect(() => {
    try {
      const storedFav = localStorage.getItem("aurafy_favorites");
      if (storedFav) setLocalFavorites(JSON.parse(storedFav));

      const storedLL = localStorage.getItem("aurafy_listen_later");
      if (storedLL) setLocalListenLater(JSON.parse(storedLL));

      const storedPL = localStorage.getItem("aurafy_user_playlists");
      if (storedPL) setLocalPlaylists(JSON.parse(storedPL));
    } catch {}

    getAllOfflineTracks().then((tracks) => setOfflineTracks(tracks)).catch(() => {});
    getOfflineStorageUsage().then((usage) => setStorageUsage(usage)).catch(() => {});
  }, [activeFilter, downloadedIds]);

  const filters = ["All Songs", "Downloaded", "Playlists", "Listen Later", "Recently Added"];

  // Combined favorites
  const combinedFavorites: Track[] =
    convexFavorites.length > 0
      ? convexFavorites.map((item: any) => ({
          youtubeId: item.youtubeId,
          title: item.title,
          artist: item.artist,
          thumbnailUrl: item.thumbnailUrl,
          duration: item.duration,
        }))
      : localFavorites;

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

  // Combined user playlists + presets
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
  ];

  // All songs collection (user favorites + downloaded tracks deduplicated)
  const allSavedSongsMap = new Map<string, Track>();
  offlineTracks.forEach((t) => allSavedSongsMap.set(t.youtubeId, t));
  combinedFavorites.forEach((t) => allSavedSongsMap.set(t.youtubeId, t));
  const allSavedSongs = Array.from(allSavedSongsMap.values());

  const displayedSongs: Track[] =
    activeFilter === "Downloaded"
      ? offlineTracks
      : activeFilter === "Listen Later"
      ? combinedListenLater
      : activeFilter === "Recently Added"
      ? offlineTracks
      : allSavedSongs.length > 0
      ? allSavedSongs
      : offlineTracks;

  return (
    <div className="min-h-screen pb-32">
      <AppHeader title="Favourites" showSearch={true} showProfile={false} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-red-600 to-[#D7192F] rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-white/80 mb-1">
              {activeFilter === "Downloaded" ? (
                <ArrowDownCircle className="w-4 h-4 text-white" />
              ) : activeFilter === "Listen Later" ? (
                <Clock className="w-4 h-4 text-white" />
              ) : activeFilter === "Playlists" ? (
                <ListMusic className="w-4 h-4 text-white" />
              ) : (
                <Heart className="w-4 h-4 fill-white text-white" />
              )}
              <span className="text-[11px] font-extrabold uppercase tracking-widest">
                {activeFilter === "Downloaded" ? "OFFLINE VAULT" : "YOUR LIBRARY"}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {activeFilter === "Downloaded"
                ? "Downloaded Music"
                : activeFilter === "Listen Later"
                ? "Listen Later"
                : activeFilter === "Playlists"
                ? "Your Playlists"
                : "Liked Songs"}
            </h2>
            <p className="text-xs text-white/80 font-medium mt-1">
              {activeFilter === "Playlists"
                ? `${allUserPlaylists.length} playlists available`
                : activeFilter === "Downloaded"
                ? `${displayedSongs.length} tracks offline • ${storageUsage.sizeMB} MB`
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

        {/* Storage Stats Pill for Downloaded tab */}
        {activeFilter === "Downloaded" && offlineTracks.length > 0 && (
          <div className="flex items-center justify-between bg-white border border-[#E3E4E6] rounded-2xl px-4 py-3 text-xs shadow-2xs">
            <div className="flex items-center space-x-2 text-[#5F6368]">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-black">Offline Phone Storage:</span>
              <span>{storageUsage.sizeMB} MB used</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Ready Offline
            </span>
          </div>
        )}

        {/* Content Section */}
        {activeFilter === "Playlists" ? (
          <section aria-label="Playlists Grid" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
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
                {activeFilter === "Downloaded" ? (
                  <>
                    <ArrowDownCircle className="w-10 h-10 mx-auto text-[#8A8D91]/60" />
                    <p className="text-sm font-semibold">No downloaded songs yet.</p>
                    <p className="text-xs max-w-xs mx-auto">
                      Tap the &ldquo;⋮&rdquo; menu on any song and select &ldquo;Download to Phone&rdquo; to save for anytime offline listening!
                    </p>
                  </>
                ) : activeFilter === "Listen Later" ? (
                  <>
                    <Clock className="w-10 h-10 mx-auto text-[#8A8D91]/60" />
                    <p className="text-sm font-semibold">No tracks in Listen Later yet.</p>
                    <p className="text-xs">
                      Search for songs and tap &ldquo;⋮&rdquo; &rarr; &ldquo;Listen Later&rdquo; to save.
                    </p>
                  </>
                ) : (
                  <>
                    <Music className="w-10 h-10 mx-auto text-[#8A8D91]/60" />
                    <p className="text-sm font-semibold">No songs saved yet.</p>
                    <p className="text-xs">Explore songs and tap the heart icon to save.</p>
                  </>
                )}
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
