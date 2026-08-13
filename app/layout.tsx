import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/lib/ConvexClientProvider";
import { PlayerProvider } from "@/lib/PlayerContext";
import BottomNavigation from "@/components/BottomNavigation";
import MiniPlayer from "@/components/MiniPlayer";
import NowPlayingModal from "@/components/NowPlayingModal";
import LockScreenPlayer from "@/components/LockScreenPlayer";
import YouTubeAudioPlayer from "@/components/YouTubeAudioPlayer";
import { ToastProvider } from "@/lib/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aurafy — Modern Music Discovery & Streaming",
  description:
    "Discover music, search songs and artists, create playlists, and stream seamlessly with Aurafy.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aurafy",
    startupImage: "/icons/icon-512x512.png",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#D7192F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Aurafy" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Aurafy" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#D7192F" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="bg-[#F8F9FA] text-[#111111] antialiased min-h-screen pb-32">
        <ConvexClientProvider>
          <ToastProvider>
            <PlayerProvider>
              {/* Main Application Container */}
              <div className="max-w-md mx-auto min-h-screen bg-[#F8F9FA] shadow-xs relative flex flex-col sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
                <main className="flex-1 pb-16">{children}</main>

                {/* Persistent Global Players & Navigation */}
                <MiniPlayer />
                <BottomNavigation />
                <NowPlayingModal />
                <LockScreenPlayer />
                <YouTubeAudioPlayer />
              </div>
            </PlayerProvider>
          </ToastProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
