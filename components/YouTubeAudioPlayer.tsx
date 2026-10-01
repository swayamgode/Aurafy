"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { usePlayer } from "@/lib/PlayerContext";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytPlayerInstance: any;
    _aurafyResume: () => void;
    _aurafyPause: () => void;
    _aurafySeek: (seconds: number) => void;
    _aurafyGetTime: () => number;
  }
}

// 44-byte silent WAV — keeps the mobile OS AudioSession alive while screen is locked
const SILENT_AUDIO_CARRIER =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export default function YouTubeAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    nextTrack,
    setYouTubePlayer,
  } = usePlayer();

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const silentAudioRef = useRef<HTMLAudioElement>(null);
  const mainAudioRef = useRef<HTMLAudioElement>(null);
  const isApiReady = useRef<boolean>(false);
  const pendingTrack = useRef<string | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Auto-buffer: track currently being buffered
  const autoBufferAbortRef = useRef<AbortController | null>(null);
  const autoBlobUrlRef = useRef<string | null>(null);
  const currentBlobTrackId = useRef<string | null>(null);

  // Wake lock ref (typed as any since WakeLockSentinel may not be in TS lib)
  const wakeLockRef = useRef<any>(null);

  const isLocalOfflineAudio = Boolean(
    currentTrack?.audioUrl &&
      (currentTrack.audioUrl.startsWith("blob:") ||
        currentTrack.audioUrl.startsWith("data:"))
  );

  // ── Wake Lock helpers ────────────────────────────────────────────────────────
  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current?.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      }
    } catch (_) {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    try {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    } catch (_) {}
  }, []);

  // Re-acquire wake lock when page becomes visible (it's released automatically on hide)
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState === "visible" && isPlayingRef.current) {
        await acquireWakeLock();
        // If main audio stalled while hidden, try to resume it
        const audio = mainAudioRef.current;
        if (audio && (audio.paused || audio.readyState < 2)) {
          audio.play().catch(() => {});
        }
        const silent = silentAudioRef.current;
        if (silent && silent.paused) silent.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [acquireWakeLock]);

  // ── AUTO-BUFFER: the KEY fix for lock screen audio ──────────────────────────
  // HTTP streams die when screen locks. Blob URLs live in memory — they NEVER need
  // a network connection, so they keep playing even with screen locked.
  // Strategy:
  //   1. Start playing from /api/stream immediately (so audio starts without delay)
  //   2. Simultaneously, fetch the full audio blob in the background
  //   3. Once blob is ready, seamlessly switch the audio element src to the blob URL
  //   4. From that point on, audio works reliably on lock screen
  const autoBufferTrack = useCallback(
    async (youtubeId: string, title: string, artist: string) => {
      // Cancel any in-progress buffer for a different track
      if (autoBufferAbortRef.current) {
        autoBufferAbortRef.current.abort();
      }
      // Revoke previous blob to free memory
      if (autoBlobUrlRef.current && currentBlobTrackId.current !== youtubeId) {
        URL.revokeObjectURL(autoBlobUrlRef.current);
        autoBlobUrlRef.current = null;
        currentBlobTrackId.current = null;
      }
      // Already have blob for this track — just make sure audio is using it
      if (currentBlobTrackId.current === youtubeId && autoBlobUrlRef.current) {
        const audio = mainAudioRef.current;
        if (audio && !audio.src.startsWith("blob:")) {
          const pos = audio.currentTime;
          const playing = !audio.paused;
          audio.src = autoBlobUrlRef.current;
          audio.currentTime = pos;
          if (playing) audio.play().catch(() => {});
        }
        return;
      }

      const abort = new AbortController();
      autoBufferAbortRef.current = abort;

      try {
        // Slight delay — let the stream start playing first so user hears audio instantly
        await new Promise((res) => setTimeout(res, 800));
        if (abort.signal.aborted) return;

        // Fetch the full audio from /api/stream as a complete blob
        // (The URL is already cached from the initial stream request, so no double yt-dlp call)
        const streamUrl = `/api/stream?id=${encodeURIComponent(youtubeId)}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
        const res = await fetch(streamUrl, { signal: abort.signal });

        if (!res.ok || abort.signal.aborted) return;

        const blob = await res.blob();
        if (abort.signal.aborted || blob.size < 5000) return;

        const blobUrl = URL.createObjectURL(blob);
        autoBlobUrlRef.current = blobUrl;
        currentBlobTrackId.current = youtubeId;

        // Seamlessly switch the audio element to the memory-resident blob URL
        const audio = mainAudioRef.current;
        if (audio && !abort.signal.aborted) {
          const savedPos = audio.currentTime;
          const wasPlaying = !audio.paused;

          audio.src = blobUrl;
          audio.load();

          // Restore position after load
          const onCanPlay = () => {
            audio.removeEventListener("canplay", onCanPlay);
            audio.currentTime = savedPos;
            if (wasPlaying) {
              audio.play().catch(() => {});
            }
          };
          audio.addEventListener("canplay", onCanPlay);
        }

        console.log("[Audio] ✓ Switched to blob URL — lock-screen-safe playback active");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("[Audio] Auto-buffer failed:", err?.message);
        }
      }
    },
    []
  );

  // ── Global control bridges ───────────────────────────────────────────────────
  useEffect(() => {
    window._aurafyResume = () => {
      try {
        if (silentAudioRef.current?.paused) {
          silentAudioRef.current.play().catch(() => {});
        }
        if (mainAudioRef.current) {
          mainAudioRef.current.play().catch(() => {});
        }
        acquireWakeLock();
      } catch (_) {}
    };

    window._aurafyPause = () => {
      try {
        silentAudioRef.current?.pause();
        mainAudioRef.current?.pause();
        releaseWakeLock();
      } catch (_) {}
    };

    window._aurafySeek = (seconds: number) => {
      try {
        if (mainAudioRef.current) {
          mainAudioRef.current.currentTime = seconds;
        }
        if (playerRef.current?.seekTo) {
          playerRef.current.seekTo(seconds, true);
        }
      } catch (_) {}
    };

    window._aurafyGetTime = () => mainAudioRef.current?.currentTime ?? 0;
  }, [acquireWakeLock, releaseWakeLock]);

  // ── Initialize YouTube IFrame Player (MUTED — used only for track-end detection) ──
  const initPlayer = useCallback(
    (videoId?: string) => {
      if (!containerRef.current || !window.YT || !window.YT.Player) return;

      const id = videoId || currentTrack?.youtubeId || "";
      if (!id) return;

      try { playerRef.current?.destroy(); } catch (_) {}
      playerRef.current = null;

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: "1",
          width: "1",
          videoId: id,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            mute: 1, // ← MUTED: HTML5 audio is the actual audio source
          },
          events: {
            onReady: (event: any) => {
              try {
                event.target.setVolume(0); // always muted
                event.target.mute();
                if (!isLocalOfflineAudio) event.target.playVideo();
                if (typeof setYouTubePlayer === "function") {
                  setYouTubePlayer(event.target);
                }
                window._ytPlayerInstance = event.target;
              } catch (_) {}
            },
            onStateChange: (event: any) => {
              // YT.PlayerState.ENDED = 0
              if (event.data === 0) nextTrack();
            },
            onError: (event: any) => {
              if ([100, 101, 150].includes(event.data)) {
                setTimeout(nextTrack, 800);
              }
            },
          },
        });
      } catch (err) {
        console.warn("[Audio Engine] YT init failed:", err);
      }
    },
    [currentTrack?.youtubeId, isLocalOfflineAudio] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT?.Player) {
      isApiReady.current = true;
      initPlayer();
      return;
    }
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = () => {
      isApiReady.current = true;
      const id = pendingTrack.current || currentTrack?.youtubeId || "";
      pendingTrack.current = null;
      if (id) initPlayer(id);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Silent carrier + Wake Lock management ────────────────────────────────────
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    const silent = silentAudioRef.current;
    if (!silent) return;

    if (isPlaying) {
      silent.volume = 0.001;
      silent.play().catch(() => {});
      acquireWakeLock();
    } else {
      silent.pause();
      releaseWakeLock();
    }
  }, [isPlaying, acquireWakeLock, releaseWakeLock]);

  // ── Main audio playback engine ───────────────────────────────────────────────
  useEffect(() => {
    const audio = mainAudioRef.current;
    if (!currentTrack || !audio) return;

    // Determine audio source:
    //   • offline blob/data URI → play directly (already lock-screen-safe)
    //   • online track → stream from /api/stream (will auto-switch to blob shortly)
    const targetSrc = isLocalOfflineAudio && currentTrack.audioUrl
      ? currentTrack.audioUrl
      : `/api/stream?id=${encodeURIComponent(currentTrack.youtubeId)}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`;

    // Only update src if track actually changed
    const srcChanged =
      !audio.src.includes(encodeURIComponent(currentTrack.youtubeId)) &&
      !audio.src.startsWith("blob:") &&
      audio.src !== targetSrc;

    if (srcChanged || !audio.src) {
      audio.src = targetSrc;
      try { audio.load(); } catch (_) {}
    }

    audio.volume = isMuted ? 0 : volume;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, isLocalOfflineAudio, currentTrack?.youtubeId, currentTrack?.audioUrl, currentTrack?.title, currentTrack?.artist, volume, isMuted]);

  // ── Track change: load new YouTube video + trigger auto-buffer ───────────────
  useEffect(() => {
    if (!currentTrack?.youtubeId) return;

    // Auto-buffer for online tracks (offline tracks already have blob URLs)
    if (!isLocalOfflineAudio) {
      autoBufferTrack(currentTrack.youtubeId, currentTrack.title, currentTrack.artist);
    }

    // Update YouTube iframe (muted, just for session/track-end sync)
    const p = playerRef.current;
    if (!p || typeof p.loadVideoById !== "function") {
      if (isApiReady.current) {
        initPlayer(currentTrack.youtubeId);
      } else {
        pendingTrack.current = currentTrack.youtubeId;
      }
      return;
    }
    try {
      p.loadVideoById(currentTrack.youtubeId);
      p.mute();
      p.setVolume(0);
    } catch (_) {}
  }, [currentTrack?.youtubeId, isLocalOfflineAudio, autoBufferTrack, initPlayer]);

  // ── Volume sync (only to main audio — iframe stays muted) ────────────────────
  useEffect(() => {
    if (mainAudioRef.current) {
      mainAudioRef.current.volume = isMuted ? 0 : volume;
    }
    // Keep iframe always muted
    try {
      playerRef.current?.setVolume(0);
      playerRef.current?.mute();
    } catch (_) {}
  }, [volume, isMuted]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: -9999,
        left: -9999,
        width: 1,
        height: 1,
        pointerEvents: "none",
        zIndex: -1,
        opacity: 0,
      }}
    >
      {/* Silent WAV carrier — keeps OS AudioSession alive during screen lock */}
      <audio
        ref={silentAudioRef}
        src={SILENT_AUDIO_CARRIER}
        playsInline
        preload="auto"
        loop
      />

      {/* Main audio engine — starts on /api/stream, switches to blob URL for lock-screen safety */}
      <audio
        ref={mainAudioRef}
        playsInline
        preload="auto"
        onEnded={() => nextTrack()}
        onError={() => {
          // If stream fails, try to resume from blob if we have one
          if (autoBlobUrlRef.current && mainAudioRef.current) {
            const audio = mainAudioRef.current;
            const pos = audio.currentTime;
            audio.src = autoBlobUrlRef.current;
            audio.currentTime = pos;
            if (isPlayingRef.current) audio.play().catch(() => {});
          }
        }}
      />

      {/* YouTube iframe — MUTED, used only for track metadata & end-of-track detection */}
      <div ref={containerRef} id="youtube-audio-iframe" />
    </div>
  );
}
