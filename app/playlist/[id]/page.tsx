"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Share2,
  Music,
  ListPlus,
  Loader2,
} from "lucide-react";
import SongCard from "@/components/SongCard";
import AddSongsModal from "@/components/AddSongsModal";
import { usePlayer } from "@/lib/PlayerContext";
import { useToast } from "@/lib/ToastContext";
import { TRENDING_PLAYLISTS, searchYouTube } from "@/lib/youtube";
import { Track, Playlist } from "@/types/music";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const GUEST_USER_ID = "guest";

export default function PlaylistDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id || "";
  const playlistId = decodeURIComponent(rawId);

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { showToast } = useToast();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Safe Convex query & mutation
  let convexPlaylists: any[] = [];
  let addSongToPlaylistMut: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useQuery(api.playlists.getPlaylists, { userId: GUEST_USER_ID });
    if (q) convexPlaylists = q;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    addSongToPlaylistMut = useMutation(api.playlists.addSongToPlaylist);
  } catch {}

  // Load playlist data with multi-source fallback
  useEffect(() => {
    if (!playlistId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const loadPlaylistData = async () => {
      // 1. Check trending preset playlists
      const trending = TRENDING_PLAYLISTS.find(
        (p) => p.id === playlistId || p.id.toLowerCase() === playlistId.toLowerCase()
      );
      if (trending) {
        setPlaylist(trending);
        try {
          const stored = localStorage.getItem(`aurafy_playlist_${playlistId}`);
          if (stored) {
            setSongs(JSON.parse(stored));
            setIsLoading(false);
            return;
          }
        } catch {}
        setSongs([]);
        setIsLoading(false);
        return;
      }

      // 2. Check Convex user playlists
      const fromConvex = convexPlaylists.find(
        (p: any) => p._id === playlistId || p.id === playlistId
      );
      if (fromConvex) {
        const plObj: Playlist = {
          id: fromConvex._id || fromConvex.id,
          title: fromConvex.title,
          description: fromConvex.description || "Created with Aurafy",
          coverUrl: fromConvex.coverUrl,
          creator: fromConvex.creator || "You",
          songsCount: fromConvex.songsCount || 0,
        };
        setPlaylist(plObj);

        if (fromConvex.songs && fromConvex.songs.length > 0) {
          setSongs(fromConvex.songs);
          setIsLoading(false);
          return;
        }

        try {
          const stored = localStorage.getItem(`aurafy_playlist_${playlistId}`);
          if (stored) {
            setSongs(JSON.parse(stored));
            setIsLoading(false);
            return;
          }
        } catch {}

        setSongs([]);
        setIsLoading(false);
        return;
      }

      // 3. Check localStorage custom user playlists
      try {
        const storedList = localStorage.getItem("aurafy_user_playlists");
        if (storedList) {
          const userPlaylists: Playlist[] = JSON.parse(storedList);
          const match = userPlaylists.find(
            (p) => p.id === playlistId || (p as any)._id === playlistId
          );
          if (match) {
            setPlaylist(match);
            const storedSongs = localStorage.getItem(`aurafy_playlist_${playlistId}`);
            if (storedSongs) {
              setSongs(JSON.parse(storedSongs));
              setIsLoading(false);
              return;
            }
            if (match.songs && match.songs.length > 0) {
              setSongs(match.songs);
              setIsLoading(false);
              return;
            }
          }
        }

        const storedSongs = localStorage.getItem(`aurafy_playlist_${playlistId}`);
        if (storedSongs) {
          const parsedSongs = JSON.parse(storedSongs);
          if (parsedSongs.length > 0) {
            setPlaylist({
              id: playlistId,
              title: "Custom Mix",
              description: "Your saved songs",
              coverUrl: parsedSongs[0]?.thumbnailUrl,
              creator: "You",
              songsCount: parsedSongs.length,
            });
            setSongs(parsedSongs);
            setIsLoading(false);
            return;
          }
        }
      } catch {}

      // 4. Handle dynamic search playlists (e.g. "pl-lofi", "pl-rock", "pl-synthwave")
      const cleanTerm = playlistId
        .replace(/^pl-/, "")
        .replace(/^artist-/, "")
        .replace(/-/g, " ")
        .trim();

      if (cleanTerm) {
        const titleFormatted = cleanTerm.charAt(0).toUpperCase() + cleanTerm.slice(1);
        try {
          const searchRes = await searchYouTube(cleanTerm);
          const matchedSongs = searchRes.songs;
          setPlaylist({
            id: playlistId,
            title: `${titleFormatted} Mix`,
            description: `Best tracks curated for ${cleanTerm}`,
            coverUrl: matchedSongs[0]?.thumbnailUrl || "/cover-placeholder.png",
            creator: "Aurafy Mix",
            songsCount: matchedSongs.length,
          });
          setSongs(matchedSongs);
          setIsLoading(false);
          return;
        } catch {}
      }

      // 5. Ultimate Fallback - empty playlist
      setPlaylist({
        id: playlistId,
        title: "Playlist",
        description: "Add songs to get started",
        coverUrl: "/cover-placeholder.png",
        creator: "You",
        songsCount: 0,
      });
      setSongs([]);
      setIsLoading(false);
    };

    loadPlaylistData();
  }, [playlistId, convexPlaylists]);

  const handlePlayAll = () => {
    if (songs.length === 0) {
      showToast("Playlist is empty. Add songs first!", "info");
      return;
    }
    playTrack(songs[0], songs);
  };

  const handleRemoveSong = (index: number) => {
    const songToRemove = songs[index];
    const updated = songs.filter((_, i) => i !== index);
    setSongs(updated);
    try {
      localStorage.setItem(`aurafy_playlist_${playlistId}`, JSON.stringify(updated));
    } catch {}
    if (songToRemove) {
      showToast(`Removed "${songToRemove.title}" from playlist`, "info");
    }
  };

  const handleToggleSong = async (track: Track) => {
    const exists = songs.some((s) => s.youtubeId === track.youtubeId);
    let updated: Track[];
    if (exists) {
      updated = songs.filter((s) => s.youtubeId !== track.youtubeId);
    } else {
      updated = [...songs, track];
    }
    setSongs(updated);

    try {
      localStorage.setItem(`aurafy_playlist_${playlistId}`, JSON.stringify(updated));
    } catch {}

    if (!exists && addSongToPlaylistMut && !playlistId.startsWith("pl-") && !playlistId.startsWith("user-pl-")) {
      try {
        await addSongToPlaylistMut({
          playlistId: playlistId as any,
          youtubeId: track.youtubeId,
          title: track.title,
          artist: track.artist,
          thumbnailUrl: track.thumbnailUrl,
          duration: track.duration,
        });
      } catch {}
    }
  };

  const isPlaylistPlaying =
    isPlaying && currentTrack && songs.some((s) => s.youtubeId === currentTrack.youtubeId);

  const coverUrl =
    playlist?.coverUrl ||
    songs[0]?.thumbnailUrl ||
    "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop";

  return (
    <div className="min-h-screen pb-36 bg-[#F8F9FA]">
      {/* Top sticky navigation */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3.5 bg-[#F8F9FA]/90 backdrop-blur-md border-b border-[#E3E4E6]">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center text-black hover:bg-[#E3E4E6] active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <h1 className="text-sm font-bold text-black truncate max-w-[200px]">
          {playlist?.title || "Playlist"}
        </h1>

        <button
          onClick={() => showToast("Link copied to clipboard!", "info")}
          aria-label="Share playlist"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#5F6368] hover:bg-[#E3E4E6] active:scale-95 transition-all cursor-pointer"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#D7192F]" />
          <p className="text-xs font-bold text-[#5F6368]">Loading playlist...</p>
        </div>
      ) : (
        <div className="px-5 sm:px-6 space-y-6 mt-4 max-w-2xl mx-auto">
          {/* Playlist Hero Banner */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 bg-white p-5 rounded-3xl border border-[#E3E4E6] shadow-sm">
            <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-[#F1F2F3] shrink-0 shadow-md">
              <Image
                src={coverUrl}
                alt={playlist?.title || "Playlist Cover"}
                fill
                sizes="176px"
                priority
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D7192F]">
                PLAYLIST
              </span>
              <h2 className="text-2xl font-black text-black tracking-tight leading-tight">
                {playlist?.title || "My Playlist"}
              </h2>
              <p className="text-xs text-[#5F6368] line-clamp-2">
                {playlist?.description || "Created with Aurafy"}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-[#8A8D91] font-semibold">
                <span>{playlist?.creator || "You"}</span>
                <span>•</span>
                <span>{songs.length} {songs.length === 1 ? "track" : "tracks"}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePlayAll}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#D7192F] text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-md active:scale-98 hover:bg-red-700 transition-all cursor-pointer"
            >
              {isPlaylistPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-white" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                  <span>PLAY ALL</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="py-3.5 px-5 rounded-2xl bg-white border border-[#E3E4E6] text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:bg-[#F1F2F3] active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D7192F]" />
              <span>ADD SONGS</span>
            </button>
          </div>

          {/* Songs List */}
          <section aria-label="Playlist Songs" className="space-y-3 pt-1">
            {songs.length === 0 ? (
              <div className="py-14 text-center text-[#8A8D91] space-y-3 bg-white rounded-3xl border border-[#E3E4E6] p-6">
                <Music className="w-12 h-12 mx-auto text-[#8A8D91]/50" />
                <p className="text-sm font-bold text-black">No songs in this playlist yet</p>
                <p className="text-xs text-[#5F6368]">
                  Tap &ldquo;Add Songs&rdquo; to browse downloaded songs or search songs to add.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-[#D7192F] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Songs</span>
                </button>
              </div>
            ) : (
              songs.map((song, idx) => (
                <SongCard
                  key={`${song.youtubeId}-${idx}`}
                  track={song}
                  variant="playlist"
                  onRemove={() => handleRemoveSong(idx)}
                />
              ))
            )}
          </section>
        </div>
      )}

      {/* Add Songs Modal */}
      <AddSongsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedSongs={songs}
        onToggleSong={handleToggleSong}
      />
    </div>
  );
}
