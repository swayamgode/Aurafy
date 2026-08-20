"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Plus, Check, Sparkles } from "lucide-react";
import SongCard from "@/components/SongCard";
import AddSongsModal from "@/components/AddSongsModal";
import { Track, Playlist } from "@/types/music";
import { useToast } from "@/lib/ToastContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const GUEST_USER_ID = "guest";

const COVER_PRESETS = [
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
];

export default function CreatePlaylistPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState<string>(COVER_PRESETS[0]);
  const [songs, setSongs] = useState<Track[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Safe Convex mutation
  let createPlaylistMut: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    createPlaylistMut = useMutation(api.playlists.createPlaylist);
  } catch {}

  const handleRemoveSong = (index: number) => {
    setSongs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleSong = (track: Track) => {
    setSongs((prev) => {
      const exists = prev.some((s) => s.youtubeId === track.youtubeId);
      if (exists) {
        return prev.filter((s) => s.youtubeId !== track.youtubeId);
      } else {
        return [...prev, track];
      }
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast("Please enter a playlist name", "info");
      return;
    }

    setIsSaving(true);
    const newId = `user-pl-${Date.now()}`;

    const newPlaylist: Playlist = {
      id: newId,
      title: name.trim(),
      description: description.trim() || "Created by you on Hue",
      coverUrl,
      creator: "You",
      songsCount: songs.length,
      songs,
    };

    // 1. Save to localStorage user playlists
    try {
      const stored = localStorage.getItem("aurafy_user_playlists");
      const list: Playlist[] = stored ? JSON.parse(stored) : [];
      list.unshift(newPlaylist);
      localStorage.setItem("aurafy_user_playlists", JSON.stringify(list));

      // Also save the initial songs for this playlist
      localStorage.setItem(`aurafy_playlist_${newId}`, JSON.stringify(songs));
    } catch (e) {
      console.warn("Local storage save error:", e);
    }

    // 2. Save to Convex if available
    if (createPlaylistMut) {
      try {
        await createPlaylistMut({
          userId: GUEST_USER_ID,
          title: name.trim(),
          description: description.trim(),
          coverUrl,
          creator: "You",
          isPublic: true,
          songs: songs.map((s) => ({
            youtubeId: s.youtubeId,
            title: s.title,
            artist: s.artist,
            thumbnailUrl: s.thumbnailUrl,
            duration: s.duration,
          })),
        });
      } catch (e) {
        console.warn("Convex save error:", e);
      }
    }

    setSavedSuccess(true);
    showToast(`Created playlist "${name.trim()}"!`, "success");

    setTimeout(() => {
      router.push(`/playlist/${newId}`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 bg-[#F8F9FA]/90 backdrop-blur-md border-b border-[#E3E4E6]">
        <button
          onClick={() => router.back()}
          aria-label="Close"
          className="w-10 h-10 rounded-full flex items-center justify-center text-black hover:bg-[#E3E4E6] active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-6 h-6 stroke-[2]" />
        </button>

        <h1 className="text-base font-extrabold text-black tracking-tight">
          New Playlist
        </h1>

        <button
          onClick={handleSave}
          disabled={!name.trim() || isSaving}
          className={`px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs ${
            name.trim()
              ? "bg-[#D7192F] text-white hover:bg-red-700 active:scale-95"
              : "bg-[#E3E4E6] text-[#8A8D91] cursor-not-allowed"
          }`}
        >
          {savedSuccess ? "SAVED!" : isSaving ? "SAVING..." : "CREATE"}
        </button>
      </header>

      {savedSuccess && (
        <div className="mx-5 mt-4 p-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl flex items-center justify-center space-x-2 animate-in fade-in duration-200 shadow-md">
          <Check className="w-4 h-4" />
          <span>Playlist created! Opening...</span>
        </div>
      )}

      <div className="px-5 py-6 space-y-7 max-w-md mx-auto">
        {/* Cover Preview & Presets */}
        <div className="flex flex-col items-center">
          <div className="relative w-44 h-44 rounded-3xl overflow-hidden bg-[#F1F2F3] border-2 border-white shadow-xl group mb-4">
            <Image
              src={coverUrl}
              alt="Cover Preview"
              fill
              sizes="176px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="w-full">
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#5F6368] mb-2 text-center">
              CHOOSE COVER ARTWORK
            </label>
            <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
              {COVER_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCoverUrl(preset)}
                  className={`relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    coverUrl === preset
                      ? "border-[#D7192F] scale-110 shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={preset} alt={`Preset ${i}`} fill sizes="44px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Playlist Details Inputs */}
        <div className="bg-white p-5 rounded-3xl border border-[#E3E4E6] shadow-xs space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#5F6368] mb-1.5">
              PLAYLIST NAME *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Late Night Drives, Gym Hype"
              className="w-full px-3.5 py-3 rounded-xl bg-[#F8F9FA] border border-[#E3E4E6] text-sm font-bold text-black focus:outline-none focus:border-[#D7192F] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-[#5F6368] mb-1.5">
              DESCRIPTION (OPTIONAL)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the mood or vibe..."
              className="w-full px-3.5 py-3 rounded-xl bg-[#F8F9FA] border border-[#E3E4E6] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#D7192F] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Songs in Playlist Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-black uppercase tracking-wider">
              Songs in Playlist ({songs.length})
            </h3>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#D7192F] text-white text-xs font-bold hover:bg-red-700 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Songs</span>
            </button>
          </div>

          {songs.length === 0 ? (
            <div className="py-8 text-center text-[#8A8D91] bg-white rounded-2xl border border-[#E3E4E6] p-4">
              <p className="text-xs font-bold text-black">No songs added yet</p>
              <p className="text-[11px] text-[#5F6368] mt-0.5">
                Tap &ldquo;+ Add Songs&rdquo; to browse downloaded songs or search YouTube.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {songs.map((song, index) => (
                <SongCard
                  key={`${song.youtubeId}-${index}`}
                  track={song}
                  variant="playlist"
                  onRemove={() => handleRemoveSong(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Songs Modal */}
      <AddSongsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedSongs={songs}
        onToggleSong={handleToggleSong}
      />
    </div>
  );
}
