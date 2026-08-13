"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { User, Sparkles, Heart, ListMusic, Download, Settings, LogOut, ChevronRight } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen">
      <AppHeader title="Profile" showSearch={true} showProfile={false} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* User Header Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E3E4E6] flex items-center space-x-4 shadow-2xs">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-black shrink-0">
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop"
              alt="User Avatar"
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-black truncate">
              Alex Morgan
            </h2>
            <p className="text-xs text-[#5F6368] font-medium truncate">
              alex.morgan@aurafy.app
            </p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-extrabold uppercase tracking-wider">
              PRO MEMBER
            </span>
          </div>
        </div>

        {/* Quick Menu Options */}
        <div className="bg-white rounded-3xl border border-[#E3E4E6] overflow-hidden divide-y divide-[#E3E4E6] shadow-2xs">
          <Link
            href="/activity"
            className="flex items-center justify-between p-4 hover:bg-[#F8F9FA] transition-colors"
          >
            <div className="flex items-center space-x-3 text-black font-semibold text-sm">
              <Sparkles className="w-5 h-5 text-[#D7192F]" />
              <span>Listening Activity Stats</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8A8D91]" />
          </Link>

          <Link
            href="/favorites"
            className="flex items-center justify-between p-4 hover:bg-[#F8F9FA] transition-colors"
          >
            <div className="flex items-center space-x-3 text-black font-semibold text-sm">
              <Heart className="w-5 h-5 text-[#D7192F]" />
              <span>Favorite Songs</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8A8D91]" />
          </Link>

          <Link
            href="/playlist/create"
            className="flex items-center justify-between p-4 hover:bg-[#F8F9FA] transition-colors"
          >
            <div className="flex items-center space-x-3 text-black font-semibold text-sm">
              <ListMusic className="w-5 h-5 text-black" />
              <span>Create Playlist</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8A8D91]" />
          </Link>

          <Link
            href="/import"
            className="flex items-center justify-between p-4 hover:bg-[#F8F9FA] transition-colors"
          >
            <div className="flex items-center space-x-3 text-black font-semibold text-sm">
              <Download className="w-5 h-5 text-black" />
              <span>Import & Sync Music</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8A8D91]" />
          </Link>
        </div>

        {/* Settings & Logout */}
        <div className="bg-white rounded-3xl border border-[#E3E4E6] overflow-hidden divide-y divide-[#E3E4E6] shadow-2xs">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 hover:bg-[#F8F9FA] transition-colors text-left"
          >
            <div className="flex items-center space-x-3 text-black font-semibold text-sm">
              <Settings className="w-5 h-5 text-[#5F6368]" />
              <span>App Preferences</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8A8D91]" />
          </button>

          <button
            type="button"
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-left text-red-600"
          >
            <div className="flex items-center space-x-3 font-semibold text-sm">
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
