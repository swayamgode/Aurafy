"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  subtext?: string;
  variant?: "default" | "highlight";
}

export default function StatsCard({
  icon: Icon,
  value,
  label,
  subtext,
  variant = "default",
}: StatsCardProps) {
  if (variant === "highlight") {
    return (
      <div className="bg-[#2D2D2D] text-white p-6 rounded-3xl relative overflow-hidden shadow-lg border border-white/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D7192F]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center space-x-2 text-[#D7192F] mb-3">
          <Icon className="w-5 h-5" />
          <span className="text-xs font-bold tracking-wider uppercase text-white/70">
            {label}
          </span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {value}
        </h3>
        {subtext && (
          <p className="text-xs text-[#8A8D91] mt-2 font-medium">
            {subtext}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl border border-[#E3E4E6] flex flex-col justify-between shadow-2xs hover:border-gray-300 transition-colors">
      <div className="w-8 h-8 rounded-full bg-[#F1F2F3] flex items-center justify-center text-black mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
          {value}
        </h3>
        <p className="text-[11px] font-semibold text-[#5F6368] uppercase tracking-wider mt-0.5">
          {label}
        </p>
        {subtext && (
          <span className="text-[10px] text-[#D7192F] font-bold mt-1 block">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
