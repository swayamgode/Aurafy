"use client";

import React from "react";

interface FilterPillProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}

export default function FilterPill({ label, isActive, onClick, count }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 flex items-center space-x-1.5 ${
        isActive
          ? "bg-black text-white shadow-xs"
          : "bg-[#F1F2F3] text-[#111111] hover:bg-[#E3E4E6]"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            isActive ? "bg-white/20 text-white" : "bg-black/10 text-[#5F6368]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
