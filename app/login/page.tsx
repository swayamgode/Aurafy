"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth, DEFAULT_AVATARS } from "@/lib/AuthContext";
import { Sparkles, ArrowRight, Music, Headphones, Radio } from "lucide-react";

export default function LoginPage() {
  const { user, isLoggedIn, isLoading, login } = useAuth();
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATARS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn && user) {
      router.replace("/");
    }
  }, [isLoading, isLoggedIn, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await login({
      name: name.trim(),
      avatarUrl: selectedAvatar,
    });
  };

  const handleQuickStart = async () => {
    setIsSubmitting(true);
    await login({
      name: "Alex Morgan",
      avatarUrl: DEFAULT_AVATARS[0],
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#D7192F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between p-6 sm:p-10 max-w-md mx-auto">
      {/* Brand Header */}
      <div className="pt-8 space-y-3">
        <div className="inline-flex items-center space-x-2 bg-black text-white px-3.5 py-1.5 rounded-full shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#D7192F]" />
          <span className="text-[11px] font-extrabold uppercase tracking-widest">
            WELCOME TO AURAFY
          </span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-black leading-none pt-2">
          Your Sonic <br />
          <span className="text-[#D7192F]">Universe.</span>
        </h1>

        <p className="text-sm text-[#5F6368] font-normal leading-relaxed">
          High-fidelity music streaming, offline phone downloads, and intelligent playlist discovery.
        </p>
      </div>

      {/* Main Login / Profile Setup Card */}
      <div className="my-8 bg-white p-6 rounded-3xl border border-[#E3E4E6] shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8A8D91]">
            STEP 1 • CHOOSE AVATAR
          </span>
          <div className="flex items-center justify-center space-x-3 pt-2">
            {DEFAULT_AVATARS.map((avatar, idx) => {
              const isSelected = selectedAvatar === avatar;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "ring-3 ring-[#D7192F] scale-110 shadow-md"
                      : "opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  <Image
                    src={avatar}
                    alt={`Avatar ${idx + 1}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-black block">
              Your Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan River"
              maxLength={32}
              className="w-full bg-[#F8F9FA] border border-[#E3E4E6] rounded-2xl px-4 py-3.5 text-sm text-black placeholder:text-[#8A8D91] focus:outline-none focus:border-black font-semibold transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full py-4 px-6 bg-black text-white text-sm font-bold rounded-2xl shadow-lg hover:bg-neutral-800 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#F1F2F3] w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-[#8A8D91] uppercase tracking-wider absolute">
            OR
          </span>
        </div>

        <button
          type="button"
          onClick={handleQuickStart}
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-[#F1F2F3] text-black text-xs font-bold rounded-2xl hover:bg-[#E3E4E6] active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Headphones className="w-4 h-4 text-[#D7192F]" />
          <span>1-Tap Quick Start (Guest)</span>
        </button>
      </div>

      {/* Feature Badges Footer */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2 pb-4">
        <div className="p-2.5 rounded-2xl bg-white border border-[#E3E4E6]/80 flex flex-col items-center">
          <Music className="w-4 h-4 text-[#D7192F] mb-1" />
          <span className="text-[10px] font-bold text-black">Unlimited</span>
          <span className="text-[9px] text-[#8A8D91]">Streaming</span>
        </div>

        <div className="p-2.5 rounded-2xl bg-white border border-[#E3E4E6]/80 flex flex-col items-center">
          <Radio className="w-4 h-4 text-[#D7192F] mb-1" />
          <span className="text-[10px] font-bold text-black">Offline Mode</span>
          <span className="text-[9px] text-[#8A8D91]">Download MP3</span>
        </div>

        <div className="p-2.5 rounded-2xl bg-white border border-[#E3E4E6]/80 flex flex-col items-center">
          <Sparkles className="w-4 h-4 text-[#D7192F] mb-1" />
          <span className="text-[10px] font-bold text-black">Hi-Res Audio</span>
          <span className="text-[9px] text-[#8A8D91]">24-Bit / 96kHz</span>
        </div>
      </div>
    </div>
  );
}
