"use client";

import React from "react";

interface AudioEqualizerProps {
  isPlaying: boolean;
  barCount?: number;
}

export default function AudioEqualizer({ isPlaying, barCount = 4 }: AudioEqualizerProps) {
  return (
    <div className="flex items-end space-x-0.5 h-4">
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className={`w-0.5 bg-[#D7192F] rounded-full transition-all duration-300 ${
            isPlaying ? "animate-pulse" : "h-1 opacity-50"
          }`}
          style={{
            height: isPlaying ? `${Math.floor(Math.random() * 12) + 4}px` : "4px",
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
    </div>
  );
}
