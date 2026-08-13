"use client";

import React, { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
import FilterPill from "@/components/FilterPill";
import SongCard from "@/components/SongCard";
import ArtistCard from "@/components/ArtistCard";
import PlaylistCard from "@/components/PlaylistCard";
import { searchYouTube } from "@/lib/youtube";
import { SearchResult } from "@/types/music";
import { Loader2, History } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Songs");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Indie Pop Essentials",
    "Global Top 50",
    "Lofi Nights",
    "Low Voltage",
  ]);

  const tabs = ["Songs", "Albums", "Artists", "Playlists", "Podcasts"];

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchYouTube(query);
        setResults(res);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleRecentClick = (term: string) => {
    setQuery(term);
  };

  return (
    <div className="min-h-screen">
      <AppHeader title="Search" showSearch={false} showProfile={true} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* Search Input Bar */}
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Artists, songs, lyrics..."
          onClear={() => setQuery("")}
        />

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => (
            <FilterPill
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-[#5F6368] space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#D7192F]" />
            <span className="text-xs font-semibold">Searching YouTube...</span>
          </div>
        )}

        {/* Search Results */}
        {!loading && results && (
          <div className="space-y-6">
            {activeTab === "Songs" && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-[#5F6368] uppercase tracking-wider">
                  Top Track Results ({results.songs.length})
                </h3>
                {results.songs.map((song) => (
                  <SongCard key={song.youtubeId} track={song} />
                ))}
              </section>
            )}

            {activeTab === "Artists" && (
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-[#5F6368] uppercase tracking-wider">
                  Artists
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {results.artists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </section>
            )}

            {activeTab === "Playlists" && (
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-[#5F6368] uppercase tracking-wider">
                  Playlists
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {results.playlists.map((pl) => (
                    <PlaylistCard key={pl.id} playlist={pl} />
                  ))}
                </div>
              </section>
            )}

            {(activeTab === "Albums" || activeTab === "Podcasts") && (
              <div className="py-10 text-center text-sm font-medium text-[#8A8D91]">
                No {activeTab.toLowerCase()} found for "{query || "popular"}".
              </div>
            )}
          </div>
        )}

        {/* Recent Searches */}
        {query.length === 0 && (
          <section className="pt-4 border-t border-[#E3E4E6]">
            <div className="flex items-center space-x-2 text-[#5F6368] mb-3">
              <History className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Recent Searches
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleRecentClick(term)}
                  className="px-3.5 py-1.5 rounded-full bg-[#F1F2F3] text-xs font-semibold text-[#111111] hover:bg-[#E3E4E6] transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
