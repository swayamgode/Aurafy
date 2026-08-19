"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  Search,
  Check,
  Plus,
  ArrowDownCircle,
  Heart,
  Sparkles,
  Music,
  Loader2,
} from "lucide-react";
import { Track } from "@/types/music";
import { searchYouTube, FOR_YOU_SONGS, RECENTLY_PLAYED_INITIAL } from "@/lib/youtube";
import { getAllOfflineTracks } from "@/lib/offlineStorage";
import FilterPill from "@/components/FilterPill";
import { useToast } from "@/lib/ToastContext";

interface AddSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSongs: Track[];
  onToggleSong: (track: Track) => void;
}

type TabType = "Search" | "Downloaded" | "Favorites" | "Recommended";

export default function AddSongsModal({
  isOpen,
  onClose,
  selectedSongs,
  onToggleSong,
}: AddSongsModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("Search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>(FOR_YOU_SONGS);
  const [isSearching, setIsSearching] = useState(false);
  const [downloadedSongs, setDownloadedSongs] = useState<Track[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<Track[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load offline downloaded & favorite songs on open
  useEffect(() => {
    if (isOpen) {
      getAllOfflineTracks()
        .then((tracks) => setDownloadedSongs(tracks))
        .catch(() => {});

      try {
        const storedLL = localStorage.getItem("aurafy_listen_later");
        const listLL: Track[] = storedLL ? JSON.parse(storedLL) : [];
        const combined = [...listLL, ...FOR_YOU_SONGS.slice(0, 4)];
        // Deduplicate
        const unique = combined.filter(
          (track, index, self) =>
            index === self.findIndex((t) => t.youtubeId === track.youtubeId)
        );
        setFavoriteSongs(unique);
      } catch {}
    }
  }, [isOpen]);

  // Handle debounced search query
  useEffect(() => {
    if (activeTab !== "Search") return;

    if (!searchQuery.trim()) {
      setSearchResults(FOR_YOU_SONGS);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchYouTube(searchQuery.trim());
        setSearchResults(res.songs || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, activeTab]);

  if (!isOpen) return null;

  const isSongSelected = (youtubeId: string) =>
    selectedSongs.some((s) => s.youtubeId === youtubeId);

  const tabs: TabType[] = ["Search", "Downloaded", "Favorites", "Recommended"];

  const getDisplayedSongs = () => {
    switch (activeTab) {
      case "Downloaded":
        return downloadedSongs;
      case "Favorites":
        return favoriteSongs;
      case "Recommended":
        return [...FOR_YOU_SONGS, ...RECENTLY_PLAYED_INITIAL];
      case "Search":
      default:
        return searchResults;
    }
  };

  const displayedList = getDisplayedSongs();

  const handleToggle = (track: Track) => {
    const wasSelected = isSongSelected(track.youtubeId);
    onToggleSong(track);
    if (!wasSelected) {
      showToast(`Added "${track.title}" to playlist`, "success");
    } else {
      showToast(`Removed "${track.title}" from playlist`, "info");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#F8F9FA] w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[88vh] h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-[#E3E4E6]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E3E4E6]">
          <div>
            <h2 className="text-base font-extrabold text-black">Add Songs to Playlist</h2>
            <p className="text-xs text-[#5F6368] font-medium">
              {selectedSongs.length} {selectedSongs.length === 1 ? "song" : "songs"} selected
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close song picker"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#F1F2F3] hover:bg-[#E3E4E6] active:scale-95 transition-colors cursor-pointer text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-white border-b border-[#E3E4E6] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A8D91] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "Search") setActiveTab("Search");
              }}
              placeholder="Search YouTube songs, artists..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#F8F9FA] border border-[#E3E4E6] rounded-2xl text-xs font-semibold text-black placeholder:text-[#8A8D91] focus:outline-none focus:border-[#D7192F] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8D91] hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {tabs.map((tab) => (
              <FilterPill
                key={tab}
                label={
                  tab === "Downloaded"
                    ? `Downloaded (${downloadedSongs.length})`
                    : tab
                }
                isActive={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </div>
        </div>

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isSearching ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#D7192F]" />
              <p className="text-xs font-bold text-[#5F6368]">Searching songs...</p>
            </div>
          ) : displayedList.length === 0 ? (
            <div className="py-16 text-center text-[#8A8D91] space-y-2">
              {activeTab === "Downloaded" ? (
                <>
                  <ArrowDownCircle className="w-10 h-10 mx-auto text-[#8A8D91]/60" />
                  <p className="text-sm font-bold text-black">No downloaded songs yet</p>
                  <p className="text-xs">
                    Download songs from search or favorites to add them offline!
                  </p>
                </>
              ) : (
                <>
                  <Music className="w-10 h-10 mx-auto text-[#8A8D91]/60" />
                  <p className="text-sm font-bold text-black">No songs found</p>
                  <p className="text-xs">Try searching for a different artist or song name.</p>
                </>
              )}
            </div>
          ) : (
            displayedList.map((track, idx) => {
              const selected = isSongSelected(track.youtubeId);
              return (
                <div
                  key={`${track.youtubeId}-${idx}`}
                  className={`flex items-center justify-between p-3 rounded-2xl bg-white border transition-all ${
                    selected
                      ? "border-[#D7192F]/40 shadow-2xs"
                      : "border-[#E3E4E6] hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-3">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                      <Image
                        src={track.thumbnailUrl}
                        alt={track.title}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-black truncate">{track.title}</p>
                      <p className="text-[11px] text-[#5F6368] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(track)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 shrink-0 transition-all cursor-pointer ${
                      selected
                        ? "bg-black text-white hover:bg-neutral-800"
                        : "bg-red-50 text-[#D7192F] hover:bg-[#D7192F] hover:text-white border border-[#D7192F]/30"
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Done Bar */}
        <div className="p-4 bg-white border-t border-[#E3E4E6] flex items-center justify-between">
          <div className="text-xs font-semibold text-[#5F6368]">
            <span className="font-extrabold text-black">{selectedSongs.length}</span> songs ready
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-black text-white text-xs font-extrabold hover:bg-neutral-800 active:scale-95 transition-transform cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
