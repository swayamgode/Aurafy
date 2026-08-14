"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Track, RepeatMode } from "@/types/music";
import { FOR_YOU_SONGS } from "./youtube";

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Track[];
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isNowPlayingOpen: boolean;
  isLockScreenOpen: boolean;
  isQueueOpen: boolean;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
  toggleLockScreen: () => void;
  toggleQueueModal: () => void;
  // YouTube player bridge
  setYouTubePlayer: (player: any) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(FOR_YOU_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(FOR_YOU_SONGS[0].duration || 240);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>(FOR_YOU_SONGS);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [isLockScreenOpen, setIsLockScreenOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ytPlayerRef = useRef<any>(null); // YouTube IFrame player instance
  const isPlayingRef = useRef<boolean>(false); // Stable ref for visibilitychange closure


  // Media Session API integration for OS/hardware controls & lock screen background playback
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator) || !currentTrack) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || "Aurafy",
        artwork: [
          { src: currentTrack.thumbnailUrl, sizes: "512x512", type: "image/jpeg" },
        ],
      });

      // Keep OS playback state in sync
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

      // Bridge to real audio engine so OS / lock screen hardware controls work
      navigator.mediaSession.setActionHandler("play", () => {
        setIsPlaying(true);
        try { window._aurafyResume?.(); } catch (e) {}
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        setIsPlaying(false);
        try { window._aurafyPause?.(); } catch (e) {}
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
      navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());

      // Lock screen scrubber seeking
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          seekTo(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const offset = details.seekOffset || 10;
        seekTo(Math.min(progress + offset, duration));
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const offset = details.seekOffset || 10;
        seekTo(Math.max(progress - offset, 0));
      });
    } catch (e) {
      // Fallback
    }
  }, [currentTrack, isPlaying, duration, progress]);

  // Sync position state on mobile lock screen
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "mediaSession" in navigator &&
      "setPositionState" in navigator.mediaSession &&
      duration > 0
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(duration, 1),
          playbackRate: isPlaying ? 1 : 0,
          position: Math.min(Math.max(progress, 0), duration),
        });
      } catch (e) {}
    }
  }, [progress, duration, isPlaying]);

  // Visibility change — maintain continuous audio on unlock
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => {
          try {
            if (isPlayingRef.current) {
              window._aurafyResume?.();
              if ("mediaSession" in navigator) {
                navigator.mediaSession.playbackState = "playing";
              }
            }
          } catch (e) {}
        }, 150);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);


  // Playback timer simulation for seamless demo & API player fallback
  useEffect(() => {
    // Keep ref in sync for visibilitychange closure
    isPlayingRef.current = isPlaying;

    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= duration) {
            nextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, duration]);


  const playTrack = (track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    setDuration(track.duration || 210);

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    } else if (!queue.some((q) => q.youtubeId === track.youtubeId)) {
      setQueue((prev) => [track, ...prev]);
    }
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const nextTrack = () => {
    if (queue.length === 0 || !currentTrack) return;

    if (repeatMode === "one") {
      setProgress(0);
      setIsPlaying(true);
      return;
    }

    const currentIndex = queue.findIndex((t) => t.youtubeId === currentTrack.youtubeId);
    let nextIndex = currentIndex + 1;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === "all") {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    const nextTr = queue[nextIndex];
    if (nextTr) {
      setCurrentTrack(nextTr);
      setProgress(0);
      setDuration(nextTr.duration || 210);
      setIsPlaying(true);
    }
  };

  const prevTrack = () => {
    if (queue.length === 0 || !currentTrack) return;
    if (progress > 5) {
      setProgress(0);
      return;
    }

    const currentIndex = queue.findIndex((t) => t.youtubeId === currentTrack.youtubeId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    const prevTr = queue[prevIndex];
    if (prevTr) {
      setCurrentTrack(prevTr);
      setProgress(0);
      setDuration(prevTr.duration || 210);
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds: number) => {
    setProgress(seconds);
    try {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        ytPlayerRef.current.seekTo(seconds, true);
      }
      if (window._aurafyAudioRef && !isNaN(seconds)) {
        window._aurafyAudioRef.currentTime = seconds;
      }
    } catch (e) {}
  };

  const setYouTubePlayer = (player: any) => {
    ytPlayerRef.current = player;
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
    } else {
      setQueue([]);
    }
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  };

  const openNowPlaying = () => setIsNowPlayingOpen(true);
  const closeNowPlaying = () => setIsNowPlayingOpen(false);
  const toggleLockScreen = () => setIsLockScreenOpen((prev) => !prev);
  const toggleQueueModal = () => setIsQueueOpen((prev) => !prev);


  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        isMuted,
        queue,
        repeatMode,
        isShuffle,
        isNowPlayingOpen,
        isLockScreenOpen,
        isQueueOpen,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleMute,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleShuffle,
        toggleRepeat,
        openNowPlaying,
        closeNowPlaying,
        toggleLockScreen,
        toggleQueueModal,
        setYouTubePlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
