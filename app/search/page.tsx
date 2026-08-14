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
import { Loader2, History, Music2, PlayCircle } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Songs");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Lofi Hip Hop",
    "Trending Pop 2024",
    "Tamil Hits",
    "EDM Party",
    "Arijit Singh",
  ]);

  const tabs = ["Songs", "Artists", "Playlists"];

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }

      setLoading(true);
      try {
        const res = await searchYouTube(query);
        setResults(res);

        // Add to recent searches
        setRecentSearches((prev) => {
          const filtered = prev.filter((s) => s.toLowerCase() !== query.toLowerCase());
          return [query, ...filtered].slice(0, 8);
        });
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleRecentClick = (term: string) => {
    setQuery(term);
  };

  return (
    <div className="min-h-screen pb-32">
      <AppHeader title="Search" showSearch={false} showProfile={true} />

      <div className="px-4 sm:px-6 space-y-4 mt-2">
        {/* Search Input Bar */}
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search songs, artists, albums..."
          onClear={() => {
            setQuery("");
            setResults(null);
          }}
        />

        {/* Tab Navigation */}
        {query.trim().length > 0 && (
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
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-[#5F6368] space-y-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#D7192F]" />
              <PlayCircle className="w-4 h-4 absolute text-[#D7192F]" />
            </div>
            <span className="text-sm font-semibold text-[#5F6368]">Searching music...</span>
          </div>
        )}

        {/* Search Results */}
        {!loading && results && query.trim().length > 0 && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100">
                <Music2 className="w-3.5 h-3.5 text-[#D7192F]" />
                <span className="text-xs font-semibold text-[#D7192F]">Top Matches</span>
              </div>
              <span className="text-xs text-[#8A8D91]">for &ldquo;{query}&rdquo;</span>
            </div>

            {activeTab === "Songs" && (
              <section className="space-y-2.5">
                <h3 className="text-xs font-bold text-[#5F6368] uppercase tracking-wider">
                  Songs ({(results?.songs || []).length})
                </h3>
                {(results?.songs || []).length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#8A8D91]">
                    No songs found. Try another search.
                  </div>
                ) : (
                  (results?.songs || []).map((song, i) => (
                    <SongCard key={`${song.youtubeId}-${i}`} track={song} />
                  ))
                )}
              </section>
            )}

            {activeTab === "Artists" && (
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-[#5F6368] uppercase tracking-wider">
                  Artists
                </h3>
                {(results?.artists || []).length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#8A8D91]">
                    No artists matched for &ldquo;{query}&rdquo;.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {(results?.artists || []).map((artist) => (
                      <ArtistCard key={artist.id} artist={artist} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "Playlists" && (
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-[#5F6368] uppercase tracking-wider">
                  Playlists
                </h3>
                {(results?.playlists || []).length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#8A8D91]">
                    No playlists found for &ldquo;{query}&rdquo;.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(results?.playlists || []).map((pl) => (
                      <PlaylistCard key={pl.id} playlist={pl} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* Recent Searches — shown only when no query */}
        {query.length === 0 && (
          <section className="pt-2">
            {/* Trending chips */}
            <div className="flex items-center space-x-2 text-[#5F6368] mb-3">
              <History className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Recent Searches</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleRecentClick(term)}
                  className="px-3.5 py-1.5 rounded-full bg-[#F1F2F3] text-xs font-semibold text-[#111111] hover:bg-[#E3E4E6] active:scale-95 transition-all"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Browse Categories */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6368] mb-3">
                Browse by Genre
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Hip-Hop", color: "from-purple-500 to-indigo-600", q: "hip hop hits 2024" },
                  { label: "Pop", color: "from-pink-500 to-rose-600", q: "pop hits 2024" },
                  { label: "Lofi", color: "from-teal-500 to-cyan-600", q: "lofi hip hop" },
                  { label: "Electronic", color: "from-blue-500 to-violet-600", q: "electronic dance music" },
                  { label: "R&B", color: "from-amber-500 to-orange-600", q: "rnb songs 2024" },
                  { label: "Bollywood", color: "from-red-500 to-pink-600", q: "bollywood hits 2024" },
                ].map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => setQuery(cat.q)}
                    className={`relative h-16 rounded-2xl overflow-hidden bg-gradient-to-br ${cat.color} flex items-end p-3 text-left shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform`}
                  >
                    <span className="text-sm font-bold text-white drop-shadow">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
