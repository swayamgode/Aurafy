"use client";

import React, { useState, useEffect, useRef } from "react";
import AppHeader from "@/components/AppHeader";
import {
  Search,
  Download,
  CheckCircle2,
  HardDrive,
  Loader2,
  Music2,
  Play,
  Sparkles,
  Link2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import { usePlayer } from "@/lib/PlayerContext";
import { useToast } from "@/lib/ToastContext";
import { Track } from "@/types/music";
import { searchYouTube, FOR_YOU_SONGS } from "@/lib/youtube";

/**
 * Extracts YouTube Video ID from any URL format
 */
function extractYouTubeId(urlStr: string): string | null {
  const trimmed = urlStr.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("?")[0] || null;
    }
  } catch {}

  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export default function ImportPage() {
  const { downloadTrack, playTrack, isDownloaded, downloadingIds } = usePlayer();
  const { showToast } = useToast();

  // Search & Convert state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // URL converter state (advanced)
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);

  // Local device file import
  const [importedLocalFiles, setImportedLocalFiles] = useState<Track[]>([]);

  // Load default featured songs for quick 1-tap converter on mount
  useEffect(() => {
    setSearchResults(FOR_YOU_SONGS);
  }, []);

  // Handle live search input
  useEffect(() => {
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
        setSearchResults(res.songs && res.songs.length > 0 ? res.songs : FOR_YOU_SONGS);
      } catch {
        setSearchResults(FOR_YOU_SONGS);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Handle 1-tap direct song download & convert
  const handleDirectDownload = async (track: Track) => {
    if (downloadingIds.has(track.youtubeId)) return;

    if (isDownloaded(track.youtubeId)) {
      showToast(`"${track.title}" is already in your downloads!`, "info");
      return;
    }

    showToast(`Converting & downloading "${track.title}" to device...`, "info");
    const success = await downloadTrack(track, true);

    if (success) {
      showToast(`✅ "${track.title}" converted & saved to phone storage!`, "success");
    } else {
      showToast(`❌ Download failed. Please try again.`, "info");
    }
  };

  // Handle URL Convert (legacy/advanced fallback)
  const handleUrlConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractYouTubeId(ytUrl);

    if (!videoId) {
      showToast("Please enter a valid YouTube or YouTube Music link", "info");
      return;
    }

    setIsUrlProcessing(true);
    showToast("Extracting media stream & converting audio...", "info");

    try {
      let trackInfo: Track = {
        youtubeId: videoId,
        title: "Converted Track",
        artist: "YouTube Music",
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: 210,
      };

      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(videoId)}`);
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.songs && data.songs.length > 0) {
          trackInfo = data.songs[0];
        }
      }

      const success = await downloadTrack(trackInfo, true);
      if (success) {
        showToast(`✅ "${trackInfo.title}" converted & saved to phone!`, "success");
        setYtUrl("");
      } else {
        showToast("Conversion error. Please check the link.", "info");
      }
    } catch (err: any) {
      console.error("[YouTube Import Error]:", err);
      showToast("Conversion failed. Try searching by song name directly.", "info");
    } finally {
      setIsUrlProcessing(false);
    }
  };

  // Handle local device audio files upload (.mp3, .wav, .m4a)
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: Track[] = Array.from(files).map((file, i) => {
      const blobUrl = URL.createObjectURL(file);
      const nameParts = file.name.replace(/\.[^/.]+$/, "").split(" - ");
      const artist = nameParts.length > 1 ? nameParts[0] : "Local Storage";
      const title = nameParts.length > 1 ? nameParts.slice(1).join(" - ") : nameParts[0];

      return {
        youtubeId: `local-${Date.now()}-${i}`,
        title,
        artist,
        thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
        duration: 180,
        audioUrl: blobUrl,
      };
    });

    setImportedLocalFiles((prev) => [...newTracks, ...prev]);
    showToast(`Added ${newTracks.length} song(s) from device storage!`, "success");
  };

  return (
    <div className="min-h-screen pb-32">
      <AppHeader title="Music Converter & Downloader" showSearch={true} showProfile={true} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#111111] via-[#2D2D2D] to-red-950 text-white p-6 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center space-x-2 text-red-400">
              <Download className="w-5 h-5 text-[#D7192F]" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/80">
                Direct Song Downloader
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Search & Convert Any Song
            </h2>
            <p className="text-xs text-white/70 font-medium">
              Type any song or artist name to instantly convert & download high-quality MP3s directly to your phone.
            </p>
          </div>
          <Sparkles className="absolute right-4 bottom-4 w-24 h-24 text-white/5 pointer-events-none" />
        </div>

        {/* ── Direct Song Search & Converter ── */}
        <section aria-label="Song Search Downloader" className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E3E4E6] shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-[#D7192F] flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-black">Instant Song Converter</h3>
              <p className="text-xs text-[#5F6368]">Search by song title, artist, or album</p>
            </div>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A8D91] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search song title or artist (e.g. Adele, Blinding Lights)..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E3E4E6] text-xs font-semibold text-black placeholder:text-[#8A8D91] focus:outline-none focus:border-[#D7192F] focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8A8D91] hover:text-black"
              >
                Clear
              </button>
            )}
          </div>

          {/* Song Results List */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#5F6368] uppercase tracking-wider">
                {searchQuery.trim() ? "Search Results" : "Featured & Trending Songs"}
              </h4>
              {isSearching && (
                <div className="flex items-center space-x-1.5 text-xs text-[#D7192F] font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {searchResults.map((track, i) => {
                const downloaded = isDownloaded(track.youtubeId);
                const downloading = downloadingIds.has(track.youtubeId);

                return (
                  <div
                    key={`${track.youtubeId}-${i}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FA] hover:bg-gray-100/80 border border-[#E3E4E6] transition-all"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 pr-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-200 shadow-2xs">
                        <Image
                          src={track.thumbnailUrl}
                          alt={track.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-black truncate">{track.title}</h5>
                        <p className="text-[11px] text-[#5F6368] truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => playTrack(track)}
                        aria-label="Play track"
                        className="w-9 h-9 rounded-full bg-white border border-gray-200 text-black flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>

                      <button
                        onClick={() => handleDirectDownload(track)}
                        disabled={downloading}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs ${
                          downloaded
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-[#D7192F] hover:bg-red-700 text-white active:scale-95"
                        }`}
                      >
                        {downloading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Converting...</span>
                          </>
                        ) : downloaded ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download MP3</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Optional YouTube URL Downloader Accordion ── */}
        <section aria-label="URL Converter" className="bg-white rounded-3xl border border-[#E3E4E6] shadow-sm overflow-hidden">
          <button
            onClick={() => setShowUrlForm((prev) => !prev)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-[#F8F9FA] transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-neutral-100 text-black flex items-center justify-center shrink-0">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Paste YouTube URL (Optional)</h3>
                <p className="text-xs text-[#5F6368]">Download directly from YouTube or Shorts link</p>
              </div>
            </div>
            {showUrlForm ? (
              <ChevronUp className="w-5 h-5 text-[#8A8D91]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#8A8D91]" />
            )}
          </button>

          {showUrlForm && (
            <div className="p-5 pt-0 border-t border-[#F1F2F3] space-y-4 mt-2">
              <form onSubmit={handleUrlConvert} className="space-y-3 pt-3">
                <div className="relative">
                  <input
                    type="url"
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                    className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E3E4E6] text-xs font-semibold text-black placeholder:text-[#8A8D91] focus:outline-none focus:border-[#D7192F] transition-all"
                  />
                  {ytUrl && (
                    <button
                      type="button"
                      onClick={() => setYtUrl("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8D91] hover:text-black"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isUrlProcessing || !ytUrl.trim()}
                  className="w-full py-3.5 rounded-2xl bg-[#D7192F] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isUrlProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Converting & Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-white" />
                      <span>Convert Link to MP3</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* ── Device File Storage Scanner ── */}
        <section aria-label="Device Music Scanner" className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E3E4E6] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Device File Storage</h3>
                <p className="text-xs text-[#5F6368]">Select MP3, WAV, or M4A audio files from phone</p>
              </div>
            </div>
          </div>

          <label className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#E3E4E6] hover:border-[#D7192F] bg-[#F8F9FA] hover:bg-red-50/50 flex items-center justify-center space-x-2 cursor-pointer transition-all">
            <Music2 className="w-4 h-4 text-[#D7192F]" />
            <span className="text-xs font-bold text-black">Choose Files from Phone...</span>
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleLocalFileUpload}
              className="hidden"
            />
          </label>

          {/* Imported Local Files List */}
          {importedLocalFiles.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-extrabold text-[#5F6368] uppercase tracking-wider">
                Device Files ({importedLocalFiles.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {importedLocalFiles.map((track, i) => (
                  <div
                    key={`${track.youtubeId}-${i}`}
                    onClick={() => playTrack(track)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F9FA] hover:bg-gray-100 transition-colors cursor-pointer border border-[#E3E4E6]"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-xl bg-red-100 text-[#D7192F] flex items-center justify-center shrink-0">
                        <Music2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-black truncate">{track.title}</h5>
                        <p className="text-[11px] text-[#5F6368] truncate">{track.artist}</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-white text-black border border-gray-200 flex items-center justify-center shrink-0">
                      <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

