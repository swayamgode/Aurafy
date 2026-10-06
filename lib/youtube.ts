import { Track, SearchResult, Artist, Playlist } from "@/types/music";

// Curated featured mock data with valid YouTube IDs
export const FEATURED_ALBUM = {
  id: "featured-1",
  title: "Solar Echoes",
  artist: "Synthetic Collective",
  coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop",
  tag: "TRENDING ALBUM",
  youtubeId: "jfKfPfyJRdk",
  duration: 245,
};

export const RECENTLY_PLAYED_INITIAL: Track[] = [
  {
    youtubeId: "jfKfPfyJRdk",
    title: "Lofi Hip Hop Radio - Beats to Relax/Study to",
    artist: "Lofi Girl",
    thumbnailUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400&auto=format&fit=crop",
    duration: 180,
  },
  {
    youtubeId: "5qap5aO4i9A",
    title: "Midnight Thoughts",
    artist: "Lofi Sleepy",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop",
    duration: 215,
  },
  {
    youtubeId: "DWcJFNfaw9c",
    title: "Focus State",
    artist: "Deep Focus Collective",
    thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop",
    duration: 240,
  },
  {
    youtubeId: "4xDzrJKXOOY",
    title: "Rainy Window",
    artist: "Acoustic Dreams",
    thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&auto=format&fit=crop",
    duration: 195,
  },
  {
    youtubeId: "9bZkp7q19f0",
    title: "System Overload",
    artist: "Glitch Mob",
    thumbnailUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400&auto=format&fit=crop",
    duration: 230,
  },
];

export const FAVOURITE_ARTISTS: Artist[] = [
  {
    id: "art-1",
    name: "Synthetic Collective",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
    genre: "Synthwave",
  },
  {
    id: "art-2",
    name: "Luna Ray",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
    genre: "Indie Pop",
  },
  {
    id: "art-3",
    name: "Low Voltage",
    imageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=300&auto=format&fit=crop",
    genre: "Electronic",
  },
  {
    id: "art-4",
    name: "The Architect",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
    genre: "Ambient",
  },
  {
    id: "art-5",
    name: "Crimson Echo",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop",
    genre: "Alternative",
  },
];

export const TRENDING_PLAYLISTS: Playlist[] = [
  {
    id: "pl-1",
    title: "Morning Rush",
    description: "Upbeat tracks to ignite your morning energy",
    coverUrl: "/banners/1.png",
    creator: "Hue Editorial",
    songsCount: 34,
  },
  {
    id: "pl-2",
    title: "Lofi Nights",
    description: "Chill beats for late night relaxation & code",
    coverUrl: "/banners/2.png",
    creator: "Lofi Club",
    songsCount: 48,
  },
  {
    id: "pl-3",
    title: "Hip-Hop Essentials",
    description: "Definitive hip-hop bangers and modern classics",
    coverUrl: "/banners/3.png",
    creator: "Urban Wave",
    songsCount: 50,
  },
  {
    id: "pl-4",
    title: "Acoustic Soul",
    description: "Raw acoustic vibes and soulful melodies",
    coverUrl: "/banners/4.png",
    creator: "Hue Editorial",
    songsCount: 28,
  },
  {
    id: "pl-5",
    title: "Electronic Dreams",
    description: "Synthwave, house, and electronic bangers",
    coverUrl: "/banners/5.png",
    creator: "Electric Crew",
    songsCount: 42,
  },
  {
    id: "pl-6",
    title: "Indie Discoveries",
    description: "Underground indie gems you haven't heard yet",
    coverUrl: "/banners/6.png",
    creator: "Indie Collective",
    songsCount: 36,
  },
  {
    id: "pl-7",
    title: "R&B Smooth",
    description: "Smooth R&B for every mood and vibe",
    coverUrl: "/banners/7.png",
    creator: "Soul Station",
    songsCount: 55,
  },
  {
    id: "pl-8",
    title: "Focus Flow",
    description: "Deep focus music for work and study sessions",
    coverUrl: "/banners/8.png",
    creator: "Hue Editorial",
    songsCount: 60,
  },
  {
    id: "pl-9",
    title: "Chill Evenings",
    description: "Wind down with these mellow evening tracks",
    coverUrl: "/banners/9.png",
    creator: "Sunset Radio",
    songsCount: 31,
  },
];

export const FOR_YOU_SONGS: Track[] = [
  {
    youtubeId: "5qap5aO4i9A",
    title: "ELEKTRO",
    artist: "Low Voltage",
    thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop",
    duration: 263,
    album: "Low Voltage EP",
  },
  {
    youtubeId: "DWcJFNfaw9c",
    title: "Neon Nights",
    artist: "Synthwave Collective",
    thumbnailUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&auto=format&fit=crop",
    duration: 228,
    album: "Cyber Skyline",
  },
  {
    youtubeId: "4xDzrJKXOOY",
    title: "Golden Hour",
    artist: "Luna Ray",
    thumbnailUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400&auto=format&fit=crop",
    duration: 210,
    album: "Solaris",
  },
  {
    youtubeId: "jfKfPfyJRdk",
    title: "Structure",
    artist: "The Architect",
    thumbnailUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400&auto=format&fit=crop",
    duration: 285,
    album: "Blueprints",
  },
  {
    youtubeId: "9bZkp7q19f0",
    title: "Peak Silence",
    artist: "Mountain Breeze",
    thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop",
    duration: 198,
    album: "Atmospheres",
  },
  {
    youtubeId: "fJ9rUzIMcZQ",
    title: "Rebel Spirit",
    artist: "Crimson Echo",
    thumbnailUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400&auto=format&fit=crop",
    duration: 242,
    album: "Overdrive",
  },
];

// YouTube Search — calls internal Next.js API route with optional user API key header
export async function searchYouTube(queryStr: string): Promise<SearchResult> {
  if (!queryStr || queryStr.trim().length === 0) {
    return {
      songs: FOR_YOU_SONGS,
      artists: FAVOURITE_ARTISTS,
      playlists: TRENDING_PLAYLISTS,
    };
  }

  try {
    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("aurafy_yt_api_key");
      if (storedKey && storedKey.trim()) {
        headers["x-youtube-api-key"] = storedKey.trim();
      }
    }

    const res = await fetch(`/api/search?q=${encodeURIComponent(queryStr)}`, {
      headers,
    });
    if (!res.ok) {
      throw new Error(`Search API responded with status ${res.status}`);
    }
    const data = await res.json();
    const songs: Track[] = Array.isArray(data.songs)
      ? data.songs
      : Array.isArray(data.items)
      ? data.items
      : [];

    return {
      songs: songs.length > 0 ? songs : FOR_YOU_SONGS,
      artists: Array.isArray(data.artists) && data.artists.length > 0 ? data.artists : FAVOURITE_ARTISTS,
      playlists: Array.isArray(data.playlists) && data.playlists.length > 0 ? data.playlists : TRENDING_PLAYLISTS,
    };
  } catch (err) {
    console.warn("Search API failed, falling back to local search:", err);
    const q = queryStr.toLowerCase();
    const filteredSongs = FOR_YOU_SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
    const filteredArtists = FAVOURITE_ARTISTS.filter((a) =>
      a.name.toLowerCase().includes(q)
    );
    const filteredPlaylists = TRENDING_PLAYLISTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );

    return {
      songs: filteredSongs.length > 0 ? filteredSongs : FOR_YOU_SONGS,
      artists: filteredArtists.length > 0 ? filteredArtists : FAVOURITE_ARTISTS,
      playlists:
        filteredPlaylists.length > 0 ? filteredPlaylists : TRENDING_PLAYLISTS,
    };
  }
}
