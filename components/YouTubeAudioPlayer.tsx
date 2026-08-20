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

  const isLocalOfflineAudio = Boolean(
    currentTrack?.audioUrl &&
      (currentTrack.audioUrl.startsWith("blob:") ||
        currentTrack.audioUrl.startsWith("data:"))
  );

  // Global control bridges — declared unconditionally so offline playback and hardware media keys always work
  useEffect(() => {
    window._aurafyResume = () => {
      try {
        if (silentAudioRef.current && silentAudioRef.current.paused) {
          silentAudioRef.current.play().catch(() => {});
        }
        if (isLocalOfflineAudio && offlineAudioRef.current) {
          offlineAudioRef.current.play().catch(() => {});
        } else if (
          playerRef.current &&
          typeof playerRef.current.playVideo === "function"
        ) {
          playerRef.current.playVideo();
        }
      } catch (e) {}
    };

    window._aurafyPause = () => {
      try {
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
        if (isLocalOfflineAudio && offlineAudioRef.current) {
          offlineAudioRef.current.currentTime = seconds;
        } else if (
          playerRef.current &&
          typeof playerRef.current.seekTo === "function"
        ) {
          playerRef.current.seekTo(seconds, true);
        }
      } catch (e) {}
    };
  }, [isLocalOfflineAudio]);

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

  // Keep mobile OS AudioSession alive using silent audio carrier
  useEffect(() => {
    const silentAudio = silentAudioRef.current;
    if (!silentAudio) return;

    if (isPlaying) {
      silentAudio.volume = 0.001;
      silentAudio.play().catch(() => {});
    } else {
      silentAudio.pause();
    }
  }, [isPlaying]);

  // Handle local offline audio playback vs online YouTube playback
  useEffect(() => {
    const offAudio = offlineAudioRef.current;
    const p = playerRef.current;

    if (isLocalOfflineAudio && currentTrack?.audioUrl) {
      // Pause YouTube player if active
      try {
        if (p && typeof p.pauseVideo === "function") p.pauseVideo();
      } catch (e) {}

      // Play local blob in HTML5 Audio element
      if (offAudio) {
        if (offAudio.src !== currentTrack.audioUrl) {
          offAudio.src = currentTrack.audioUrl;
          try {
            offAudio.load();
          } catch (e) {}
        }
        offAudio.volume = isMuted ? 0 : volume;
        if (isPlaying) {
          const playPromise = offAudio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("[Offline Audio Play Fallback to Streaming]:", err);
              // Fallback to online YT player if blob format is incompatible
              try {
                if (p && typeof p.playVideo === "function") p.playVideo();
              } catch (e) {}
            });
          }
        } else {
          offAudio.pause();
        }
      }
    } else {
      // Online YouTube track
      if (offAudio) {
        offAudio.pause();
        if (offAudio.src) {
          offAudio.removeAttribute("src");
          try {
            offAudio.load();
          } catch (e) {}
        }
      }

      try {
        if (isPlaying) {
          if (p && typeof p.playVideo === "function") p.playVideo();
        } else {
          if (p && typeof p.pauseVideo === "function") p.pauseVideo();
        }
      } catch (e) {}
    }
  }, [isPlaying, isLocalOfflineAudio, currentTrack?.audioUrl, volume, isMuted]);

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
      />

      {/* Offline HTML5 Audio Player for downloaded songs */}
      <audio
        ref={offlineAudioRef}
        playsInline
        preload="auto"
        onEnded={() => nextTrack()}
      />

      {/* Online YouTube Audio stream container */}
      <div ref={containerRef} id="youtube-audio-iframe" />
    </div>
  );
}
