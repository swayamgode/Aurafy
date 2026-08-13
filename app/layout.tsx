import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/lib/ConvexClientProvider";
import { PlayerProvider } from "@/lib/PlayerContext";
import BottomNavigation from "@/components/BottomNavigation";
import MiniPlayer from "@/components/MiniPlayer";
import NowPlayingModal from "@/components/NowPlayingModal";
import LockScreenPlayer from "@/components/LockScreenPlayer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aurafy — Modern Music Discovery & Streaming",
  description:
    "Discover music, search songs and artists, create playlists, and stream seamlessly with Aurafy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#F8F9FA] text-[#111111] antialiased min-h-screen pb-32">
        <ConvexClientProvider>
          <PlayerProvider>
            {/* Main Application Container */}
            <div className="max-w-md mx-auto min-h-screen bg-[#F8F9FA] shadow-xs relative flex flex-col sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
              <main className="flex-1 pb-16">{children}</main>

              {/* Persistent Global Players & Navigation */}
              <MiniPlayer />
              <BottomNavigation />
              <NowPlayingModal />
              <LockScreenPlayer />
            </div>
          </PlayerProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
