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
  const isApiReady = useRef<boolean>(false);
  const pendingTrack = useRef<string | null>(null);

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
                if (silentAudioRef.current && silentAudioRef.current.paused) {
                  silentAudioRef.current.play().catch(() => {});
                }
                if (playerRef.current && typeof playerRef.current.playVideo === "function") {
                  playerRef.current.playVideo();
                }
              } catch (e) {}
            };

            window._aurafyPause = () => {
              try {
                if (silentAudioRef.current && !silentAudioRef.current.paused) {
                  silentAudioRef.current.pause();
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

  // Keep mobile OS AudioSession alive using inaudible silent audio carrier
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

  // Sync play/pause state to the actual YouTube player
  useEffect(() => {
    const p = playerRef.current;
    try {
      if (isPlaying) {
        if (p && typeof p.playVideo === "function") p.playVideo();
      } else {
        if (p && typeof p.pauseVideo === "function") p.pauseVideo();
      }
    } catch (e) {}
  }, [isPlaying]);

  // Sync track change - load the exact YouTube ID of the selected song
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

  // Sync volume & mute to the actual YouTube player
  useEffect(() => {
    const p = playerRef.current;
    const targetVol = isMuted ? 0 : volume;
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
        bottom: 0,
        right: 0,
        width: 1,
        height: 1,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: 0,
      }}
    >
      {/* Silent inaudible carrier solely to maintain mobile OS AudioSession */}
      <audio
        ref={silentAudioRef}
        src={SILENT_AUDIO_CARRIER}
        playsInline
        preload="auto"
        loop
      />
      {/* The REAL audio player output from YouTube */}
      <div ref={containerRef} id="youtube-audio-iframe" />
    </div>
  );
}
