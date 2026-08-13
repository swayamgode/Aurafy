"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { usePlayer } from "@/lib/PlayerContext";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    _ytPlayerInstance: any;
  }
}

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
  const isApiReady = useRef<boolean>(false);
  const pendingTrack = useRef<string | null>(null);

  const initPlayer = useCallback(() => {
    if (!containerRef.current) return;

    // Destroy existing player instance first
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
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(isMuted ? 0 : Math.round(volume * 100));
            if (isPlaying) {
              event.target.playVideo();
            }
            // Register the player instance globally for seekTo
            if (typeof setYouTubePlayer === "function") {
              setYouTubePlayer(event.target);
            }
            window._ytPlayerInstance = event.target;

            // If a track was queued while player was loading, load it now
            if (pendingTrack.current && pendingTrack.current !== videoId) {
              event.target.loadVideoById(pendingTrack.current);
              pendingTrack.current = null;
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED === 0
            if (event.data === 0) {
              nextTrack();
            }
          },
          onError: (event: any) => {
            console.warn("[YT Player] Error code:", event.data);
            // Error 150 = video restricted, 101 = not embeddable, 5 = HTML5 error
            // Auto-skip to next on embed-restricted videos
            if ([100, 101, 150].includes(event.data)) {
              setTimeout(nextTrack, 500);
            }
          },
        },
      });
    } catch (err) {
      console.warn("[YT Player] Init failed:", err);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isApiReady.current = true;
      initPlayer();
      return;
    }

    // Only inject the script if not already present
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

  // Sync play/pause state
  useEffect(() => {
    const p = playerRef.current;
    if (!p || typeof p.playVideo !== "function") return;
    try {
      if (isPlaying) {
        p.playVideo();
      } else {
        p.pauseVideo();
      }
    } catch (e) {}
  }, [isPlaying]);

  // Load new track when currentTrack.youtubeId changes
  useEffect(() => {
    if (!currentTrack?.youtubeId) return;
    const p = playerRef.current;

    if (!p || typeof p.loadVideoById !== "function") {
      // Player not ready yet — queue the track ID
      pendingTrack.current = currentTrack.youtubeId;
      return;
    }

    try {
      p.loadVideoById({ videoId: currentTrack.youtubeId, startSeconds: 0 });
      if (isPlaying) {
        p.playVideo();
      }
    } catch (e) {
      console.warn("[YT Player] loadVideoById error:", e);
    }
  }, [currentTrack?.youtubeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume
  useEffect(() => {
    const p = playerRef.current;
    if (!p || typeof p.setVolume !== "function") return;
    try {
      p.setVolume(isMuted ? 0 : Math.round(volume * 100));
    } catch (e) {}
  }, [volume, isMuted]);

  return (
    // Completely hidden — only audio output matters
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
      <div ref={containerRef} id="youtube-audio-iframe" />
    </div>
  );
}
