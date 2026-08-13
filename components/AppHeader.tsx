"use client";

import React from "react";
import Link from "next/link";
import { Menu, Search, User } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  showSearch?: boolean;
  showProfile?: boolean;
}

export default function AppHeader({
  title = "Music",
  showSearch = true,
  showProfile = false,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#F8F9FA]/90 backdrop-blur-md transition-colors">
      {/* Menu / Drawer Toggle */}
      <button
        type="button"
        aria-label="Open menu"
        className="w-10 h-10 rounded-full flex items-center justify-center text-black hover:bg-[#E3E4E6] active:scale-95 transition-all cursor-pointer"
      >
        <Menu className="w-6 h-6 stroke-[2]" />
      </button>

      {/* Page Title */}
      <h1 className="text-xl font-bold text-black tracking-tight select-none">
        {title}
      </h1>

      {/* Action Button: Search or Profile */}
      <div>
        {showSearch && (
          <Link
            href="/search"
            aria-label="Search music"
            className="w-10 h-10 rounded-full flex items-center justify-center text-black hover:bg-[#E3E4E6] active:scale-95 transition-all"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </Link>
        )}
        {showProfile && (
          <Link
            href="/profile"
            aria-label="View profile"
            className="w-10 h-10 rounded-full bg-[#E3E4E6] flex items-center justify-center text-black overflow-hidden border border-[#E3E4E6] active:scale-95 transition-all"
          >
            <User className="w-5 h-5 stroke-[2]" />
          </Link>
        )}
        {!showSearch && !showProfile && <div className="w-10 h-10" />}
      </div>
    </header>
  );
}
