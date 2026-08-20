"use client";

import React, { useState } from "react";
import AppHeader from "@/components/AppHeader";
import {
  Link2,
  Download,
  CheckCircle2,
  HardDrive,
  Loader2,
  Music2,
  Play,
  ArrowDownCircle,
  Sparkles,
  Video,
} from "lucide-react";
import Image from "next/image";
import { usePlayer } from "@/lib/PlayerContext";
import { useToast } from "@/lib/ToastContext";
import { Track } from "@/types/music";

/**
 * Extracts YouTube Video ID from any URL format
 */
function extractYouTubeId(urlStr: string): string | null {
  const trimmed = urlStr.trim();
  if (!trimmed) return null;

  // Direct 11-char ID
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

  // Fallback regex match
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export default function ImportPage() {
  const { downloadTrack, playTrack } = usePlayer();
  const { showToast } = useToast();

  const [ytUrl, setYtUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadedTrack, setDownloadedTrack] = useState<Track | null>(null);

  // Local device file import
  const [importedLocalFiles, setImportedLocalFiles] = useState<Track[]>([]);

  // Handle YouTube URL → Extract Audio Stream → Download MP3
  const handleUrlConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractYouTubeId(ytUrl);

    if (!videoId) {
      showToast("Please enter a valid YouTube or YouTube Music link", "info");
      return;
    }

    setIsProcessing(true);
    setDownloadedTrack(null);
    showToast("Extracting media stream & converting audio...", "info");

    try {
      // 1. Fetch metadata via search API
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(videoId)}`);
      let trackInfo: Track = {
        youtubeId: videoId,
        title: "YouTube Music Track",
        artist: "YouTube",
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: 210,
      };

      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.songs && data.songs.length > 0) {
          trackInfo = data.songs[0];
        }
      }

      // 2. Download audio payload from download route
      const downloadRes = await fetch(
        `/api/download?id=${encodeURIComponent(videoId)}&title=${encodeURIComponent(
          trackInfo.title
        )}&artist=${encodeURIComponent(trackInfo.artist)}`
      );

      if (!downloadRes.ok) throw new Error("Audio stream extraction failed");

      const audioBlob = await downloadRes.blob();

      // 3. Save to Hue IndexedDB for in-app offline playback
      await downloadTrack(trackInfo);

      // 4. Trigger direct file download to user's device storage (.mp3)
      const blobUrl = URL.createObjectURL(audioBlob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `${trackInfo.artist} - ${trackInfo.title}.mp3`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      setDownloadedTrack({
        ...trackInfo,
        audioUrl: blobUrl,
      });

      showToast(`✅ "${trackInfo.title}" converted & saved to device!`, "success");
      setYtUrl("");
    } catch (err: any) {
      console.error("[YouTube Import Error]:", err);
      showToast("Conversion error. Please check the URL and try again.", "info");
    } finally {
      setIsProcessing(false);
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
      <AppHeader title="Import & Downloader" showSearch={true} showProfile={true} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#111111] via-[#2D2D2D] to-red-950 text-white p-6 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center space-x-2 text-red-400">
              <Video className="w-5 h-5 text-[#D7192F]" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/80">
                YouTube Audio Downloader
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Convert & Download Music
            </h2>
            <p className="text-xs text-white/70 font-medium">
              Paste any YouTube URL to extract high-quality MP3 audio directly to your phone.
            </p>
          </div>
          <Sparkles className="absolute right-4 bottom-4 w-24 h-24 text-white/5 pointer-events-none" />
        </div>

        {/* ── YouTube URL Downloader Form ── */}
        <section aria-label="YouTube Downloader" className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E3E4E6] shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-[#D7192F] flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-black">Paste YouTube URL</h3>
              <p className="text-xs text-[#5F6368]">Supports youtube.com, youtu.be, and Shorts</p>
            </div>
          </div>

          <form onSubmit={handleUrlConvert} className="space-y-3">
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
              disabled={isProcessing || !ytUrl.trim()}
              className="w-full py-3.5 rounded-2xl bg-[#D7192F] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Converting & Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>Download MP3 to Phone</span>
                </>
              )}
            </button>
          </form>

          {/* Download Result Card */}
          {downloadedTrack && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-200">
                  <Image
                    src={downloadedTrack.thumbnailUrl}
                    alt={downloadedTrack.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h4 className="text-xs font-bold text-emerald-950 truncate">
                      {downloadedTrack.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-emerald-700 truncate mt-0.5">
                    Saved to Phone & Hue Offline Vault
                  </p>
                </div>
              </div>

              <button
                onClick={() => playTrack(downloadedTrack)}
                className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md active:scale-90 hover:scale-105 transition-transform"
              >
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </button>
            </div>
          )}
        </section>

        {/* ── Import Local Files from Phone Storage ── */}
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
