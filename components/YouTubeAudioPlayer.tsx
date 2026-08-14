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
    _aurafyAudioRef: HTMLAudioElement | null;
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
    progress,
    nextTrack,
    setYouTubePlayer,
  } = usePlayer();

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isApiReady = useRef<boolean>(false);
  const pendingTrack = useRef<string | null>(null);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Initialize YouTube IFrame Player
  const initPlayer = useCallback(() => {
    if (!containerRef.current) return;

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {}
      playerRef.current = null;
    }

    const videoId = currentTrack?.youtubeId || "jfKfPfyJRdk";

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: "1",
        width: "1",
        videoId,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(isMuted ? 0 : Math.round(volume * 100));
            if (isPlaying) {
              event.target.playVideo();
            }
            if (typeof setYouTubePlayer === "function") {
              setYouTubePlayer(event.target);
            }
            window._ytPlayerInstance = event.target;

            // Global bridges for phone unlock / background resume
            window._aurafyResume = () => {
              try {
                if (audioRef.current && audioRef.current.paused) {
                  audioRef.current.play().catch(() => {});
                }
                if (playerRef.current && typeof playerRef.current.playVideo === "function") {
                  playerRef.current.playVideo();
                }
              } catch (e) {}
            };

            window._aurafyPause = () => {
              try {
                if (audioRef.current && !audioRef.current.paused) {
                  audioRef.current.pause();
                }
                if (playerRef.current && typeof playerRef.current.pauseVideo === "function") {
                  playerRef.current.pauseVideo();
                }
              } catch (e) {}
            };

            if (pendingTrack.current && pendingTrack.current !== videoId) {
              event.target.loadVideoById(pendingTrack.current);
              pendingTrack.current = null;
            }
          },
          onStateChange: (event: any) => {
            if (event.data === 0) {
              nextTrack();
            }
          },
          onError: (event: any) => {
            console.warn("[Audio Engine] Player status code:", event.data);
            if ([100, 101, 150].includes(event.data)) {
              setTimeout(nextTrack, 500);
            }
          },
        },
      });
    } catch (err) {
      console.warn("[Audio Engine] Init failed:", err);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      initPlayer();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Manage HTML5 background audio carrier / stream for mobile lock screen
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    window._aurafyAudioRef = audio;

    // Use direct audioUrl if present, otherwise use silent carrier to keep mobile AudioSession awake
    const targetSrc = currentTrack?.audioUrl || SILENT_AUDIO_CARRIER;
    if (audio.src !== targetSrc) {
      audio.src = targetSrc;
      audio.load();
    }

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentTrack?.audioUrl, currentTrack?.youtubeId, isPlaying]);

  // Sync play/pause state
  useEffect(() => {
    const p = playerRef.current;
    const audio = audioRef.current;

    try {
      if (isPlaying) {
        if (p && typeof p.playVideo === "function") p.playVideo();
        if (audio && audio.paused) audio.play().catch(() => {});
      } else {
        if (p && typeof p.pauseVideo === "function") p.pauseVideo();
        if (audio && !audio.paused) audio.pause();
      }
    } catch (e) {}
  }, [isPlaying]);

  // Sync track change
  useEffect(() => {
    if (!currentTrack?.youtubeId) return;
    const p = playerRef.current;

    if (!p || typeof p.loadVideoById !== "function") {
      pendingTrack.current = currentTrack.youtubeId;
      return;
    }

    try {
      p.loadVideoById({ videoId: currentTrack.youtubeId, startSeconds: 0 });
      if (isPlaying) {
        p.playVideo();
      }
    } catch (e) {
      console.warn("[Audio Engine] loadVideoById:", e);
    }
  }, [currentTrack?.youtubeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume & mute
  useEffect(() => {
    const p = playerRef.current;
    const audio = audioRef.current;

    const targetVol = isMuted ? 0 : volume;
    try {
      if (p && typeof p.setVolume === "function") {
        p.setVolume(Math.round(targetVol * 100));
      }
      if (audio) {
        // If playing silent carrier, keep audio element at tiny audible volume so OS treats as active
        audio.volume = currentTrack?.audioUrl ? targetVol : 0.01;
        audio.muted = isMuted;
      }
    } catch (e) {}
  }, [volume, isMuted, currentTrack?.audioUrl]);

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
        opacity: 0,
      }}
    >
      {/* HTML5 background audio stream for lock screen persistence */}
      <audio
        ref={audioRef}
        playsInline
        preload="auto"
        loop={!currentTrack?.audioUrl}
        onEnded={nextTrack}
      />
      {/* YouTube audio stream controller */}
      <div ref={containerRef} id="youtube-audio-iframe" />
    </div>
  );
}
