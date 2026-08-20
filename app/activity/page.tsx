"use client";

import React, { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import StatsCard from "@/components/StatsCard";
import FilterPill from "@/components/FilterPill";
import SongCard from "@/components/SongCard";
import { Headphones, TrendingUp, Clock, Disc, Sparkles } from "lucide-react";
import { getAllOfflineTracks } from "@/lib/offlineStorage";
import { Track } from "@/types/music";

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);

  useEffect(() => {
    getAllOfflineTracks().then((tracks) => {
      if (tracks.length > 0) {
        setRecentTracks(tracks);
      } else {
        try {
          const stored = localStorage.getItem("aurafy_listen_later");
          if (stored) setRecentTracks(JSON.parse(stored));
        } catch {}
      }
    });
  }, []);

  const topGenres = [
    { name: "Lo-Fi Jazz", percentage: 42, tracks: "428 Tracks" },
    { name: "Indie Rock", percentage: 24, tracks: "215 Tracks" },
    { name: "Synth Wave", percentage: 18, tracks: "160 Tracks" },
    { name: "Neo Soul", percentage: 10, tracks: "95 Tracks" },
    { name: "Ambient", percentage: 6, tracks: "48 Tracks" },
  ];

  return (
    <div className="min-h-screen">
      <AppHeader title="Listening Activity" showSearch={true} showProfile={true} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* Intro Tagline */}
        <div>
          <p className="text-xs text-[#5F6368] font-medium">
            Your personalized sonic journey over the last 30 days.
          </p>
        </div>

        {/* Most Played Genre Banner Card */}
        <StatsCard
          icon={Disc}
          label="MOST PLAYED GENRE"
          value="Lo-Fi Jazz"
          subtext="428 TRACKS STREAMED"
          variant="highlight"
        />

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-[#E3E4E6] pb-3">
          {["Overview", "History", "Stats"].map((tab) => (
            <FilterPill
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>

        {/* Overview Tab Content */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            {/* Playback Statistics Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatsCard
                icon={Headphones}
                value="12.5h"
                label="AVG. DAILY"
                subtext="Highest on Fridays"
              />
              <StatsCard
                icon={TrendingUp}
                value="+12%"
                label="VS LAST WEEK"
                subtext="Consistent listener"
              />
              <StatsCard
                icon={Clock}
                value="376h"
                label="TOTAL TIME"
                subtext="30 days activity"
              />
            </div>

            {/* Top Genres Breakdown List */}
            <section aria-label="Top Genres" className="bg-white p-5 rounded-3xl border border-[#E3E4E6] space-y-4">
              <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
                Top Genres
              </h3>

              <div className="space-y-3">
                {topGenres.map((genre) => (
                  <div key={genre.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-black">{genre.name}</span>
                      <span className="font-semibold text-[#5F6368]">{genre.tracks}</span>
                    </div>
                    <div className="w-full h-2 bg-[#F1F2F3] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-black to-[#D7192F] rounded-full transition-all duration-500"
                        style={{ width: `${genre.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Listening History Section */}
            <section aria-label="Recent Activity" className="space-y-3">
              <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
                Recent Activity History
              </h3>
              {recentTracks.length > 0 ? (
                recentTracks.map((song) => (
                  <SongCard key={song.youtubeId} track={song} variant="compact" />
                ))
              ) : (
                <p className="text-xs text-[#8A8D91] py-4 text-center">
                  No playback activity yet. Play downloaded songs to see stats here!
                </p>
              )}
            </section>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "History" && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#5F6368]">
              Full Played History
            </h3>
            {recentTracks.length > 0 ? (
              recentTracks.map((song, i) => (
                <SongCard key={`${song.youtubeId}-${i}`} track={song} />
              ))
            ) : (
              <p className="text-xs text-[#8A8D91] py-8 text-center">No listening history recorded yet.</p>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "Stats" && (
          <div className="space-y-4">
            <div className="p-6 bg-white rounded-3xl border border-[#E3E4E6] text-center space-y-2">
              <Sparkles className="w-8 h-8 text-[#D7192F] mx-auto" />
              <h3 className="text-lg font-extrabold text-black">Top 1% Superfan</h3>
              <p className="text-xs text-[#5F6368]">
                You streamed more Lo-Fi Beats than 99% of Hue listeners this month!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
