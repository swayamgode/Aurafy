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

// Silent WAV — keeps mobile OS AudioSession alive during screen lock
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

  // Primary HTML5 audio player (streams from /api/stream or local offline blob)
  // Native HTML5 audio is lock-screen-safe and background-safe on iOS & Android
  const audioRef = useRef<HTMLAudioElement>(null);

  // Silent carrier — maintains OS AudioSession continuous connection
  const silentAudioRef = useRef<HTMLAudioElement>(null);

  // YouTube IFrame player (used as secondary fallback if stream route fails)
  const playerRef = useRef<any>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const isApiReady = useRef<boolean>(false);
  const pendingTrack = useRef<string | null>(null);
  const isFallbackToIframe = useRef<boolean>(false);

  // State refs
  const isPlayingRef = useRef<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  const isLocalOfflineAudio = Boolean(
    currentTrack?.audioUrl &&
      (currentTrack.audioUrl.startsWith("blob:") ||
        currentTrack.audioUrl.startsWith("data:"))
  );

  // ── Wake Lock ────────────────────────────────────────────────────────────────
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

  // ── Page visibility / lock screen resume ─────────────────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && isPlayingRef.current) {
        acquireWakeLock();
        if (audioRef.current && audioRef.current.paused && !isFallbackToIframe.current) {
          audioRef.current.play().catch(() => {});
        }
        if (silentAudioRef.current && silentAudioRef.current.paused) {
          silentAudioRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [acquireWakeLock]);

  // ── Global bridges for MediaSession hardware/lock-screen controls ───────────
  useEffect(() => {
    window._aurafyResume = () => {
      try {
        silentAudioRef.current?.play().catch(() => {});
        if (isFallbackToIframe.current) {
          playerRef.current?.playVideo?.();
        } else if (audioRef.current) {
          audioRef.current.play().catch(() => {
            // If HTML5 audio fails, fallback to YouTube iframe
            playerRef.current?.playVideo?.();
          });
        }
        acquireWakeLock();
      } catch (_) {}
    };

    window._aurafyPause = () => {
      try {
        silentAudioRef.current?.pause();
        audioRef.current?.pause();
        playerRef.current?.pauseVideo?.();
        releaseWakeLock();
      } catch (_) {}
    };

    window._aurafySeek = (seconds: number) => {
      try {
        if (audioRef.current && !isNaN(seconds)) {
          audioRef.current.currentTime = seconds;
        }
        playerRef.current?.seekTo?.(seconds, true);
      } catch (_) {}
    };

    window._aurafyGetTime = () => {
      if (audioRef.current && !isFallbackToIframe.current) {
        return audioRef.current.currentTime || 0;
      }
      try {
        return playerRef.current?.getCurrentTime?.() || 0;
      } catch {
        return 0;
      }
    };
  }, [acquireWakeLock, releaseWakeLock]);

  // ── YouTube IFrame fallback player init ──────────────────────────────────────
  const initYouTubePlayer = useCallback(
    (videoId?: string) => {
      if (!iframeContainerRef.current || !window.YT?.Player) return;
      const id = videoId || currentTrack?.youtubeId || "";
      if (!id) return;

      try {
        // Safe inner element replacement without destroying ref container
        iframeContainerRef.current.innerHTML = '<div id="yt-fallback-slot"></div>';

        playerRef.current = new window.YT.Player("yt-fallback-slot", {
          height: "200",
          width: "200",
          videoId: id,
          playerVars: {
            autoplay: 0,
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
                // Only play iframe if fallback is active
                if (isFallbackToIframe.current && isPlayingRef.current) {
                  event.target.playVideo();
                } else {
                  event.target.mute();
                }
                setYouTubePlayer?.(event.target);
                window._ytPlayerInstance = event.target;
              } catch (_) {}
            },
            onStateChange: (event: any) => {
              if (event.data === 0 && isFallbackToIframe.current) {
                nextTrack();
              }
            },
            onError: (event: any) => {
              if ([100, 101, 150].includes(event.data)) {
                setTimeout(nextTrack, 800);
              }
            },
          },
        });
      } catch (err) {
        console.warn("[Aurafy] YT fallback init error:", err);
      }
    },
    [currentTrack?.youtubeId, volume, isMuted, nextTrack, setYouTubePlayer]
  );

  // Load YouTube iframe API once
  useEffect(() => {
    if (window.YT?.Player) {
      isApiReady.current = true;
      initYouTubePlayer();
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
      if (id) initYouTubePlayer(id);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Silent carrier + Wake Lock sync ─────────────────────────────────────────
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

  // ── Primary Audio Engine: Track Change ───────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack || !audio) return;

    isFallbackToIframe.current = false;

    // Target stream URL:
    //   - local offline IndexedDB blob
    //   - direct audio stream from /api/stream (range-request capable, background-safe)
    const targetSrc =
      isLocalOfflineAudio && currentTrack.audioUrl
        ? currentTrack.audioUrl
        : `/api/stream?id=${encodeURIComponent(currentTrack.youtubeId)}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`;

    const currentSrc = audio.getAttribute("src") || audio.src;
    const isDifferent =
      !currentSrc ||
      (!currentSrc.includes(encodeURIComponent(currentTrack.youtubeId)) &&
        currentSrc !== targetSrc);

    if (isDifferent) {
      audio.src = targetSrc;
      try {
        audio.load();
      } catch (_) {}
    }

    audio.volume = isMuted ? 0 : volume;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("[Aurafy] HTML5 audio play failed, activating YT fallback:", err);
          isFallbackToIframe.current = true;
          try {
            playerRef.current?.unMute?.();
            playerRef.current?.setVolume(isMuted ? 0 : Math.round(volume * 100));
            playerRef.current?.playVideo?.();
          } catch (_) {}
        });
      }
    } else {
      audio.pause();
    }

    // Keep YouTube iframe ready with current video id
    const p = playerRef.current;
    if (!p || typeof p.loadVideoById !== "function") {
      if (isApiReady.current) {
        initYouTubePlayer(currentTrack.youtubeId);
      } else {
        pendingTrack.current = currentTrack.youtubeId;
      }
    } else {
      try {
        p.cueVideoById(currentTrack.youtubeId);
        p.mute();
        p.setVolume(0);
      } catch (_) {}
    }
  }, [
    currentTrack?.youtubeId,
    currentTrack?.audioUrl,
    isLocalOfflineAudio,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync Play/Pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      if (isFallbackToIframe.current) {
        try {
          playerRef.current?.playVideo?.();
        } catch (_) {}
      } else {
        audio.play().catch((err) => {
          console.warn("[Aurafy] Play error, falling back:", err);
          isFallbackToIframe.current = true;
          try {
            playerRef.current?.unMute?.();
            playerRef.current?.setVolume(isMuted ? 0 : Math.round(volume * 100));
            playerRef.current?.playVideo?.();
          } catch (_) {}
        });
      }
    } else {
      audio.pause();
      try {
        playerRef.current?.pauseVideo?.();
      } catch (_) {}
    }
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync Volume ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const vol = isMuted ? 0 : volume;

    if (audioRef.current) {
      audioRef.current.volume = vol;
    }

    if (playerRef.current && isFallbackToIframe.current) {
      try {
        playerRef.current.setVolume(Math.round(vol * 100));
        if (vol > 0) playerRef.current.unMute?.();
        else playerRef.current.mute?.();
      } catch (_) {}
    }
  }, [volume, isMuted]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: 1,
        height: 1,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      {/* Silent WAV carrier — maintains OS AudioSession continuous connection */}
      <audio
        ref={silentAudioRef}
        src={SILENT_AUDIO_CARRIER}
        playsInline
        preload="auto"
        loop
      />

      {/* Primary Audio Player — native HTML5 audio for continuous lock-screen & background playback */}
      <audio
        ref={audioRef}
        playsInline
        preload="auto"
        onEnded={() => nextTrack()}
        onError={() => {
          console.warn("[Aurafy] Audio error on stream, falling back to YouTube iframe");
          isFallbackToIframe.current = true;
          try {
            playerRef.current?.unMute?.();
            playerRef.current?.setVolume(isMuted ? 0 : Math.round(volume * 100));
            if (isPlayingRef.current) {
              playerRef.current?.playVideo?.();
            }
          } catch (_) {}
        }}
      />

      {/* YouTube IFrame Fallback slot — kept safe inside container */}
      <div ref={iframeContainerRef} id="youtube-audio-iframe-container" />
    </div>
  );
}
