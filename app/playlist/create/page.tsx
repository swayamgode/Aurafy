"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Camera, Plus, Check } from "lucide-react";
import SongCard from "@/components/SongCard";
import PlaylistCard from "@/components/PlaylistCard";
import { FOR_YOU_SONGS } from "@/lib/youtube";
import { Track } from "@/types/music";

export default function CreatePlaylistPage() {
  const router = useRouter();
  const [name, setName] = useState("Study Beats");
  const [description, setDescription] = useState("Tell more about this vibe...");
  const [coverUrl, setCoverUrl] = useState<string>(
    "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop"
  );
  const [songs, setSongs] = useState<Track[]>([
    FOR_YOU_SONGS[0],
    FOR_YOU_SONGS[1],
    FOR_YOU_SONGS[2],
    FOR_YOU_SONGS[3],
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleRemoveSong = (index: number) => {
    setSongs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddMoreSongs = () => {
    // Add next available song
    const unused = FOR_YOU_SONGS.find((s) => !songs.some((existing) => existing.youtubeId === s.youtubeId));
    if (unused) {
      setSongs((prev) => [...prev, unused]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    setSavedSuccess(true);
    setTimeout(() => {
      router.push("/");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#F8F9FA]/90 backdrop-blur-md border-b border-[#E3E4E6]">
        <Link
          href="/"
          aria-label="Close"
          className="w-10 h-10 rounded-full flex items-center justify-center text-black hover:bg-[#E3E4E6] active:scale-95 transition-all"
        >
          <X className="w-6 h-6 stroke-[2]" />
        </Link>

        <h1 className="text-lg font-bold text-black tracking-tight">
          Create Playlist
        </h1>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            name.trim()
              ? "bg-black text-white hover:bg-[#D7192F]"
              : "bg-[#E3E4E6] text-[#8A8D91] cursor-not-allowed"
          }`}
        >
          {savedSuccess ? "SAVED!" : "SAVE"}
        </button>
      </header>

      {savedSuccess && (
        <div className="mx-6 mt-4 p-3 bg-emerald-600 text-white text-xs font-semibold rounded-2xl flex items-center justify-center space-x-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4" />
          <span>Playlist saved successfully! Redirecting...</span>
        </div>
      )}

      <div className="px-6 py-6 space-y-8 max-w-md mx-auto">
        {/* Cover Upload Card */}
        <div className="flex flex-col items-center">
          <div className="relative w-44 h-44 rounded-3xl overflow-hidden bg-[#F1F2F3] border border-[#E3E4E6] shadow-sm group flex flex-col items-center justify-center text-[#5F6368] cursor-pointer hover:border-black transition-colors">
            {coverUrl ? (
              <Image src={coverUrl} alt="Cover Preview" fill sizes="176px" className="object-cover" />
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Camera className="w-8 h-8 stroke-[1.5]" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest">
                  UPLOAD COVER
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">CHANGE COVER</span>
            </div>
          </div>
        </div>

        {/* Playlist Details Inputs */}
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#5F6368] mb-1">
              PLAYLIST NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Study Beats"
              className="w-full pb-2 bg-transparent border-b-2 border-black text-lg font-bold text-black focus:outline-none focus:border-[#D7192F] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#5F6368] mb-1">
              DESCRIPTION
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell more about this vibe..."
              className="w-full pb-2 bg-transparent border-b border-[#E3E4E6] text-sm text-[#111111] focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Songs in Playlist Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
              Songs in Playlist ({songs.length})
            </h3>
            <button
              onClick={handleAddMoreSongs}
              className="px-3.5 py-1.5 rounded-full bg-[#D7192F] text-white text-xs font-bold hover:bg-red-700 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ ADD SONGS</span>
            </button>
          </div>

          <div className="space-y-3">
            {songs.map((song, index) => (
              <SongCard
                key={`${song.youtubeId}-${index}`}
                track={song}
                variant="playlist"
                onRemove={() => handleRemoveSong(index)}
              />
            ))}
          </div>
        </div>

        {/* Suggested Playlists Section */}
        <div className="pt-4 border-t border-[#E3E4E6]">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#5F6368] mb-4">
            Suggested for You
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <PlaylistCard
              playlist={{
                id: "sugg-1",
                title: "Nordic Chill",
                creator: "Ambient Explorer",
                coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop",
              }}
              variant="recommendation"
              onAdd={handleAddMoreSongs}
            />
            <PlaylistCard
              playlist={{
                id: "sugg-2",
                title: "Vinyl Library",
                creator: "The Archivist",
                coverUrl: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?q=80&w=400&auto=format&fit=crop",
              }}
              variant="recommendation"
              onAdd={handleAddMoreSongs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
