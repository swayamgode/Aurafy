"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Play,
  RotateCcw,
  HelpCircle,
  Smartphone,
  Sparkles,
  Flame,
  Target,
  Trophy,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";
import { useToast } from "@/lib/ToastContext";
import dynamic from "next/dynamic";
import type { Difficulty, ScoreUpdate } from "./BeatSaberGame";

// Dynamically import the Three.js game (client-only)
const BeatSaberGame = dynamic(() => import("./BeatSaberGame"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#02040a]">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/70 text-xs font-medium">Loading Beat Burst VR...</p>
      </div>
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface BeatSaberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DIFFICULTY_LABELS: Record<Difficulty, { label: string; color: string; ring: string }> = {
  easy:   { label: "Easy",   color: "text-emerald-400", ring: "border-emerald-400" },
  normal: { label: "Normal", color: "text-cyan-400",    ring: "border-cyan-400" },
  hard:   { label: "Hard",   color: "text-orange-400",  ring: "border-orange-400" },
  expert: { label: "Expert", color: "text-pink-500",    ring: "border-pink-500" },
};

export default function BeatSaberModal({ isOpen, onClose }: BeatSaberModalProps) {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    seekTo,
    duration,
    progress,
  } = usePlayer();
  const { showToast } = useToast();

  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [score, setScore] = useState<ScoreUpdate>({
    score: 0,
    combo: 0,
    multiplier: 1,
    misses: 0,
    accuracy: 100,
    hits: 0,
  });
  const [maxCombo, setMaxCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Crosshair states
  const [isLockedOn, setIsLockedOn] = useState(false);
  const [misfireFlash, setMisfireFlash] = useState(false);
  const misfireTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Visual screen shimmers
  const [hitFlash, setHitFlash] = useState(false);
  const [missFlash, setMissFlash] = useState(false);
  const hitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [recenterCount, setRecenterCount] = useState(0);
  const [isGyroEnabled, setIsGyroEnabled] = useState(true);
  const [showControlsModal, setShowControlsModal] = useState(false);

  // ── Load High Score ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`aurafy_beatburst_high_${difficulty}`);
      setHighScore(saved ? parseInt(saved, 10) : 0);
    }
  }, [difficulty]);

  // ── Track Max Combo ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (score.combo > maxCombo) {
      setMaxCombo(score.combo);
    }
  }, [score.combo, maxCombo]);

  // ── Song Ended / Game Over Trigger ───────────────────────────────────────────
  const handleGameOver = useCallback(() => {
    setGameStarted(false);
    setIsGameOver(true);

    // Save and check high score
    const key = `aurafy_beatburst_high_${difficulty}`;
    const currentHigh = localStorage.getItem(key);
    const prevBest = currentHigh ? parseInt(currentHigh, 10) : 0;
    if (score.score > prevBest) {
      localStorage.setItem(key, score.score.toString());
      setHighScore(score.score);
      setIsNewHighScore(true);
    } else {
      setIsNewHighScore(false);
    }
  }, [difficulty, score.score]);

  // Listen for aurafy-song-ended event
  useEffect(() => {
    const onSongEnded = () => {
      if (gameStarted) {
        handleGameOver();
      }
    };
    window.addEventListener("aurafy-song-ended", onSongEnded);
    return () => window.removeEventListener("aurafy-song-ended", onSongEnded);
  }, [gameStarted, handleGameOver]);

  // Check if song reached duration
  useEffect(() => {
    if (gameStarted && duration > 10 && progress >= duration - 0.5) {
      handleGameOver();
    }
  }, [gameStarted, progress, duration, handleGameOver]);

  // ── Close Guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setGameStarted(false);
      setIsGameOver(false);
      setScore({ score: 0, combo: 0, multiplier: 1, misses: 0, accuracy: 100, hits: 0 });
      setMaxCombo(0);
      setShowControlsModal(false);
    }
  }, [isOpen]);

  // ── Request Gyroscope Permission (iOS Safari) ─────────────────────────────
  const requestGyroPermission = async () => {
    if (
      typeof window !== "undefined" &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function"
    ) {
      try {
        const resp = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        return resp === "granted";
      } catch (err) {
        console.warn("DeviceOrientation error:", err);
        return false;
      }
    }
    return true;
  };

  // ── Start Game ────────────────────────────────────────────────────────────
  const handleStartGame = async () => {
    if (!currentTrack) {
      showToast("Play a song first to start Beat Burst!", "info");
      return;
    }
    await requestGyroPermission();
    setScore({ score: 0, combo: 0, multiplier: 1, misses: 0, accuracy: 100, hits: 0 });
    setMaxCombo(0);
    setIsGameOver(false);
    setGameStarted(true);
    setRecenterCount((c) => c + 1);

    if (!isPlaying) togglePlay();
    try {
      window._aurafyResume?.();
    } catch (_) {}
    showToast(`Beat Burst started — ${DIFFICULTY_LABELS[difficulty].label}!`, "success");
  };

  // ── Restart Game ──────────────────────────────────────────────────────────
  const handleRestart = async () => {
    seekTo(0);
    try {
      window._aurafySeek?.(0);
      window._aurafyResume?.();
    } catch (_) {}
    if (!isPlaying) togglePlay();

    setScore({ score: 0, combo: 0, multiplier: 1, misses: 0, accuracy: 100, hits: 0 });
    setMaxCombo(0);
    setIsGameOver(false);
    setGameStarted(true);
    setRecenterCount((c) => c + 1);
  };

  const handleRecenter = () => {
    setRecenterCount((c) => c + 1);
    showToast("VR view recentered!", "info");
  };

  // ── Crosshair Callbacks ───────────────────────────────────────────────────
  const handleTargetLock = useCallback((locked: boolean) => {
    setIsLockedOn(locked);
  }, []);

  const handleMisfire = useCallback(() => {
    setMisfireFlash(true);
    if (misfireTimer.current) clearTimeout(misfireTimer.current);
    misfireTimer.current = setTimeout(() => setMisfireFlash(false), 240);
  }, []);

  const handleScoreUpdate = useCallback((update: ScoreUpdate) => {
    setScore(update);
  }, []);

  const handleBlockHit = useCallback((isSpecial: boolean) => {
    setHitFlash(true);
    if (hitTimer.current) clearTimeout(hitTimer.current);
    hitTimer.current = setTimeout(() => setHitFlash(false), isSpecial ? 220 : 130);
  }, []);

  const handleMiss = useCallback(() => {
    setMissFlash(true);
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => setMissFlash(false), 260);
  }, []);

  if (!isOpen) return null;

  // ── Rank Evaluation ───────────────────────────────────────────────────────
  const getRankInfo = () => {
    if (score.accuracy >= 94 && maxCombo >= 20) {
      return { rank: "S", label: "FLAWLESS", color: "text-amber-400", border: "border-amber-400/80", bg: "bg-amber-500/20" };
    }
    if (score.accuracy >= 85) {
      return { rank: "A", label: "EXCELLENT", color: "text-cyan-400", border: "border-cyan-400/80", bg: "bg-cyan-500/20" };
    }
    if (score.accuracy >= 70) {
      return { rank: "B", label: "GREAT", color: "text-purple-400", border: "border-purple-400/80", bg: "bg-purple-500/20" };
    }
    return { rank: "C", label: "CLEARED", color: "text-emerald-400", border: "border-emerald-400/80", bg: "bg-emerald-500/20" };
  };

  const rankInfo = getRankInfo();

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#02040a] overflow-hidden select-none">

      {/* ── Visual Hit / Miss Flash Shimmers ── */}
      {hitFlash && (
        <div className="absolute inset-0 pointer-events-none z-30 border-[4px] border-[#00f0ff]/50 opacity-70 animate-pulse" />
      )}
      {missFlash && (
        <div className="absolute inset-0 pointer-events-none z-30 bg-red-600/10 border-[4px] border-red-500/40" />
      )}

      {/* ── 3D Game Canvas ── */}
      {gameStarted && (
        <>
          <div className="absolute inset-0 z-0">
            <BeatSaberGame
              isPlaying={isPlaying}
              difficulty={difficulty}
              onScoreUpdate={handleScoreUpdate}
              onBlockHit={handleBlockHit}
              onMiss={handleMiss}
              onTargetLock={handleTargetLock}
              onMisfire={handleMisfire}
              recenterTrigger={recenterCount}
              isGyroEnabled={isGyroEnabled}
            />
          </div>

          {/* Holographic Cyber Reticle Crosshair in Center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="relative flex items-center justify-center">
              {/* Outer aiming ring (Compact 24px) */}
              <div
                className={`rounded-full border flex items-center justify-center transition-all duration-120 ${
                  isLockedOn
                    ? "w-8 h-8 border-emerald-400 bg-emerald-400/20 shadow-[0_0_14px_rgba(52,211,153,0.9)] scale-110"
                    : misfireFlash
                    ? "w-7 h-7 border-red-500 bg-red-500/25 shadow-[0_0_10px_rgba(239,68,68,0.8)] scale-90"
                    : "w-6 h-6 border-cyan-400/60 bg-cyan-950/20 shadow-[0_0_6px_rgba(0,240,255,0.35)]"
                }`}
              >
                {/* Center dot */}
                <div
                  className={`rounded-full transition-all duration-100 ${
                    isLockedOn
                      ? "w-2 h-2 bg-emerald-300 shadow-[0_0_8px_#34d399]"
                      : misfireFlash
                      ? "w-2 h-2 bg-red-400"
                      : "w-1.5 h-1.5 bg-cyan-300 shadow-sm shadow-cyan-400"
                  }`}
                />
              </div>

              {/* 4 Fine Reticle Ticks */}
              <div className={`absolute -top-1 w-0.5 h-1.5 transition-colors ${isLockedOn ? "bg-emerald-400" : "bg-cyan-400/70"}`} />
              <div className={`absolute -bottom-1 w-0.5 h-1.5 transition-colors ${isLockedOn ? "bg-emerald-400" : "bg-cyan-400/70"}`} />
              <div className={`absolute -left-1 h-0.5 w-1.5 transition-colors ${isLockedOn ? "bg-emerald-400" : "bg-cyan-400/70"}`} />
              <div className={`absolute -right-1 h-0.5 w-1.5 transition-colors ${isLockedOn ? "bg-emerald-400" : "bg-cyan-400/70"}`} />

              {/* Lock-on Badge */}
              {isLockedOn && (
                <div className="absolute -top-6 px-1.5 py-0.5 rounded-full bg-black/85 border border-emerald-400/70 text-[9px] font-black tracking-widest text-emerald-300 shadow-lg animate-pulse whitespace-nowrap">
                  LOCKED · TAP!
                </div>
              )}

              {/* Misfire Badge */}
              {misfireFlash && (
                <div className="absolute -top-6 px-1.5 py-0.5 rounded-full bg-black/85 border border-red-500/70 text-[9px] font-black tracking-widest text-red-400 shadow-lg whitespace-nowrap">
                  NO TARGET
                </div>
              )}
            </div>
          </div>

          {/* Bottom Tap Cue */}
          <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center pointer-events-none opacity-40">
            <span className="text-[10px] font-bold text-cyan-300 px-3 py-1 rounded-full bg-black/60 border border-cyan-500/30">
              ⚡ Aim crosshair at cubes & tap screen to burst
            </span>
          </div>
        </>
      )}

      {/* ── Top Bar (Mobile-Optimized Sleek Header) ── */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-safe-top py-2 bg-gradient-to-b from-black/95 via-black/75 to-transparent">
        {/* Left: Close + Song Title */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15 hover:bg-white/20 active:scale-95 cursor-pointer text-white"
            aria-label="Close Beat Burst"
          >
            <X className="w-4 h-4" />
          </button>
          {currentTrack && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 max-w-[130px] sm:max-w-[200px]">
              <Sparkles className="w-3 h-3 text-[#00f0ff] flex-shrink-0 animate-pulse" />
              <span className="text-white/80 text-[11px] font-medium truncate">
                {currentTrack.title}
              </span>
            </div>
          )}
        </div>

        {/* Right: Camera VR toggle + Recenter + Help */}
        <div className="flex items-center space-x-1.5">
          {gameStarted && (
            <>
              <button
                onClick={() => {
                  setIsGyroEnabled((prev) => !prev);
                  showToast(!isGyroEnabled ? "360° VR Gyro Look ON" : "Steady camera locked", "info");
                }}
                className={`px-2.5 py-1 rounded-full border text-[10px] font-black transition-all flex items-center space-x-1 cursor-pointer ${
                  isGyroEnabled
                    ? "bg-cyan-500/30 border-cyan-400 text-cyan-200"
                    : "bg-white/10 border-white/15 text-white/60"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>{isGyroEnabled ? "VR 360°" : "Steady"}</span>
              </button>

              {isGyroEnabled && (
                <button
                  onClick={handleRecenter}
                  className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/80 active:scale-90 cursor-pointer"
                  title="Recenter Camera"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setShowControlsModal(true)}
            className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/80 active:scale-90 cursor-pointer"
            title="Controls & Rules"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Compact Cyber Score Capsule (Phone First HUD) ── */}
      {gameStarted && (
        <div className="relative z-10 px-3 mt-1 pointer-events-none">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-black/75 backdrop-blur-xl rounded-2xl border border-cyan-500/25 max-w-sm mx-auto shadow-xl shadow-cyan-950/40">
            {/* Live Glowing Score */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/50 leading-none">Score</p>
              <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-pink-300 tabular-nums leading-tight">
                {score.score.toLocaleString()}
              </p>
            </div>

            {/* Combo Streak & Multiplier */}
            <div className="flex items-center space-x-1.5">
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <Flame className={`w-3.5 h-3.5 ${score.combo >= 20 ? "text-amber-400 animate-bounce" : "text-cyan-400"}`} />
                <span className={`text-xs font-black tracking-wider tabular-nums ${
                  score.combo >= 40 ? "text-amber-300" : score.combo >= 15 ? "text-cyan-300" : "text-white"
                }`}>
                  {score.combo}x
                </span>
              </div>
              {score.multiplier > 1 && (
                <span className="text-[10px] font-black text-white px-1.5 py-0.5 rounded-full bg-cyan-500/80 shadow-sm shadow-cyan-400">
                  ×{score.multiplier}
                </span>
              )}
            </div>

            {/* Accuracy & Misses */}
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1">
                <Target className="w-3 h-3 text-emerald-400" />
                <span className={`text-xs font-black tabular-nums ${
                  score.accuracy >= 90 ? "text-emerald-400" : score.accuracy >= 70 ? "text-amber-400" : "text-red-400"
                }`}>
                  {score.accuracy.toFixed(0)}%
                </span>
              </div>
              <p className="text-[9px] font-bold text-white/40 leading-none">
                {score.misses > 0 ? `${score.misses} miss` : "PERFECT"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Pre-Game Screen ── */}
      {!gameStarted && !isGameOver && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 py-3 space-y-4 max-w-lg mx-auto w-full">
          {/* Hero Icon */}
          <div className="relative pt-2">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-cyan-500 to-pink-600 flex items-center justify-center shadow-2xl shadow-cyan-900/50">
              <Sparkles className="w-9 h-9 text-white" strokeWidth={1.75} />
            </div>
            <div className="absolute -inset-1.5 rounded-[1.4rem] border-2 border-cyan-400/40 animate-pulse" />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-white font-black text-2xl tracking-tight">Beat Burst 3D VR</h1>
            <p className="text-white/60 text-xs max-w-xs leading-relaxed mx-auto">
              Aim your crosshair at cubes & tap to burst them on the song&apos;s real beat! Move your phone in 360° VR.
            </p>
          </div>

          {/* Current Song Display */}
          {currentTrack ? (
            <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-3 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                {currentTrack.thumbnailUrl ? (
                  <img src={currentTrack.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm truncate">{currentTrack.title}</p>
                <p className="text-white/50 text-xs truncate">{currentTrack.artist}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-3.5 flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <p className="text-white/60 text-xs">Play a song first to start bursting cubes to the beat!</p>
            </div>
          )}

          {/* Rules & Aim Mechanic Card */}
          <div className="w-full bg-white/[0.04] rounded-2xl border border-white/10 p-3.5 space-y-2.5">
            <span className="text-white font-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>How To Play</span>
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-cyan-950/40 border border-cyan-400/30 p-2 space-y-0.5">
                <span className="text-sm">🎯</span>
                <p className="text-cyan-300 font-bold text-[10px]">1. Aim</p>
                <p className="text-white/50 text-[9px]">Align reticle</p>
              </div>
              <div className="rounded-xl bg-amber-950/40 border border-amber-400/30 p-2 space-y-0.5">
                <span className="text-sm">🟢</span>
                <p className="text-amber-300 font-bold text-[10px]">2. Lock-On</p>
                <p className="text-white/50 text-[9px]">Reticle turns green</p>
              </div>
              <div className="rounded-xl bg-pink-950/40 border border-pink-400/30 p-2 space-y-0.5">
                <span className="text-sm">💥</span>
                <p className="text-pink-300 font-bold text-[10px]">3. Tap</p>
                <p className="text-white/50 text-[9px]">Shatter on beat!</p>
              </div>
            </div>
          </div>

          {/* Difficulty picker */}
          <div className="w-full space-y-1.5">
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest text-center">Difficulty</p>
            <div className="grid grid-cols-4 gap-2">
              {(["easy", "normal", "hard", "expert"] as Difficulty[]).map((d) => {
                const dl = DIFFICULTY_LABELS[d];
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      difficulty === d
                        ? `${dl.ring} bg-white/10 font-black shadow-md`
                        : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${dl.color}`}>{dl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            disabled={!currentTrack}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00f0ff] to-[#ff007f] hover:opacity-90 font-black text-white text-base shadow-lg shadow-cyan-500/25 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-30 disabled:pointer-events-none mt-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>START BEAT BURST</span>
          </button>
        </div>
      )}

      {/* ── Game Over / Results Screen (Triggered When Song Ends) ── */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#0c1222] to-[#04060c] rounded-3xl border border-cyan-500/30 p-5 shadow-2xl shadow-cyan-950/80 text-center space-y-4">
            {/* Header */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-400/30">
                Song Completed!
              </span>
              <h2 className="text-xl font-black text-white tracking-tight mt-2">
                {score.accuracy >= 90 ? "Spectacular Performance!" : "Stage Cleared!"}
              </h2>
              <p className="text-white/50 text-[11px] truncate max-w-[220px] mx-auto">
                {currentTrack?.title} · {currentTrack?.artist}
              </p>
            </div>

            {/* Rank Badge */}
            <div className="relative inline-flex items-center justify-center my-1">
              <div className={`w-18 h-18 rounded-2xl flex flex-col items-center justify-center font-black ${rankInfo.bg} ${rankInfo.border} border-2 shadow-xl`}>
                <span className={`text-4xl leading-none ${rankInfo.color}`}>{rankInfo.rank}</span>
                <span className={`text-[8px] tracking-widest uppercase mt-0.5 ${rankInfo.color}`}>{rankInfo.label}</span>
              </div>
              {isNewHighScore && (
                <div className="absolute -top-2.5 -right-3 bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-md animate-bounce">
                  NEW RECORD!
                </div>
              )}
            </div>

            {/* Final Score */}
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Final Score</p>
              <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-pink-300 tabular-nums">
                {score.score.toLocaleString()}
              </p>
              {highScore > 0 && (
                <p className="text-white/40 text-[10px] mt-0.5">
                  Best ({difficulty}): {highScore.toLocaleString()}
                </p>
              )}
            </div>

            {/* Stats Breakdown Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <p className="text-white/40 text-[9px] font-bold uppercase">Max Streak</p>
                <p className="text-sm font-black text-amber-300 tabular-nums">{maxCombo}x</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <p className="text-white/40 text-[9px] font-bold uppercase">Accuracy</p>
                <p className="text-sm font-black text-emerald-400 tabular-nums">{score.accuracy.toFixed(0)}%</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <p className="text-white/40 text-[9px] font-bold uppercase">Hits / Miss</p>
                <p className="text-sm font-black text-white tabular-nums">{score.hits}/{score.misses}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleRestart}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-black text-white text-xs shadow-lg shadow-cyan-500/30 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                Exit to Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Controls Help Modal ── */}
      {showControlsModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#090d19] rounded-3xl border border-cyan-500/30 p-5 space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Controls & Aiming</span>
              </h3>
              <button
                onClick={() => setShowControlsModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-white/80 leading-relaxed">
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <p className="font-bold text-cyan-300 mb-0.5">🎯 1. Center Crosshair Aiming</p>
                <p className="text-[11px] text-white/60">
                  Move your phone (or drag on PC) to align the center crosshair onto incoming cubes. When locked on, the reticle turns green!
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <p className="font-bold text-pink-300 mb-0.5">⚡ 2. Tap to Burst</p>
                <p className="text-[11px] text-white/60">
                  Tap anywhere on the screen when locked on to shatter the cube on the beat! Tapping off-target will not burst cubes.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <p className="font-bold text-emerald-300 mb-0.5">🎵 3. Song Beat Synchronization</p>
                <p className="text-[11px] text-white/60">
                  Cubes travel and arrive at the hit line exactly on the musical beat. When the song ends, the stage clears and final score is shown!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold text-xs hover:bg-cyan-500/30 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
