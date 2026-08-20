"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Track, RepeatMode } from "@/types/music";
import {
  saveTrackOffline,
  removeOfflineTrack,
  getAllOfflineTracks,
  getOfflineTrack,
} from "./offlineStorage";

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
  isOfflineMode: boolean;
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;

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
  downloadTrack: (track: Track) => Promise<boolean>;
  removeDownload: (youtubeId: string) => Promise<boolean>;
  isDownloaded: (youtubeId: string) => boolean;
  // YouTube / Offline player bridge
  setYouTubePlayer: (player: any) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [isLockScreenOpen, setIsLockScreenOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ytPlayerRef = useRef<any>(null); // YouTube IFrame player instance
  const isPlayingRef = useRef<boolean>(false);

  // Load existing offline downloads on mount
  useEffect(() => {
    getAllOfflineTracks()
      .then((tracks) => {
        setDownloadedIds(new Set(tracks.map((t) => t.youtubeId)));
      })
      .catch(() => {});

    // Monitor online/offline network status
    const updateOnlineStatus = () => {
      setIsOfflineMode(!navigator.onLine);
    };
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

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

      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

      navigator.mediaSession.setActionHandler("play", () => {
        setIsPlaying(true);
        try {
          window._aurafyResume?.();
        } catch (e) {}
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        setIsPlaying(false);
        try {
          window._aurafyPause?.();
        } catch (e) {}
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
      navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());

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
  }, [currentTrack, isPlaying, duration, progress]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [isPlaying, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    // Check if song has local offline blob cached
    let resolvedTrack = track;
    try {
      const offline = await getOfflineTrack(track.youtubeId);
      if (offline && offline.objectUrl) {
        resolvedTrack = {
          ...track,
          audioUrl: offline.objectUrl,
        };
      }
    } catch {}

    setCurrentTrack(resolvedTrack);
    setIsPlaying(true);
    setProgress(0);
    setDuration(resolvedTrack.duration || 210);

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
    } else if (!queue.some((q) => q.youtubeId === track.youtubeId)) {
      setQueue((prev) => [track, ...prev]);
    }
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const nextTrack = useCallback(() => {
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
      playTrack(nextTr);
    }
  }, [queue, currentTrack, repeatMode, isShuffle]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevTrack = useCallback(() => {
    if (queue.length === 0 || !currentTrack) return;
    if (progress > 5) {
      setProgress(0);
      return;
    }

    const currentIndex = queue.findIndex((t) => t.youtubeId === currentTrack.youtubeId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    const prevTr = queue[prevIndex];
    if (prevTr) {
      playTrack(prevTr);
    }
  }, [queue, currentTrack, progress]); // eslint-disable-line react-hooks/exhaustive-deps

  const seekTo = (seconds: number) => {
    setProgress(seconds);
    try {
      if (typeof window !== "undefined" && window._aurafySeek) {
        window._aurafySeek(seconds);
      } else if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        ytPlayerRef.current.seekTo(seconds, true);
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

  // Download song to phone & offline storage (IndexedDB)
  const downloadTrack = async (track: Track): Promise<boolean> => {
    const yId = track.youtubeId;
    if (downloadedIds.has(yId) || downloadingIds.has(yId)) return true;

    setDownloadingIds((prev) => new Set(prev).add(yId));

    try {
      // 1. Fetch audio payload from API route
      const res = await fetch(
        `/api/download?id=${encodeURIComponent(yId)}&title=${encodeURIComponent(
          track.title
        )}&artist=${encodeURIComponent(track.artist)}`
      );

      if (!res.ok) throw new Error("Download request failed");

      const audioBlob = await res.blob();

      if (audioBlob.size < 1000) {
        throw new Error("Received empty or corrupted audio data");
      }

      // 2. Save into IndexedDB for in-app offline playback
      await saveTrackOffline(track, audioBlob);

      setDownloadedIds((prev) => new Set(prev).add(yId));
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(yId);
        return next;
      });

      return true;
    } catch (err) {
      console.error("[Download Error]:", err);
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(yId);
        return next;
      });
      return false;
    }
  };

  // Remove download from offline storage
  const removeDownload = async (youtubeId: string): Promise<boolean> => {
    const success = await removeOfflineTrack(youtubeId);
    if (success) {
      setDownloadedIds((prev) => {
        const next = new Set(prev);
        next.delete(youtubeId);
        return next;
      });
    }
    return success;
  };

  const isDownloaded = (youtubeId: string): boolean => {
    return downloadedIds.has(youtubeId);
  };

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
        isOfflineMode,
        downloadedIds,
        downloadingIds,
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
        downloadTrack,
        removeDownload,
        isDownloaded,
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
