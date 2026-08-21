"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles, Share, PlusSquare } from "lucide-react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA offline shell & background caching
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA Service Worker] Registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA Service Worker] Registration failed:", err);
          });
      });
    }

    // 2. Check if already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 4. Handle Chrome/Android PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If iOS and not dismissed before, show banner after 3 seconds
    if (isIosDevice) {
      const dismissed = localStorage.getItem("aurafy_pwa_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setShowBanner(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem("aurafy_pwa_dismissed", "true");
    } catch {}
  };

  if (!showBanner) return null;

  return (
    <>
      {/* PWA Floating Bottom Banner */}
      <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto bg-[#111111] text-white p-4 rounded-3xl shadow-2xl border border-white/10 flex items-center justify-between animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center space-x-3 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-2xl bg-[#D7192F] text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1">
              <h4 className="text-xs font-extrabold text-white truncate">Install Aurafy App</h4>
              <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
            </div>
            <p className="text-[11px] text-white/70 truncate mt-0.5">
              1-tap home screen access & background lock screen music
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 rounded-xl bg-[#D7192F] hover:bg-red-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition-transform flex items-center space-x-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Sheet */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white text-black w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-black">Install Aurafy on iPhone</h3>
              <button
                onClick={() => setShowIosGuide(false)}
                aria-label="Close guide"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5F6368] font-medium leading-relaxed">
              To install Aurafy on your iOS home screen for native full-screen music playback:
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#F8F9FA] border border-[#E3E4E6]">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-black block">Step 1</span>
                  <span className="text-[#5F6368]">Tap the Share icon in Safari bottom bar</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#F8F9FA] border border-[#E3E4E6]">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D7192F] flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-black block">Step 2</span>
                  <span className="text-[#5F6368]">Scroll down and tap "Add to Home Screen"</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosGuide(false);
                setShowBanner(false);
              }}
              className="w-full py-3 rounded-2xl bg-black text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
