"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Sparkles, Flame, Plus, Radio, ArrowRight, ListMusic, PlusCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AlbumCard from "@/components/AlbumCard";
import ArtistCard from "@/components/ArtistCard";
import PlaylistCard from "@/components/PlaylistCard";
import SongCard from "@/components/SongCard";
import {
  FAVOURITE_ARTISTS,
  TRENDING_PLAYLISTS,
} from "@/lib/youtube";
import { getAllOfflineTracks } from "@/lib/offlineStorage";
import { Playlist, Track } from "@/types/music";
import { usePlayer } from "@/lib/PlayerContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const GUEST_USER_ID = "guest";

export default function HomePage() {
  const { playTrack, downloadedIds } = usePlayer();
  const [localPlaylists, setLocalPlaylists] = useState<Playlist[]>([]);
  const [offlineSongs, setOfflineSongs] = useState<Track[]>([]);
  const [userFavorites, setUserFavorites] = useState<Track[]>([]);

  // Safe Convex query
  let convexPlaylists: any[] = [];
  let convexFavorites: any[] = [];
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useQuery(api.playlists.getPlaylists, { userId: GUEST_USER_ID });
    if (q) convexPlaylists = q;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const qFav = useQuery(api.favorites.getFavorites, { userId: GUEST_USER_ID });
    if (qFav) convexFavorites = qFav;
  } catch {}

  // Sync custom playlists & offline downloads
  useEffect(() => {
    try {
      const stored = localStorage.getItem("aurafy_user_playlists");
      if (stored) {
        setLocalPlaylists(JSON.parse(stored));
      }
      const storedFav = localStorage.getItem("aurafy_favorites");
      if (storedFav) {
        setUserFavorites(JSON.parse(storedFav));
      }
    } catch {}

    getAllOfflineTracks()
      .then((tracks) => setOfflineSongs(tracks))
      .catch(() => {});
  }, [downloadedIds]);

  const activeSongs = offlineSongs.length > 0 ? offlineSongs : userFavorites;

  // Combined user playlists
  const userPlaylists: Playlist[] =
    convexPlaylists.length > 0
      ? convexPlaylists.map((p: any) => ({
          id: p._id?.toString() || p.id,
          title: p.title,
          description: p.description,
          coverUrl: p.coverUrl,
          creator: p.creator || "You",
          songsCount: p.songsCount ?? 0,
        }))
      : localPlaylists;

  return (
    <div className="min-h-screen">
      <AppHeader title="Aurafy" showSearch={true} showProfile={true} />

      <div className="px-4 sm:px-6 space-y-8 mt-2">
        {/* Quick Action Navigation Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          <Link
            href="/playlist/create"
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#111111] text-white text-xs font-bold hover:bg-[#D7192F] active:scale-95 transition-all shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Playlist</span>
          </Link>

          <Link
            href="/favorites"
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#F1F2F3] text-[#111111] text-xs font-bold hover:bg-[#E3E4E6] active:scale-95 transition-all shrink-0"
          >
            <ListMusic className="w-3.5 h-3.5 text-[#D7192F]" />
            <span>My Library</span>
          </Link>

          <Link
            href="/activity"
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#F1F2F3] text-[#111111] text-xs font-bold hover:bg-[#E3E4E6] active:scale-95 transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D7192F]" />
            <span>Activity Stats</span>
          </Link>

          <Link
            href="/import"
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#F1F2F3] text-[#111111] text-xs font-bold hover:bg-[#E3E4E6] active:scale-95 transition-all shrink-0"
          >
            <Radio className="w-3.5 h-3.5 text-[#5F6368]" />
            <span>Import Music</span>
          </Link>
        </div>

        {/* Featured Track Hero Card — dynamic from downloads/favorites */}
        {activeSongs.length > 0 ? (
          <section aria-label="Featured Track">
            <div
              onClick={() => playTrack(activeSongs[0])}
              className="relative w-full h-56 sm:h-64 rounded-3xl overflow-hidden bg-black shadow-xl cursor-pointer group border border-black/10 active:scale-[0.99] transition-transform"
            >
              <Image
                src={activeSongs[0].thumbnailUrl || "/cover-placeholder.png"}
                alt={activeSongs[0].title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              />
              {/* Gradient Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end">
                <div className="flex items-center space-x-2 text-[#D7192F] mb-1">
                  <Flame className="w-4 h-4 fill-[#D7192F]" />
                  <span className="text-[11px] font-extrabold tracking-widest uppercase">
                    DOWNLOADED
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {activeSongs[0].title}
                </h2>
                <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                  By {activeSongs[0].artist}
                </p>
                <div className="mt-4 flex items-center space-x-3">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-full bg-[#D7192F] text-white text-xs font-bold flex items-center space-x-2 shadow-lg group-hover:bg-red-700 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                    <span>PLAY NOW</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section aria-label="Get Started">
            <Link href="/search">
              <div className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden bg-gradient-to-br from-[#111111] to-[#D7192F] shadow-xl cursor-pointer group border border-black/10 active:scale-[0.99] transition-transform flex flex-col items-center justify-center text-center p-6">
                <Sparkles className="w-10 h-10 text-white/60 mb-3" />
                <h2 className="text-xl font-extrabold text-white">Start Your Journey</h2>
                <p className="text-xs text-white/70 mt-1">Search for songs and download them for offline listening</p>
                <div className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold flex items-center space-x-2 shadow-lg">
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                  <span>FIND SONGS</span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Your Playlists Section (Shown if user has custom playlists or quick create) */}
        <section aria-label="Your Playlists">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-base sm:text-lg font-extrabold text-black tracking-tight flex items-center gap-2">
              <span>Your Playlists</span>
              {userPlaylists.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E3E4E6] text-[10px] font-bold text-[#5F6368]">
                  {userPlaylists.length}
                </span>
              )}
            </h3>
            <Link
              href="/playlist/create"
              className="text-xs font-bold text-[#D7192F] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </Link>
          </div>

          <div className="flex items-center space-x-3.5 overflow-x-auto no-scrollbar pb-2">
            {/* Create Playlist Shortcut Card */}
            <Link
              href="/playlist/create"
              className="w-32 sm:w-36 h-40 sm:h-44 rounded-2xl bg-white border-2 border-dashed border-[#E3E4E6] hover:border-[#D7192F] flex flex-col items-center justify-center p-3 text-center shrink-0 shadow-2xs hover:shadow-xs active:scale-95 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 group-hover:bg-[#D7192F] flex items-center justify-center transition-colors mb-2">
                <Plus className="w-5 h-5 text-[#D7192F] group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-bold text-black group-hover:text-[#D7192F] transition-colors">
                New Playlist
              </span>
              <span className="text-[10px] text-[#8A8D91] mt-0.5">Create custom vibe</span>
            </Link>

            {userPlaylists.map((pl) => (
              <div key={pl.id} className="w-36 sm:w-40 shrink-0">
                <PlaylistCard playlist={pl} />
              </div>
            ))}
          </div>
        </section>

        {/* Recently Played Section (shows downloaded / favorited tracks) */}
        {activeSongs.length > 0 && (
          <section aria-label="Recently Played">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base sm:text-lg font-extrabold text-black tracking-tight">
                Recently Downloaded & Played
              </h3>
              <Link
                href="/favorites"
                className="text-xs font-bold text-[#5F6368] hover:text-[#D7192F] transition-colors"
              >
                See All ({activeSongs.length})
              </Link>
            </div>
            <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar pb-2">
              {activeSongs.map((track) => (
                <AlbumCard key={track.youtubeId} track={track} />
              ))}
            </div>
          </section>
        )}

        {/* Favourite Artists Section */}
        <section aria-label="Favourite Artists">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-base sm:text-lg font-extrabold text-black tracking-tight">
              Favourite Artists
            </h3>
          </div>
          <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar pb-2">
            {FAVOURITE_ARTISTS.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>

        {/* Trending Playlists Grid */}
        <section aria-label="Trending Playlists">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-base sm:text-lg font-extrabold text-black tracking-tight">
              Trending Playlists
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {TRENDING_PLAYLISTS.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        </section>

        {/* For You / Downloaded Songs List */}
        {activeSongs.length > 0 ? (
          <section aria-label="Your Songs">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base sm:text-lg font-extrabold text-black tracking-tight">
                Your Offline Vault & Favorites
              </h3>
              <span className="text-xs text-[#8A8D91] font-medium">
                Ready to play anytime
              </span>
            </div>
            <div className="space-y-2.5">
              {activeSongs.map((song) => (
                <SongCard key={song.youtubeId} track={song} />
              ))}
            </div>
          </section>
        ) : (
          <section aria-label="Discover Music" className="bg-white rounded-3xl p-6 border border-[#E3E4E6] text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#D7192F] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-black">Start Your Music Collection</h4>
            <p className="text-xs text-[#5F6368] max-w-xs mx-auto">
              Search YouTube for your favourite songs, tap &ldquo;⋮&rdquo; to download offline or save to favorites!
            </p>
            <Link
              href="/search"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold hover:bg-[#D7192F] transition-colors"
            >
              <span>Search Songs Now</span>
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
