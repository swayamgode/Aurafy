"use client";

import React from "react";
import { usePlayer } from "@/lib/PlayerContext";
import { ArrowDownCircle, Loader2 } from "lucide-react";

/**
 * Global download progress banner.
 * Shows at the top of the screen whenever one or more songs are being downloaded.
 */
export default function DownloadBanner() {
  const { downloadingIds } = usePlayer();

  if (downloadingIds.size === 0) return null;

  const count = downloadingIds.size;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center"
    >
      <div
        className="mt-2 mx-3 max-w-md w-full flex items-center space-x-2.5 bg-[#111111] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10"
        style={{ backdropFilter: "blur(16px)" }}
      >
        <Loader2 className="w-4 h-4 text-[#D7192F] animate-spin shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">
            Downloading {count} song{count > 1 ? "s" : ""}…
          </p>
          <p className="text-[11px] text-white/60">Saving to offline storage</p>
        </div>
        <ArrowDownCircle className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
      </div>
    </div>
  );
}
