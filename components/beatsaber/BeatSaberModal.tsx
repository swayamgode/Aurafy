"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Trophy,
  Zap,
  Heart,
  Target,
  AlertTriangle,
  RotateCcw,
  HelpCircle,
  Smartphone,
  MousePointer,
  Sparkles,
  Flame,
  Star,
  ShieldAlert,
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
        <div className="w-16 h-16 border-4 border-[#00f0ff] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/70 text-sm font-medium">Loading Beat Burst VR...</p>
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
    nextTrack,
    prevTrack,
  } = usePlayer();
  const { showToast } = useToast();

  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [score, setScore] = useState<ScoreUpdate>({
    score: 0,
    combo: 0,
    multiplier: 1,
    misses: 0,
    accuracy: 100,
  });
  const [hitFlash, setHitFlash] = useState(false);
  const [missFlash, setMissFlash] = useState(false);
  const [bpm] = useState(128);
  const [recenterCount, setRecenterCount] = useState(0);
  const [isGyroActive, setIsGyroActive] = useState(false);
  const [isGyroEnabled, setIsGyroEnabled] = useState(true); // 360 VR motion look enabled by default
  const [showControlsModal, setShowControlsModal] = useState(false);

  const hitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Close Guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setGameStarted(false);
      setScore({ score: 0, combo: 0, multiplier: 1, misses: 0, accuracy: 100 });
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
    setScore({ score: 0, combo: 0, multiplier: 1, misses: 0, accuracy: 100 });
    setGameStarted(true);
    setRecenterCount((c) => c + 1);
    if (!isPlaying) togglePlay();
    try {
      window._aurafyResume?.();
    } catch (_) {}
    showToast(`Beat Burst started — ${DIFFICULTY_LABELS[difficulty].label} mode!`, "success");
  };

  const handleRecenter = () => {
    setRecenterCount((c) => c + 1);
    showToast("VR view recentered!", "info");
  };

  // ── Game Engine Callbacks ─────────────────────────────────────────────────
  const handleScoreUpdate = useCallback((update: ScoreUpdate) => {
    setScore(update);
  }, []);

  const handleBlockHit = useCallback((isSpecial: boolean, _intensity: number) => {
    setHitFlash(true);
    if (hitTimer.current) clearTimeout(hitTimer.current);
    hitTimer.current = setTimeout(() => setHitFlash(false), isSpecial ? 220 : 140);
  }, []);

  const handleMiss = useCallback(() => {
    setMissFlash(true);
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => setMissFlash(false), 300);
  }, []);

  if (!isOpen) return null;

  const diff = DIFFICULTY_LABELS[difficulty];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#02040a] overflow-hidden select-none">

      {/* ── Visual Hit / Miss Flash Shimmers ── */}
      {hitFlash && (
        <div className="absolute inset-0 pointer-events-none z-30 border-[6px] border-[#00f0ff]/60 opacity-80 animate-pulse" />
      )}
      {missFlash && (
        <div className="absolute inset-0 pointer-events-none z-30 bg-red-600/10 border-[5px] border-red-500/50" />
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
              bpm={bpm}
              recenterTrigger={recenterCount}
              isGyroEnabled={isGyroEnabled}
              onGyroActive={setIsGyroActive}
            />
          </div>

          {/* Holographic Cyber Reticle Crosshair in Center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative flex items-center justify-center">
              <div className="w-9 h-9 rounded-full border border-cyan-400/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-sm shadow-cyan-400 animate-ping" />
              </div>
              <div className="absolute -top-1 w-0.5 h-2 bg-cyan-400/60" />
              <div className="absolute -bottom-1 w-0.5 h-2 bg-cyan-400/60" />
              <div className="absolute -left-1 h-0.5 w-2 bg-cyan-400/60" />
              <div className="absolute -right-1 h-0.5 w-2 bg-cyan-400/60" />
            </div>
          </div>

          {/* Mobile Tap Cue */}
          <div className="absolute inset-x-0 bottom-24 z-10 flex justify-center pointer-events-none opacity-40">
            <span className="text-[11px] font-bold text-cyan-300 px-3 py-1 rounded-full bg-black/50 border border-cyan-500/30">
              ⚡ Tap or Click incoming cubes to burst them!
            </span>
          </div>
        </>
      )}

      {/* ── Top HUD Bar ── */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-safe-top py-3 bg-gradient-to-b from-black/90 to-transparent">
        {/* Left: Close + Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15 hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
            aria-label="Close Beat Burst"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#00f0ff]" />
              <span className="text-white font-black text-sm tracking-widest uppercase">Beat Burst VR</span>
            </div>
            {currentTrack && (
              <p className="text-white/50 text-[10px] truncate max-w-[120px] sm:max-w-[200px]">
                {currentTrack.title} · {currentTrack.artist}
              </p>
            )}
          </div>
        </div>

        {/* Right: Controls + Camera toggle + Recenter + Difficulty badge */}
        <div className="flex items-center space-x-2">
          {gameStarted && (
            <>
              {/* VR Gyro / Steady Camera Toggle */}
              <button
                onClick={() => {
                  setIsGyroEnabled((prev) => !prev);
                  showToast(!isGyroEnabled ? "360° VR Gyro Look ON" : "Steady camera locked", "info");
                }}
                title="Toggle 360 VR Gyro vs Steady Camera"
                className={`px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  isGyroEnabled
                    ? "bg-cyan-500/30 border-cyan-400 text-cyan-200"
                    : "bg-white/10 border-white/15 text-white/60 hover:text-white"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>{isGyroEnabled ? "VR 360°" : "Steady"}</span>
              </button>

              {/* Recenter button */}
              {isGyroEnabled && (
                <button
                  onClick={handleRecenter}
                  title="Recenter VR Camera"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-90 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}

          {/* Controls button */}
          <button
            onClick={() => setShowControlsModal(true)}
            title="Controls & How to Play"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-90 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {gameStarted && (
            <div className={`px-2.5 py-1 rounded-full border ${diff.ring} bg-black/60 backdrop-blur-md`}>
              <span className={`text-[10px] font-black ${diff.color} uppercase tracking-wider`}>
                {diff.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Score HUD (In-Game Mode) ── */}
      {gameStarted && (
        <div className="relative z-10 flex items-start justify-between px-4 pointer-events-none">
          {/* Left score panel */}
          <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-3 min-w-[100px]">
            <div className="flex items-center space-x-1.5 mb-0.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Score</span>
            </div>
            <p className="text-white font-black text-xl tabular-nums leading-tight">
              {score.score.toLocaleString()}
            </p>
          </div>

          {/* Center: Combo + Multiplier */}
          <div className="flex flex-col items-center">
            <div className="bg-black/70 backdrop-blur-md rounded-2xl border border-cyan-400/20 px-4 py-2 text-center">
              <p className="text-cyan-300/70 text-[9px] font-bold uppercase tracking-widest">Combo</p>
              <p className={`font-black text-2xl leading-none tabular-nums ${
                score.combo > 40 ? "text-yellow-300" : score.combo > 15 ? "text-cyan-400" : "text-white"
              }`}>
                {score.combo}x
              </p>
            </div>
            {score.multiplier > 1 && (
              <div className="mt-1 flex items-center space-x-1 bg-cyan-600/80 rounded-full px-2 py-0.5 shadow-sm shadow-cyan-500">
                <Zap className="w-3 h-3 text-white" />
                <span className="text-white font-black text-xs">×{score.multiplier}</span>
              </div>
            )}
          </div>

          {/* Right: accuracy + misses */}
          <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-3 min-w-[90px] text-right">
            <div className="flex items-center justify-end space-x-1.5 mb-0.5">
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Acc</span>
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className={`font-black text-xl tabular-nums leading-tight ${
              score.accuracy >= 90 ? "text-emerald-400" : score.accuracy >= 70 ? "text-yellow-400" : "text-red-400"
            }`}>
              {score.accuracy.toFixed(0)}%
            </p>
            {score.misses > 0 && (
              <div className="flex items-center justify-end space-x-1 mt-1">
                <Heart className="w-3 h-3 text-red-400" />
                <span className="text-red-400 text-[10px] font-bold">{score.misses} miss</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Pre-Game Screen ── */}
      {!gameStarted && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 py-3 space-y-4 max-w-lg mx-auto w-full">

          {/* Hero Icon */}
          <div className="relative pt-2">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-pink-600 flex items-center justify-center shadow-2xl shadow-cyan-900/50">
              <Sparkles className="w-10 h-10 text-white" strokeWidth={1.75} />
            </div>
            <div className="absolute -inset-1.5 rounded-[1.5rem] border-2 border-cyan-400/40 animate-pulse" />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-white font-black text-2xl tracking-tight">Beat Burst 3D VR</h1>
            <p className="text-white/60 text-xs max-w-xs leading-relaxed mx-auto">
              Tap or click glowing crystal cubes to burst them to the song&apos;s beat! Move your phone to look around in 360° VR.
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
              <p className="text-white/60 text-xs">Play a song first from search or library to start bursting!</p>
            </div>
          )}

          {/* Cube Types & Mechanics Card */}
          <div className="w-full bg-white/[0.04] rounded-2xl border border-white/10 p-4 space-y-3">
            <span className="text-white font-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-cyan-400" />
              <span>Cubes & Rewards</span>
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-cyan-950/40 border border-cyan-400/30 p-2 space-y-0.5">
                <span className="text-base">💎</span>
                <p className="text-cyan-300 font-bold text-[11px]">Cyan / Pink</p>
                <p className="text-white/50 text-[10px]">+100 Pts</p>
              </div>
              <div className="rounded-xl bg-amber-950/40 border border-amber-400/30 p-2 space-y-0.5">
                <span className="text-base">🌟</span>
                <p className="text-amber-300 font-bold text-[11px]">Gold Star</p>
                <p className="text-white/50 text-[10px]">+300 Pts</p>
              </div>
              <div className="rounded-xl bg-red-950/40 border border-red-500/30 p-2 space-y-0.5">
                <span className="text-base">⚠️</span>
                <p className="text-red-300 font-bold text-[11px]">Hazard</p>
                <p className="text-white/50 text-[10px]">Don&apos;t Tap!</p>
              </div>
            </div>

            {/* VR feature note */}
            <div className="rounded-xl bg-indigo-950/30 border border-indigo-400/20 p-2.5 flex items-start space-x-2 text-left">
              <Smartphone className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-indigo-200 text-[11px] leading-relaxed">
                <strong className="text-white">360° VR Motion:</strong> Move your phone around in your hands to look anywhere in 3D! Tap incoming cubes on screen to burst them into neon crystal shards!
              </p>
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
                    className={`py-2 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border ${
                      difficulty === d
                        ? `${dl.ring} bg-white/10 ${dl.color}`
                        : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                    }`}
                  >
                    {dl.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            disabled={!currentTrack}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-pink-600 hover:from-cyan-400 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base tracking-wide transition-all active:scale-[0.98] shadow-2xl shadow-cyan-900/50 cursor-pointer flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Start Bursting in 3D VR</span>
          </button>
        </div>
      )}

      {/* ── Bottom Controls (In-Game Mode) ── */}
      {gameStarted && (
        <div className="relative z-10 mt-auto bg-gradient-to-t from-black/90 to-transparent pt-6 pb-safe-bottom pb-3 px-4">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            {/* Track info */}
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-white text-xs font-bold truncate">
                {currentTrack?.title ?? "—"}
              </p>
              <p className="text-white/40 text-[10px] truncate">{currentTrack?.artist ?? "—"}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={prevTrack}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all active:scale-90 cursor-pointer"
                aria-label="Previous track"
              >
                <SkipBack className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-900/50 hover:bg-cyan-400 transition-all active:scale-95 cursor-pointer"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-black fill-black" />
                ) : (
                  <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                )}
              </button>
              <button
                onClick={nextTrack}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all active:scale-90 cursor-pointer"
                aria-label="Next track"
              >
                <SkipForward className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => {
                  setGameStarted(false);
                  setScore({ score: 0, combo: 0, multiplier: 1, misses: 0, accuracy: 100 });
                }}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all active:scale-90 cursor-pointer"
                aria-label="Restart"
              >
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTROLS MODAL OVERLAY ── */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-[#080d1a] border border-cyan-400/30 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-black text-base">Beat Burst Controls</h3>
              </div>
              <button
                onClick={() => setShowControlsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-white/5 rounded-2xl p-3 space-y-1.5 border border-white/10">
                <p className="text-white font-black text-xs flex items-center space-x-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>On Mobile / Phone</span>
                </p>
                <ul className="text-white/70 space-y-1 list-disc list-inside">
                  <li><strong className="text-white">Move Phone:</strong> Tilt & turn to look left/right/up/down in 360° VR.</li>
                  <li><strong className="text-cyan-300">Tap Any Cube:</strong> Tap directly on incoming crystal cubes to shatter them!</li>
                  <li><strong className="text-yellow-400">Recenter View (🔄):</strong> Tap button in top bar to align camera forward.</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 space-y-1.5 border border-white/10">
                <p className="text-white font-black text-xs flex items-center space-x-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-pink-400" />
                  <span>On Laptop / Computer</span>
                </p>
                <ul className="text-white/70 space-y-1 list-disc list-inside">
                  <li><strong className="text-white">Click Cubes:</strong> Click any cube to burst it into shards.</li>
                  <li><strong className="text-white">Drag Mouse:</strong> Look around the 3D cyberpunk arena.</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 space-y-1 border border-white/10 text-white/70">
                <p className="text-white font-bold text-xs">🎯 Objectives</p>
                <p>• Burst cubes before they fly past you!</p>
                <p>• Avoid ⚠️ Hazard Orbs — clicking them breaks your combo!</p>
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-600 hover:from-cyan-400 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Ready to Burst!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
