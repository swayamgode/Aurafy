"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { useToast } from "@/lib/ToastContext";
import { useAuth } from "@/lib/AuthContext";
import {
  Sparkles,
  Heart,
  ListMusic,
  Download,
  KeyRound,
  Check,
  ChevronRight,
  HardDrive,
  Trash2,
  LogOut,
  User,
} from "lucide-react";
import { getOfflineStorageUsage } from "@/lib/offlineStorage";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ count: 0, sizeMB: 0 });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("aurafy_yt_api_key");
      if (stored) {
        setApiKey(stored);
        setIsSaved(true);
      }
    } catch {}

    getOfflineStorageUsage().then((info) => setStorageInfo(info)).catch(() => {});
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      localStorage.removeItem("aurafy_yt_api_key");
      setIsSaved(false);
      setIsEditingKey(false);
      showToast("YouTube API Key removed. Using standard search engine.", "info");
      return;
    }

    try {
      localStorage.setItem("aurafy_yt_api_key", apiKey.trim());
      setIsSaved(true);
      setIsEditingKey(false);
      showToast("YouTube Data API Key saved & activated!", "success");
    } catch {
      showToast("Failed to save key to device storage", "info");
    }
  };

  const handleClearKey = () => {
    setApiKey("");
    localStorage.removeItem("aurafy_yt_api_key");
    setIsSaved(false);
    setIsEditingKey(false);
    showToast("YouTube API key cleared.", "info");
  };

  const handleLogout = () => {
    logout();
    showToast("Logged out successfully.", "info");
  };

  return (
    <div className="min-h-screen pb-32">
      <AppHeader title="Profile & Settings" showSearch={true} showProfile={false} />

      <div className="px-4 sm:px-6 space-y-6 mt-2">
        {/* User Header Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E3E4E6] flex items-center space-x-4 shadow-2xs">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-black shrink-0">
            <Image
              src={
                user?.avatarUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop"
              }
              alt={user?.name || "User Avatar"}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-black truncate">
              {user?.name || "Alex Morgan"}
            </h2>
            <p className="text-xs text-[#5F6368] font-medium truncate">
              {user?.email || "alex.morgan@aurafy.app"}
            </p>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-extrabold uppercase tracking-wider">
              PRO MEMBER
            </span>
          </div>
        </div>

        {/* YouTube API Key Configuration Card */}
        <div className="bg-white p-5 rounded-3xl border border-[#E3E4E6] shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-[#D7192F]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">YouTube Data API Key</h3>
                <p className="text-xs text-[#5F6368]">
                  {isSaved
                    ? "Official YouTube Data API v3 Active"
                    : "Using default high-speed search engine"}
                </p>
              </div>
            </div>

            {isSaved ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <Check className="w-3 h-3 mr-1 text-emerald-600" />
                ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-[#5F6368]">
                OPTIONAL
              </span>
            )}
          </div>

          {isEditingKey || !isSaved ? (
            <form onSubmit={handleSaveKey} className="space-y-3 pt-1">
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste YouTube API Key (AIzaSy...)"
                  className="w-full bg-[#F8F9FA] border border-[#E3E4E6] rounded-2xl px-4 py-3 text-xs text-black placeholder:text-[#8A8D91] focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 active:scale-98 transition-transform cursor-pointer"
                >
                  Save API Key
                </button>
                {isSaved && (
                  <button
                    type="button"
                    onClick={() => setIsEditingKey(false)}
                    className="py-2.5 px-4 bg-[#F1F2F3] text-black text-xs font-semibold rounded-xl hover:bg-[#E3E4E6] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                {isSaved && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    aria-label="Remove API Key"
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between pt-1 border-t border-[#F1F2F3]">
              <p className="text-xs font-mono text-[#5F6368]">
                ••••••••••••••••{apiKey.slice(-4)}
              </p>
              <button
                type="button"
                onClick={() => setIsEditingKey(true)}
                className="text-xs font-bold text-[#D7192F] hover:underline cursor-pointer"
              >
                Change Key
              </button>
            </div>
          )}

          <p className="text-[11px] text-[#8A8D91] leading-relaxed">
            You can enter your personal Google Cloud YouTube Data API v3 key above or set{" "}
            <code className="text-black font-semibold">YOUTUBE_API_KEY</code> in{" "}
            <code className="text-black font-semibold">.env.local</code>.
          </p>
        </div>

        {/* Offline Storage Status Card */}
        <div className="bg-white p-5 rounded-3xl border border-[#E3E4E6] shadow-2xs flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-black">Phone Offline Vault</h3>
              <p className="text-xs text-[#5F6368]">
                {storageInfo.count} songs saved • {storageInfo.sizeMB} MB storage
              </p>
            </div>
          </div>
          <Link
            href="/favorites"
            className="text-xs font-bold text-[#D7192F] hover:underline flex items-center space-x-0.5"
          >
            <span>View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
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

        {/* Log Out Section */}
        <div className="bg-white rounded-3xl border border-[#E3E4E6] overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 text-red-600 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center space-x-3 font-semibold text-sm">
              <LogOut className="w-5 h-5" />
              <span>Log Out of Hue</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
