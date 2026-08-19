"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, User } from "lucide-react";

export default function BottomNavigation() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Explore", href: "/search", icon: Compass },
    { label: "Favorites", href: "/favorites", icon: Heart },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav aria-label="Bottom Navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E3E4E6] px-4 py-2 flex items-center justify-around shadow-lg max-w-md mx-auto sm:max-w-full">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/" || pathname === "/home"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-col items-center justify-center py-1 px-3 min-w-[64px] min-h-[48px] rounded-xl transition-all cursor-pointer"
          >
            <Icon
              className={`w-6 h-6 transition-colors duration-200 ${
                isActive ? "text-[#D7192F] stroke-[2.5]" : "text-[#5F6368] stroke-[1.8]"
              }`}
            />
            <span
              className={`text-[11px] font-semibold tracking-tight mt-1 transition-colors duration-200 ${
                isActive ? "text-[#D7192F]" : "text-[#5F6368]"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
