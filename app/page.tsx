"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Sparkles, Flame, Plus, Radio, ArrowRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AlbumCard from "@/components/AlbumCard";
import ArtistCard from "@/components/ArtistCard";
import PlaylistCard from "@/components/PlaylistCard";
import SongCard from "@/components/SongCard";
import {
  FEATURED_ALBUM,
  RECENTLY_PLAYED_INITIAL,
  FAVOURITE_ARTISTS,
  TRENDING_PLAYLISTS,
  FOR_YOU_SONGS,
} from "@/lib/youtube";
import { usePlayer } from "@/lib/PlayerContext";

export default function HomePage() {
  const { playTrack } = usePlayer();

  return (
    <div className="min-h-screen">
      <AppHeader title="Aurafy" showSearch={true} showProfile={true} />

      <div className="px-4 sm:px-6 space-y-8 mt-2">
        {/* Quick Action Navigation Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          <Link
            href="/playlist/create"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#111111] text-white text-xs font-semibold hover:bg-[#D7192F] transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Playlist</span>
          </Link>

          <Link
            href="/activity"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#F1F2F3] text-[#111111] text-xs font-semibold hover:bg-[#E3E4E6] transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D7192F]" />
            <span>Activity Stats</span>
          </Link>

          <Link
            href="/import"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#F1F2F3] text-[#111111] text-xs font-semibold hover:bg-[#E3E4E6] transition-colors shrink-0"
          >
            <Radio className="w-3.5 h-3.5 text-[#5F6368]" />
            <span>Import Music</span>
          </Link>
        </div>

        {/* Featured Album Hero Card */}
        <section aria-label="Featured Album">
          <div
            onClick={() =>
              playTrack({
                youtubeId: FEATURED_ALBUM.youtubeId,
                title: FEATURED_ALBUM.title,
                artist: FEATURED_ALBUM.artist,
                thumbnailUrl: FEATURED_ALBUM.coverUrl,
                duration: FEATURED_ALBUM.duration,
              })
            }
            className="relative w-full h-56 sm:h-64 rounded-3xl overflow-hidden bg-black shadow-xl cursor-pointer group border border-black/10"
          >
            <Image
              src={FEATURED_ALBUM.coverUrl}
              alt={FEATURED_ALBUM.title}
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
                  {FEATURED_ALBUM.tag}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {FEATURED_ALBUM.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                By {FEATURED_ALBUM.artist}
              </p>

              <div className="mt-4 flex items-center space-x-3">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-full bg-[#D7192F] text-white text-xs font-bold flex items-center space-x-2 shadow-lg group-hover:bg-red-700 transition-colors"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>PLAY NOW</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Recently Played Section */}
        <section aria-label="Recently Played">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-black tracking-tight">
              Recently Played
            </h3>
            <Link
              href="/favorites"
              className="text-xs font-bold text-[#5F6368] hover:text-[#D7192F] transition-colors"
            >
              See All
            </Link>
          </div>
          <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar pb-2">
            {RECENTLY_PLAYED_INITIAL.map((track) => (
              <AlbumCard key={track.youtubeId} track={track} />
            ))}
          </div>
        </section>

        {/* Favourite Artists Section */}
        <section aria-label="Favourite Artists">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-black tracking-tight">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-black tracking-tight">
              Trending Playlists
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {TRENDING_PLAYLISTS.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                onPlay={() =>
                  playTrack({
                    youtubeId: `pl-track-${pl.id}`,
                    title: pl.title,
                    artist: pl.creator || "Aurafy",
                    thumbnailUrl: pl.coverUrl || "",
                    duration: 210,
                  })
                }
              />
            ))}
          </div>
        </section>

        {/* For You Recommended Songs List */}
        <section aria-label="For You">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-black tracking-tight">
              For You
            </h3>
            <span className="text-xs text-[#8A8D91] font-medium">
              Based on your taste
            </span>
          </div>
          <div className="space-y-3">
            {FOR_YOU_SONGS.map((song) => (
              <SongCard key={song.youtubeId} track={song} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
