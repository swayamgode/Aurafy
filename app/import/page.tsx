"use client";

import React, { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { HardDrive, RefreshCw, CheckCircle2, ChevronRight, FileAudio } from "lucide-react";

export default function ImportPage() {
  const [selectedSource, setSelectedSource] = useState<"device" | "online">("device");
  const [isScanning, setIsScanning] = useState(true);
  const [progress, setProgress] = useState(60);

  return (
    <div className="min-h-screen">
      <AppHeader title="Import Music" showSearch={true} showProfile={true} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* Banner */}
        <div className="bg-[#2D2D2D] text-white p-6 rounded-3xl shadow-lg border border-white/10">
          <h2 className="text-xl font-extrabold tracking-tight">
            Expand Your Library
          </h2>
          <p className="text-xs text-[#8A8D91] mt-1 font-medium">
            Scan your local storage files or synchronize external playlists seamlessly.
          </p>
        </div>

        {/* Source Selection Section */}
        <section aria-label="Import Sources" className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#5F6368]">
            Select Source
          </h3>

          {/* Import from Device Card */}
          <div
            onClick={() => setSelectedSource("device")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedSource === "device"
                ? "bg-white border-2 border-[#D7192F] shadow-sm"
                : "bg-white border-[#E3E4E6] hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-full bg-red-50 text-[#D7192F] flex items-center justify-center shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-black">Import from Device</h4>
                <p className="text-xs text-[#5F6368]">Local storage & SD card audio</p>
              </div>
            </div>
            {selectedSource === "device" ? (
              <CheckCircle2 className="w-5 h-5 text-[#D7192F]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#8A8D91]" />
            )}
          </div>

          {/* Sync Online Library Card */}
          <div
            onClick={() => setSelectedSource("online")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedSource === "online"
                ? "bg-white border-2 border-[#D7192F] shadow-sm"
                : "bg-white border-[#E3E4E6] hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-full bg-[#2D2D2D] text-white flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-black">Sync Online Library</h4>
                <p className="text-xs text-[#5F6368]">Connect Spotify or Apple Music</p>
              </div>
            </div>
            {selectedSource === "online" ? (
              <CheckCircle2 className="w-5 h-5 text-[#D7192F]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#8A8D91]" />
            )}
          </div>
        </section>

        {/* Scanning Media Progress Container */}
        <section className="bg-white p-6 rounded-3xl border border-[#E3E4E6] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileAudio className="w-5 h-5 text-[#D7192F]" />
              <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">
                Scanning Media
              </h3>
            </div>
            <span className="text-xl font-extrabold text-[#D7192F]">{progress}%</span>
          </div>

          <p className="text-xs text-[#5F6368] font-medium">Finding audio tracks in device folders...</p>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-[#F1F2F3] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D7192F] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-black pt-1">
            <span>1,248 files found</span>
            <span className="text-[#8A8D91]">FLAC, MP3, WAV</span>
          </div>
        </section>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setProgress(100)}
          className="w-full py-3.5 rounded-full bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-[#D7192F] active:scale-98 transition-all cursor-pointer"
        >
          {progress === 100 ? "IMPORT COMPLETED" : "START SYNC PROCESS"}
        </button>
      </div>
    </div>
  );
}
