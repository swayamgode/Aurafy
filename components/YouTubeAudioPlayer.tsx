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

// 44-byte silent WAV audio data URI to keep the mobile OS AudioSession alive during screen lock
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
  const offlineAudioRef = useRef<HTMLAudioElement>(null);
  const isApiReady = useRef<boolean>(false);
  const pendingTrack = useRef<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noSleepNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  const isLocalOfflineAudio = Boolean(
    currentTrack?.audioUrl &&
      (currentTrack.audioUrl.startsWith("blob:") ||
        currentTrack.audioUrl.startsWith("data:"))
  );

  // ── Web Audio API no-sleep trick (keeps iOS/Android audio session alive) ──
  // Creates a silent oscillator so the browser doesn't suspend audio entirely
  const startNoSleepAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      // Create a 1-second silent buffer and loop it forever
      if (!noSleepNodeRef.current) {
        const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(ctx.destination);
        source.start(0);
        noSleepNodeRef.current = source;
      }
    } catch (e) {}
  }, []);

  const stopNoSleepAudio = useCallback(() => {
    try {
      if (noSleepNodeRef.current) {
        noSleepNodeRef.current.stop();
        noSleepNodeRef.current.disconnect();
        noSleepNodeRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.suspend().catch(() => {});
      }
    } catch (e) {}
  }, []);

  // ── Screen Wake Lock — prevents display sleep mid-song ──
  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current?.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      }
    } catch (e) {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    } catch (e) {}
  }, []);

  // Re-acquire wake lock when page becomes visible again (released on hide)
  useEffect(() => {
    const onVisibility = async () => {
      if (document.visibilityState === "visible" && isPlayingRef.current) {
        await acquireWakeLock();
        // If audio stalled while hidden, reload and play it from last position
        const audio = offlineAudioRef.current;
        if (audio && (audio.paused || audio.readyState < 2)) {
          const savedTime = audio.currentTime;
          try {
            audio.load();
            audio.currentTime = savedTime;
            await audio.play();
          } catch (e) {}
        }
        // Resume silent carrier too
        const silent = silentAudioRef.current;
        if (silent && silent.paused) {
          silent.play().catch(() => {});
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [acquireWakeLock]);

  // Global control bridges — declared unconditionally so offline playback and hardware media keys always work
  useEffect(() => {
    window._aurafyResume = () => {
      try {
        startNoSleepAudio();
        if (silentAudioRef.current && silentAudioRef.current.paused) {
          silentAudioRef.current.play().catch(() => {});
        }
        if (offlineAudioRef.current) {
          offlineAudioRef.current.play().catch(() => {});
        }
        if (
          playerRef.current &&
          typeof playerRef.current.playVideo === "function"
        ) {
          playerRef.current.playVideo();
        }
        acquireWakeLock();
      } catch (e) {}
    };

    window._aurafyPause = () => {
      try {
        stopNoSleepAudio();
        releaseWakeLock();
        if (silentAudioRef.current && !silentAudioRef.current.paused) {
          silentAudioRef.current.pause();
        }
        if (offlineAudioRef.current) {
          offlineAudioRef.current.pause();
        }
        if (
          playerRef.current &&
          typeof playerRef.current.pauseVideo === "function"
        ) {
          playerRef.current.pauseVideo();
        }
      } catch (e) {}
    };

    window._aurafySeek = (seconds: number) => {
      try {
        if (offlineAudioRef.current) {
          offlineAudioRef.current.currentTime = seconds;
        }
        if (
          playerRef.current &&
          typeof playerRef.current.seekTo === "function"
        ) {
          playerRef.current.seekTo(seconds, true);
        }
      } catch (e) {}
    };

    window._aurafyGetTime = () => {
      return offlineAudioRef.current?.currentTime ?? 0;
    };
  }, [isLocalOfflineAudio, startNoSleepAudio, stopNoSleepAudio, acquireWakeLock, releaseWakeLock]);

  // Initialize YouTube IFrame Player for online streaming
  const initPlayer = useCallback(
    (videoId?: string) => {
      if (!containerRef.current || !window.YT || !window.YT.Player) return;

      const id = videoId || currentTrack?.youtubeId || "";
      if (!id) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: "200",
          width: "200",
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
          },
          events: {
            onReady: (event: any) => {
              try {
                event.target.setVolume(isMuted ? 0 : Math.round(volume * 100));
                if (!isLocalOfflineAudio) {
                  event.target.playVideo();
                }
                if (typeof setYouTubePlayer === "function") {
                  setYouTubePlayer(event.target);
                }
                window._ytPlayerInstance = event.target;
              } catch (e) {
                console.warn("[Audio Engine] onReady error:", e);
              }
            },
            onStateChange: (event: any) => {
              if (event.data === 0) {
                // Video ended -> next track
                nextTrack();
              }
            },
            onError: (event: any) => {
              console.warn("[Audio Engine] YouTube error code:", event.data);
              if ([100, 101, 150].includes(event.data)) {
                setTimeout(nextTrack, 800);
              }
            },
          },
        });
      } catch (err) {
        console.warn("[Audio Engine] Init failed:", err);
      }
    },
    [currentTrack?.youtubeId, isLocalOfflineAudio] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Load YouTube script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
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

  // Keep mobile OS AudioSession alive using silent audio carrier + Web Audio no-sleep
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    const silentAudio = silentAudioRef.current;
    if (!silentAudio) return;

    if (isPlaying) {
      silentAudio.volume = 0.001;
      silentAudio.play().catch(() => {});
      startNoSleepAudio();
      acquireWakeLock();
    } else {
      silentAudio.pause();
      stopNoSleepAudio();
      releaseWakeLock();
    }
  }, [isPlaying, startNoSleepAudio, stopNoSleepAudio, acquireWakeLock, releaseWakeLock]);

  // Handle audio playback engine (HTML5 Audio for screen lock continuity + YouTube IFrame fallback)
  useEffect(() => {
    const offAudio = offlineAudioRef.current;
    const p = playerRef.current;

    if (!currentTrack) return;

    // Determine target audio URL:
    //   - blob:/data: (offline downloaded IndexedDB audio)
    //   - /api/stream for online tracks (supports HTTP Range 206 so mobile screen lock works)
    const targetAudioSrc = isLocalOfflineAudio && currentTrack.audioUrl
      ? currentTrack.audioUrl
      : `/api/stream?id=${encodeURIComponent(currentTrack.youtubeId)}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`;

    if (offAudio) {
      if (offAudio.src !== targetAudioSrc && !offAudio.src.endsWith(encodeURIComponent(currentTrack.youtubeId))) {
        offAudio.src = targetAudioSrc;
        try {
          offAudio.load();
        } catch (e) {}
      }

      offAudio.volume = isMuted ? 0 : volume;

      if (isPlaying) {
        const playPromise = offAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("[HTML5 Audio Play Fallback to YT Iframe]:", err);
            // Fallback to YouTube IFrame player if HTML5 audio stream fails
            try {
              if (p && typeof p.playVideo === "function") p.playVideo();
            } catch (e) {}
          });
        }
      } else {
        offAudio.pause();
      }
    }

    // Sync YouTube iframe player state as secondary backup
    try {
      if (isPlaying) {
        if (p && typeof p.playVideo === "function") p.playVideo();
      } else {
        if (p && typeof p.pauseVideo === "function") p.pauseVideo();
      }
    } catch (e) {}
  }, [isPlaying, isLocalOfflineAudio, currentTrack?.youtubeId, currentTrack?.audioUrl, currentTrack?.title, currentTrack?.artist, volume, isMuted]);

  // Sync track change - load online video or reset
  useEffect(() => {
    if (!currentTrack?.youtubeId) return;
    if (isLocalOfflineAudio) return; // offline audio handled separately above

    const p = playerRef.current;

    if (!p || typeof p.loadVideoById !== "function") {
      // Player not initialized yet — create it now with this videoId
      if (isApiReady.current) {
        initPlayer(currentTrack.youtubeId);
      } else {
        pendingTrack.current = currentTrack.youtubeId;
      }
      return;
    }

    try {
      p.loadVideoById(currentTrack.youtubeId);
      p.playVideo();
    } catch (e) {
      console.warn("[Audio Engine] loadVideoById error:", e);
    }
  }, [currentTrack?.youtubeId, isLocalOfflineAudio, initPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume to audio elements
  useEffect(() => {
    const targetVol = isMuted ? 0 : volume;

    if (offlineAudioRef.current) {
      offlineAudioRef.current.volume = targetVol;
    }

    const p = playerRef.current;
    try {
      if (p && typeof p.setVolume === "function") {
        p.setVolume(Math.round(targetVol * 100));
      }
    } catch (e) {}
  }, [volume, isMuted]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: -9999,
        left: -9999,
        width: 200,
        height: 200,
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      {/* Silent carrier to maintain mobile OS AudioSession during screen lock */}
      <audio
        ref={silentAudioRef}
        src={SILENT_AUDIO_CARRIER}
        playsInline
        preload="auto"
        loop
        x-webkit-airplay="allow"
      />

      {/* HTML5 Audio — primary background playback engine (Range-request via /api/stream) */}
      <audio
        ref={offlineAudioRef}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        x-webkit-airplay="allow"
        onEnded={() => nextTrack()}
        onStalled={() => {
          // Attempt recovery if audio stalls (e.g. network hiccup after resume)
          const audio = offlineAudioRef.current;
          if (audio && isPlayingRef.current) {
            const t = audio.currentTime;
            audio.load();
            audio.currentTime = t;
            audio.play().catch(() => {});
          }
        }}
      />

      {/* Online YouTube Audio stream container (secondary / sync) */}
      <div ref={containerRef} id="youtube-audio-iframe" />
    </div>
  );
}
