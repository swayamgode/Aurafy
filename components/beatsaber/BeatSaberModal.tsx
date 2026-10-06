"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sword,
  Trophy,
  Zap,
  Heart,
  Target,
  ChevronUp,
  AlertTriangle,
  Gamepad2,
  RotateCcw,
  HelpCircle,
  Smartphone,
  MousePointer,
  Sparkles,
} from "lucide-react";
import { usePlayer } from "@/lib/PlayerContext";
import { useToast } from "@/lib/ToastContext";
import dynamic from "next/dynamic";
import type { Difficulty, ScoreUpdate } from "./BeatSaberGame";

// Dynamically import the Three.js game (client-only)
const BeatSaberGame = dynamic(() => import("./BeatSaberGame"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#030508]">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 border-4 border-[#D7192F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/70 text-sm font-medium">Loading Beat Saber...</p>
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
  normal: { label: "Normal", color: "text-yellow-400",  ring: "border-yellow-400" },
  hard:   { label: "Hard",   color: "text-orange-400",  ring: "border-orange-400" },
  expert: { label: "Expert", color: "text-red-400",     ring: "border-red-500" },
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

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
  const [hitFlashLeft, setHitFlashLeft] = useState(false);
  const [hitFlashRight, setHitFlashRight] = useState(false);
  const [missFlash, setMissFlash] = useState(false);
  const [showGyroTip, setShowGyroTip] = useState(false);
  const [bpm] = useState(128); // Default; beat detector updates this
  const [recenterCount, setRecenterCount] = useState(0);
  const [isGyroActive, setIsGyroActive] = useState(false);
  const [isGyroEnabled, setIsGyroEnabled] = useState(false); // Default steady camera for effortless phone play
  const [slashLeftCount, setSlashLeftCount] = useState(0);
  const [slashRightCount, setSlashRightCount] = useState(0);
  const [showControlsModal, setShowControlsModal] = useState(false);

  const hitTimerLeft = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hitTimerRight = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Close guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setGameStarted(false);
      setScore({ score: 0, combo: 0, multiplier: 1, misses: 0, accuracy: 100 });
      setShowControlsModal(false);
    }
  }, [isOpen]);

  // ── Detect gyro availability ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const hasGyro = typeof window !== "undefined" && "DeviceOrientationEvent" in window;
    setShowGyroTip(hasGyro);
  }, [isOpen]);

  // ── Request Gyroscope permission (iOS Safari required gesture) ────────────
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

  // ── Start game ────────────────────────────────────────────────────────────
  const handleStartGame = async () => {
    if (!currentTrack) {
      showToast("Play a song first to start Beat Saber!", "info");
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
    showToast(`Beat Saber started — ${DIFFICULTY_LABELS[difficulty].label} mode!`, "success");
  };

  // ── Recenter VR camera ────────────────────────────────────────────────────
  const handleRecenter = () => {
    setRecenterCount((c) => c + 1);
    showToast("VR look recentered!", "info");
  };

  // ── Callbacks from game engine ────────────────────────────────────
  const handleScoreUpdate = useCallback((update: ScoreUpdate) => {
    setScore(update);
  }, []);

  const handleBlockHit = useCallback((isLeft: boolean, _intensity: number) => {
    if (isLeft) {
      setHitFlashLeft(true);
      if (hitTimerLeft.current) clearTimeout(hitTimerLeft.current);
      hitTimerLeft.current = setTimeout(() => setHitFlashLeft(false), 180);
    } else {
      setHitFlashRight(true);
      if (hitTimerRight.current) clearTimeout(hitTimerRight.current);
      hitTimerRight.current = setTimeout(() => setHitFlashRight(false), 180);
    }
  }, []);

  const handleMiss = useCallback(() => {
    setMissFlash(true);
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => setMissFlash(false), 350);
  }, []);

  if (!isOpen) return null;

  const diff = DIFFICULTY_LABELS[difficulty];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#030508] overflow-hidden">

      {/* ── Hit Flash Borders ── */}
      {hitFlashLeft && (
        <div className="absolute inset-0 pointer-events-none z-30 border-[6px] border-[#D7192F] rounded-none opacity-80 animate-pulse" />
      )}
      {hitFlashRight && (
        <div className="absolute inset-0 pointer-events-none z-30 border-[6px] border-[#00b4ff] rounded-none opacity-80 animate-pulse" />
      )}
      {missFlash && (
        <div className="absolute inset-0 pointer-events-none z-30 bg-white/5 border-[4px] border-white/30" />
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
              slashLeftTrigger={slashLeftCount}
              slashRightTrigger={slashRightCount}
            />
          </div>

          {/* Arcade Tap Buttons on Phone — 100x simpler & more fun */}
          <div className="absolute inset-x-0 bottom-24 z-20 flex justify-between gap-3 px-4 pointer-events-auto">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setSlashLeftCount((c) => c + 1);
              }}
              onMouseDown={() => setSlashLeftCount((c) => c + 1)}
              className="flex-1 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-red-600/40 to-red-500/20 active:from-red-600/70 border-2 border-red-500/40 active:border-red-400 backdrop-blur-md transition-all active:scale-95 shadow-lg shadow-red-950/50 select-none cursor-pointer flex items-center justify-center space-x-2"
            >
              <span className="text-xl">🔴</span>
              <span className="text-white font-black text-xs sm:text-sm tracking-wider uppercase">Tap Red</span>
            </button>
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setSlashRightCount((c) => c + 1);
              }}
              onMouseDown={() => setSlashRightCount((c) => c + 1)}
              className="flex-1 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/40 active:from-blue-600/70 border-2 border-cyan-400/40 active:border-cyan-300 backdrop-blur-md transition-all active:scale-95 shadow-lg shadow-cyan-950/50 select-none cursor-pointer flex items-center justify-center space-x-2"
            >
              <span className="text-white font-black text-xs sm:text-sm tracking-wider uppercase">Tap Blue</span>
              <span className="text-xl">🔵</span>
            </button>
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
            aria-label="Close Beat Saber"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <Sword className="w-4 h-4 text-[#D7192F]" />
              <span className="text-white font-black text-sm tracking-widest uppercase">Beat Saber</span>
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
              {/* Camera mode toggle (Steady vs VR Gyro) */}
              <button
                onClick={() => {
                  setIsGyroEnabled((prev) => !prev);
                  showToast(!isGyroEnabled ? "VR Gyro look ON" : "Steady camera locked", "info");
                }}
                title="Toggle VR Gyro vs Steady Camera"
                className={`px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  isGyroEnabled
                    ? "bg-indigo-500/30 border-indigo-400 text-indigo-300"
                    : "bg-white/10 border-white/15 text-white/60 hover:text-white"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>{isGyroEnabled ? "VR Gyro" : "Steady"}</span>
              </button>

              {/* Recenter button if gyro is on */}
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

          {/* How to play / controls button */}
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

      {/* ── Score HUD (game mode) ── */}
      {gameStarted && (
        <div className="relative z-10 flex items-start justify-between px-4 pointer-events-none">
          {/* Left score panel */}
          <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-3 min-w-[110px]">
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
            <div className="bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 px-4 py-2 text-center">
              <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest">Combo</p>
              <p className={`font-black text-2xl leading-none tabular-nums ${
                score.combo > 50 ? "text-yellow-300" : score.combo > 20 ? "text-orange-400" : "text-white"
              }`}>
                {score.combo}x
              </p>
            </div>
            {score.multiplier > 1 && (
              <div className="mt-1 flex items-center space-x-1 bg-[#D7192F]/80 rounded-full px-2 py-0.5">
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
                <Heart className="w-3 h-3 text-red-400" style={{ strokeDasharray: 0 }} />
                <span className="text-red-400 text-[10px] font-bold">{score.misses} miss</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Pre-game Screen ── */}
      {!gameStarted && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 py-4 space-y-5 max-w-lg mx-auto w-full">

          {/* Hero icon */}
          <div className="relative pt-2">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D7192F] to-[#8b000f] flex items-center justify-center shadow-2xl shadow-red-900/50">
              <Sword className="w-10 h-10 text-white" strokeWidth={1.75} />
            </div>
            <div className="absolute -inset-1.5 rounded-[1.5rem] border-2 border-[#D7192F]/40 animate-pulse" />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-white font-black text-2xl tracking-tight">Beat Saber VR</h1>
            <p className="text-white/60 text-xs max-w-xs leading-relaxed mx-auto">
              Slash blocks to the beat in full 3D! Move your phone to look around in VR or use your thumbs & mouse.
            </p>
          </div>

          {/* Current song display */}
          {currentTrack ? (
            <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-3 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                {currentTrack.thumbnailUrl ? (
                  <img src={currentTrack.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sword className="w-5 h-5 text-white/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm truncate">{currentTrack.title}</p>
                <p className="text-white/50 text-xs truncate">{currentTrack.artist}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="w-full bg-white/5 rounded-2xl border border-white/10 p-3.5 flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <p className="text-white/60 text-xs">Play a song first from search or library to start slashing!</p>
            </div>
          )}

          {/* ── HOW CONTROLS WORK (Interactive Visual Guide) ── */}
          <div className="w-full bg-white/[0.04] rounded-2xl border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-black text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Gamepad2 className="w-4 h-4 text-[#D7192F]" />
                <span>How Controls Work</span>
              </span>
              <span className="text-white/40 text-[10px] font-medium">VR Motion Ready</span>
            </div>

            {/* Split Sabers diagram */}
            <div className="grid grid-cols-2 gap-2">
              {/* Left red saber */}
              <div className="rounded-xl bg-red-950/40 border border-red-500/30 p-2.5 space-y-1 text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D7192F] shadow-sm shadow-red-500" />
                  <span className="text-red-300 font-black text-xs uppercase">Left Saber</span>
                </div>
                <p className="text-white/70 text-[11px] leading-snug">
                  <span className="text-red-400 font-bold">Touch Left half</span> of phone screen or press <kbd className="px-1 py-0.5 rounded bg-black/60 border border-white/20 text-white font-mono text-[9px]">A</kbd> / <kbd className="px-1 py-0.5 rounded bg-black/60 border border-white/20 text-white font-mono text-[9px]">←</kbd>
                </p>
                <p className="text-red-400/90 text-[10px] font-semibold">⚡ Slices RED blocks</p>
              </div>

              {/* Right blue saber */}
              <div className="rounded-xl bg-cyan-950/40 border border-cyan-500/30 p-2.5 space-y-1 text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00b4ff] shadow-sm shadow-cyan-400" />
                  <span className="text-cyan-300 font-black text-xs uppercase">Right Saber</span>
                </div>
                <p className="text-white/70 text-[11px] leading-snug">
                  <span className="text-cyan-400 font-bold">Touch Right half</span> of phone screen or press <kbd className="px-1 py-0.5 rounded bg-black/60 border border-white/20 text-white font-mono text-[9px]">D</kbd> / <kbd className="px-1 py-0.5 rounded bg-black/60 border border-white/20 text-white font-mono text-[9px]">→</kbd>
                </p>
                <p className="text-cyan-400/90 text-[10px] font-semibold">⚡ Slices BLUE blocks</p>
              </div>
            </div>

            {/* VR Look note */}
            <div className="rounded-xl bg-indigo-950/30 border border-indigo-400/20 p-2.5 flex items-start space-x-2 text-left">
              <Smartphone className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-indigo-200 text-[11px] leading-relaxed">
                <span className="font-bold text-white">360° Phone VR Look:</span> Move and tilt your phone around in your hands — the camera looks left, right, up, down just like a real VR headset!
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
            className="w-full py-3.5 rounded-2xl bg-[#D7192F] hover:bg-[#bf1428] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base tracking-wide transition-all active:scale-[0.98] shadow-2xl shadow-red-900/50 cursor-pointer flex items-center justify-center space-x-2"
          >
            <Sword className="w-5 h-5" />
            <span>Start Slashing in VR</span>
          </button>
        </div>
      )}

      {/* ── Bottom Controls (game mode) ── */}
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
                className="w-10 h-10 rounded-full bg-[#D7192F] flex items-center justify-center shadow-lg shadow-red-900/50 hover:bg-[#bf1428] transition-all active:scale-95 cursor-pointer"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white fill-white" />
                ) : (
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
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
          <div className="bg-[#0b0e17] border border-white/20 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sword className="w-5 h-5 text-[#D7192F]" />
                <h3 className="text-white font-black text-base">Beat Saber Controls</h3>
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
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>On Mobile / Phone</span>
                </p>
                <ul className="text-white/70 space-y-1 list-disc list-inside">
                  <li><strong className="text-white">Move Phone:</strong> Tilt & turn to look left/right/up/down in full 360° VR.</li>
                  <li><strong className="text-red-400">Left Thumb:</strong> Touch/Swipe left half to swing Red Saber.</li>
                  <li><strong className="text-cyan-400">Right Thumb:</strong> Touch/Swipe right half to swing Blue Saber.</li>
                  <li><strong className="text-yellow-400">Recenter Button (🔄):</strong> Tap in top bar anytime to reset view!</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 space-y-1.5 border border-white/10">
                <p className="text-white font-black text-xs flex items-center space-x-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>On Laptop / Computer</span>
                </p>
                <ul className="text-white/70 space-y-1 list-disc list-inside">
                  <li><strong className="text-white">Mouse Movement:</strong> Slide sabers across lanes.</li>
                  <li><strong className="text-red-400">A / ← Key:</strong> Slash Left Red Saber.</li>
                  <li><strong className="text-cyan-400">D / → Key:</strong> Slash Right Blue Saber.</li>
                  <li><strong className="text-yellow-400">Spacebar:</strong> Dual Power Slash!</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 space-y-1 border border-white/10 text-white/70">
                <p className="text-white font-bold text-xs">🎯 Golden Rules</p>
                <p>• Match colors: Red cuts Red, Blue cuts Blue.</p>
                <p>• Avoid 💣 bombs — hitting them loses combo!</p>
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#D7192F] hover:bg-[#bf1428] text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
