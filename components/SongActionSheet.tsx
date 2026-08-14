"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Play,
  ListPlus,
  Clock,
  Heart,
  X,
  ChevronRight,
  Check,
  PlusCircle,
} from "lucide-react";
import { Track } from "@/types/music";
import { usePlayer } from "@/lib/PlayerContext";
import { useToast } from "@/lib/ToastContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const GUEST_USER_ID = "guest";

interface SongActionSheetProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
}

interface LocalPlaylist {
  _id: string;
  title: string;
  coverUrl?: string;
  songsCount?: number;
}

const DEFAULT_PLAYLISTS: LocalPlaylist[] = [
  {
    _id: "pl-chill",
    title: "Chill Vibes",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400&auto=format&fit=crop",
    songsCount: 12,
  },
  {
    _id: "pl-focus",
    title: "Deep Focus & Study",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop",
    songsCount: 18,
  },
  {
    _id: "pl-workout",
    title: "High Energy Beats",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop",
    songsCount: 24,
  },
];

type SheetView = "main" | "playlists";

export default function SongActionSheet({
  track,
  isOpen,
  onClose,
}: SongActionSheetProps) {
  const { playTrack, addToQueue } = usePlayer();
  const { showToast } = useToast();
  const [view, setView] = useState<SheetView>("main");
  const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(null);
  const [addedToPlaylistIds, setAddedToPlaylistIds] = useState<Set<string>>(new Set());
  const overlayRef = useRef<HTMLDivElement>(null);

  // Safe Convex query
  let convexPlaylists: any[] = [];
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useQuery(api.playlists.getPlaylists, { userId: GUEST_USER_ID });
    if (q) convexPlaylists = q;
  } catch {
    // Fallback if Convex is offline
  }

  // Safe Convex mutations
  let addToListenLaterMut: any = null;
  let addSongToPlaylistMut: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    addToListenLaterMut = useMutation(api.listenLater.addToListenLater);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    addSongToPlaylistMut = useMutation(api.playlists.addSongToPlaylist);
  } catch {
    // Fallback
  }

  const [localUserPlaylists, setLocalUserPlaylists] = useState<LocalPlaylist[]>([]);

  // Sync localStorage custom playlists whenever sheet opens
  useEffect(() => {
    if (isOpen) {
      setView("main");
      setAddedToPlaylistIds(new Set());
      try {
        const stored = localStorage.getItem("aurafy_user_playlists");
        if (stored) {
          const parsed = JSON.parse(stored);
          setLocalUserPlaylists(
            parsed.map((p: any) => ({
              _id: p.id || p._id,
              title: p.title,
              coverUrl: p.coverUrl,
              songsCount: p.songsCount ?? p.songs?.length ?? 0,
            }))
          );
        }
      } catch {}
    }
  }, [isOpen]);

  // Combined playlist list: user playlists + convex playlists + presets
  const allPlaylists: LocalPlaylist[] = [
    ...localUserPlaylists,
    ...(convexPlaylists.length > 0
      ? convexPlaylists
          .filter((cp: any) => !localUserPlaylists.some((lp) => lp._id === (cp._id || cp.id)))
          .map((p: any) => ({
            _id: p._id?.toString() || p.id,
            title: p.title,
            coverUrl: p.coverUrl,
            songsCount: p.songsCount ?? 0,
          }))
      : DEFAULT_PLAYLISTS.filter((dp) => !localUserPlaylists.some((lp) => lp._id === dp._id))),
  ];

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on swipe down
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta > 60) onClose();
    touchStartY.current = null;
  };

  const handlePlayNow = () => {
    playTrack(track);
    onClose();
  };

  const handleAddToQueue = () => {
    addToQueue(track);
    showToast(`Added "${track.title}" to queue`, "queue");
    onClose();
  };

  const handleListenLater = async () => {
    // Local storage persistence
    try {
      const stored = localStorage.getItem("aurafy_listen_later");
      const list: Track[] = stored ? JSON.parse(stored) : [];
      if (!list.some((item) => item.youtubeId === track.youtubeId)) {
        list.unshift(track);
        localStorage.setItem("aurafy_listen_later", JSON.stringify(list));
      }
    } catch {}

    // Convex mutation if available
    if (addToListenLaterMut) {
      try {
        await addToListenLaterMut({
          userId: GUEST_USER_ID,
          youtubeId: track.youtubeId,
          title: track.title,
          artist: track.artist,
          thumbnailUrl: track.thumbnailUrl,
          duration: track.duration,
        });
      } catch {}
    }

    showToast(`Saved "${track.title}" to Listen Later`, "success");
    onClose();
  };

  const handleAddToPlaylist = async (playlist: LocalPlaylist) => {
    const pid = playlist._id;
    if (addedToPlaylistIds.has(pid)) return;
    setAddingToPlaylistId(pid);

    // Save to local storage
    try {
      const key = `aurafy_playlist_${pid}`;
      const stored = localStorage.getItem(key);
      const list: Track[] = stored ? JSON.parse(stored) : [];
      if (!list.some((item) => item.youtubeId === track.youtubeId)) {
        list.push(track);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch {}

    // Save to Convex if supported
    if (addSongToPlaylistMut && !pid.startsWith("pl-")) {
      try {
        await addSongToPlaylistMut({
          playlistId: pid as any,
          youtubeId: track.youtubeId,
          title: track.title,
          artist: track.artist,
          thumbnailUrl: track.thumbnailUrl,
          duration: track.duration,
        });
      } catch {}
    }

    showToast(`Added to "${playlist.title}"`, "success");
    setAddedToPlaylistIds((prev) => new Set(prev).add(pid));
    setAddingToPlaylistId(null);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[70] flex items-end"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full rounded-t-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          animation: "slideUp 0.28s cubic-bezier(0.32,0.72,0,1)",
          maxHeight: "82vh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#E3E4E6]" />
        </div>

        {/* Track info header */}
        <div className="flex items-center space-x-3.5 px-5 py-3 border-b border-[#F1F2F3]">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
            <Image
              src={track.thumbnailUrl}
              alt={track.title}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#111111] truncate">{track.title}</p>
            <p className="text-xs text-[#5F6368] truncate mt-0.5">{track.artist}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F1F2F3] hover:bg-[#E3E4E6] transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-[#5F6368]" />
          </button>
        </div>

        {/* ── Main Actions View ── */}
        {view === "main" && (
          <div className="py-2 px-2">
            <ActionRow
              icon={<Play className="w-5 h-5 fill-[#111111] text-[#111111]" />}
              label="Play Now"
              onClick={handlePlayNow}
            />
            <ActionRow
              icon={<ListPlus className="w-5 h-5 text-[#111111]" />}
              label="Add to Queue"
              onClick={handleAddToQueue}
            />
            <ActionRow
              icon={<PlusCircle className="w-5 h-5 text-[#D7192F]" />}
              label="Add to Playlist"
              onClick={() => setView("playlists")}
              chevron
              labelColor="text-[#D7192F]"
            />
            <ActionRow
              icon={<Clock className="w-5 h-5 text-[#5F6368]" />}
              label="Listen Later"
              onClick={handleListenLater}
            />
            <ActionRow
              icon={<Heart className="w-5 h-5 text-[#D7192F]" />}
              label="Add to Favourites"
              onClick={() => {
                showToast(`Saved "${track.title}" to Favourites`, "favorite");
                onClose();
              }}
            />
          </div>
        )}

        {/* ── Playlist Picker View ── */}
        {view === "playlists" && (
          <div className="py-2 px-2">
            {/* Back button */}
            <button
              onClick={() => setView("main")}
              className="flex items-center space-x-2 px-3 py-2.5 mb-1 text-[#5F6368] hover:text-[#111111] transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="text-sm font-semibold">Choose a Playlist</span>
            </button>

            {allPlaylists.map((pl) => {
              const pid = pl._id;
              const isAdded = addedToPlaylistIds.has(pid);
              const isAdding = addingToPlaylistId === pid;
              return (
                <button
                  key={pid}
                  onClick={() => handleAddToPlaylist(pl)}
                  disabled={isAdded || isAdding}
                  className="w-full flex items-center space-x-3.5 px-3 py-3 rounded-2xl hover:bg-[#F8F9FA] active:bg-[#F1F2F3] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {/* Playlist thumbnail */}
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-[#F1F2F3]">
                    {pl.coverUrl ? (
                      <Image src={pl.coverUrl} alt={pl.title} fill sizes="44px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#D7192F] to-rose-400 flex items-center justify-center">
                        <ListPlus className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-semibold text-[#111111] truncate">{pl.title}</p>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      {pl.songsCount ?? 0} {pl.songsCount === 1 ? "song" : "songs"}
                    </p>
                  </div>
                  <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center">
                    {isAdded ? (
                      <Check className="w-5 h-5 text-[#D7192F]" />
                    ) : isAdding ? (
                      <div className="w-4 h-4 border-2 border-[#D7192F] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <PlusCircle className="w-5 h-5 text-[#D7192F]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom safe area */}
        <div className="h-6" />
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Reusable action row ──
function ActionRow({
  icon,
  label,
  onClick,
  chevron = false,
  labelColor = "text-[#111111]",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  chevron?: boolean;
  labelColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center space-x-3.5 px-3 py-3.5 rounded-2xl hover:bg-[#F8F9FA] active:bg-[#F1F2F3] transition-colors cursor-pointer"
    >
      <div className="w-8 h-8 rounded-xl bg-[#F1F2F3] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className={`text-sm font-semibold flex-1 text-left ${labelColor}`}>{label}</span>
      {chevron && <ChevronRight className="w-4 h-4 text-[#8A8D91]" />}
    </button>
  );
}
