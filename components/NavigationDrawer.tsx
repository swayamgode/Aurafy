"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Home,
  Compass,
  Heart,
  User,
  PlusCircle,
  Sparkles,
  Download,
  Lock,
  Flame,
  ChevronRight,
} from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const { toggleLockScreen } = usePlayer();

  if (!isOpen) return null;

  const menuItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Explore & Search", href: "/search", icon: Compass },
    { label: "Favourites", href: "/favorites", icon: Heart },
    { label: "Profile", href: "/profile", icon: User },
    { label: "Create Playlist", href: "/playlist/create", icon: PlusCircle },
    { label: "Listening Activity", href: "/activity", icon: Sparkles },
    { label: "Import & Sync", href: "/import", icon: Download },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <aside className="relative w-80 max-w-[85vw] bg-[#F8F9FA] h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-in slide-in-from-left duration-300 border-r border-[#E3E4E6]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#E3E4E6]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#D7192F] text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                A
              </div>
              <span className="text-xl font-extrabold text-black tracking-tight">
                Aurafy
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Navigation Menu"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#5F6368] hover:bg-[#E3E4E6] active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          {/* User Preview */}
          <div className="my-6 p-3 bg-white rounded-2xl border border-[#E3E4E6] flex items-center space-x-3 shadow-2xs">
            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-black/20 bg-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
                alt="Alex Morgan"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-black truncate">Alex Morgan</h4>
              <span className="text-[10px] font-extrabold uppercase text-[#D7192F]">
                PRO MEMBER
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Sidebar Menu" className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-black hover:bg-[#E3E4E6] font-semibold text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-[#5F6368]" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8A8D91]" />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E3E4E6] space-y-3">
          <button
            onClick={() => {
              onClose();
              toggleLockScreen();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-[#2D2D2D] text-white text-xs font-bold flex items-center justify-between hover:bg-black transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-[#D7192F]" />
              <span>Lock Screen Mode</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#8A8D91]" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-semibold text-[#8A8D91]">
              Aurafy v1.2.0 • Premium Audio
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
