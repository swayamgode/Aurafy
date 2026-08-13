"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Artists, songs, lyrics...",
  onClear,
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5F6368]">
        <Search className="w-5 h-5 stroke-[2]" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full pl-11 pr-10 py-3.5 bg-[#F1F2F3] text-[#111111] placeholder-[#8A8D91] text-sm font-medium rounded-2xl border border-transparent focus:border-black focus:bg-white focus:outline-none transition-all duration-200"
      />
      {value.length > 0 && (
        <button
          onClick={() => {
            onChange("");
            if (onClear) onClear();
          }}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5F6368] hover:text-black transition-colors"
        >
          <X className="w-4 h-4 bg-[#E3E4E6] rounded-full p-0.5" />
        </button>
      )}
    </div>
  );
}
