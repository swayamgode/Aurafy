import { Track, SearchResult, Artist, Playlist } from "@/types/music";

// Curated featured mock data with REAL working audio streams & valid YouTube IDs
export const FEATURED_ALBUM = {
  id: "featured-1",
  title: "Solar Echoes",
  artist: "Synthetic Collective",
  coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop",
  tag: "TRENDING ALBUM",
  youtubeId: "jfKfPfyJRdk", // Real Lofi Girl stream
  duration: 245,
  audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
};

export const RECENTLY_PLAYED_INITIAL: Track[] = [
  {
    youtubeId: "jfKfPfyJRdk",
    title: "Lofi Hip Hop Radio - Beats to Relax/Study to",
    artist: "Lofi Girl",
    thumbnailUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400&auto=format&fit=crop",
    duration: 180,
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
  },
  {
    youtubeId: "5qap5aO4i9A",
    title: "Midnight Thoughts",
    artist: "Lofi Sleepy",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop",
    duration: 215,
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-lofi-song-8444.mp3",
  },
  {
    youtubeId: "DWcJFNfaw9c",
    title: "Focus State",
    artist: "Deep Focus Collective",
    thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop",
    duration: 240,
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ambient-piano-amp-strings-10711.mp3",
  },
  {
    youtubeId: "4xDzrJKXOOY",
    title: "Rainy Window",
    artist: "Acoustic Dreams",
    thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&auto=format&fit=crop",
    duration: 195,
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792e3.mp3?filename=acoustic-guitar-lofi-124584.mp3",
  },
  {
    youtubeId: "9bZkp7q19f0",
    title: "System Overload",
    artist: "Glitch Mob",
    thumbnailUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400&auto=format&fit=crop",
    duration: 230,
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c2957b4477.mp3?filename=electronic-future-beats-117676.mp3",
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
    coverUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=500&auto=format&fit=crop",
    creator: "Aurafy Editorial",
    songsCount: 34,
  },
  {
    id: "pl-2",
    title: "Lofi Nights",
    description: "Chill beats for late night relaxation & code",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=500&auto=format&fit=crop",
    creator: "Lofi Club",
    songsCount: 48,
  },
  {
    id: "pl-3",
    title: "Hip-Hop Essentials",
    description: "Definitive hip-hop bangers and modern classics",
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=500&auto=format&fit=crop",
    creator: "Urban Wave",
    songsCount: 50,
  },
];

export const FOR_YOU_SONGS: Track[] = [
  {
    youtubeId: "5qap5aO4i9A", // Valid YouTube ID
    title: "ELEKTRO",
    artist: "Low Voltage",
    thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop",
    duration: 263,
    album: "Low Voltage EP",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c2957b4477.mp3?filename=electronic-future-beats-117676.mp3",
  },
  {
    youtubeId: "DWcJFNfaw9c", // Valid YouTube ID
    title: "Neon Nights",
    artist: "Synthwave Collective",
    thumbnailUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&auto=format&fit=crop",
    duration: 228,
    album: "Cyber Skyline",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
  },
  {
    youtubeId: "4xDzrJKXOOY", // Valid YouTube ID
    title: "Golden Hour",
    artist: "Luna Ray",
    thumbnailUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400&auto=format&fit=crop",
    duration: 210,
    album: "Solaris",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792e3.mp3?filename=acoustic-guitar-lofi-124584.mp3",
  },
  {
    youtubeId: "jfKfPfyJRdk", // Valid YouTube ID
    title: "Structure",
    artist: "The Architect",
    thumbnailUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400&auto=format&fit=crop",
    duration: 285,
    album: "Blueprints",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ambient-piano-amp-strings-10711.mp3",
  },
  {
    youtubeId: "9bZkp7q19f0", // Valid YouTube ID
    title: "Peak Silence",
    artist: "Mountain Breeze",
    thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop",
    duration: 198,
    album: "Atmospheres",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-lofi-song-8444.mp3",
  },
  {
    youtubeId: "fJ9rUzIMcZQ", // Valid YouTube ID
    title: "Rebel Spirit",
    artist: "Crimson Echo",
    thumbnailUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400&auto=format&fit=crop",
    duration: 242,
    album: "Overdrive",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
  },
];

// YouTube Search — calls internal Next.js API route (no key needed)
export async function searchYouTube(queryStr: string): Promise<SearchResult> {
  if (!queryStr || queryStr.trim().length === 0) {
    return {
      songs: FOR_YOU_SONGS,
      artists: FAVOURITE_ARTISTS,
      playlists: TRENDING_PLAYLISTS,
    };
  }

  try {
    // Call our server-side /api/search route which uses youtube-search-api (no API key needed)
    const res = await fetch(`/api/search?q=${encodeURIComponent(queryStr)}`);

    if (!res.ok) {
      throw new Error(`Search API returned ${res.status}`);
    }

    const data = await res.json();
    const songs: Track[] = data.items || [];

    if (songs.length === 0) {
      throw new Error("No results");
    }

    return {
      songs,
      artists: FAVOURITE_ARTISTS.filter((a) =>
        a.name.toLowerCase().includes(queryStr.toLowerCase())
      ),
      playlists: TRENDING_PLAYLISTS,
    };
  } catch (error) {
    console.warn("YouTube search fallback triggered:", error);
    // Fallback: filter local catalog
    const lower = queryStr.toLowerCase();
    const filteredSongs = [...FOR_YOU_SONGS, ...RECENTLY_PLAYED_INITIAL].filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        t.artist.toLowerCase().includes(lower)
    );
    return {
      songs: filteredSongs.length > 0 ? filteredSongs : FOR_YOU_SONGS,
      artists: FAVOURITE_ARTISTS.filter((a) =>
        a.name.toLowerCase().includes(lower)
      ),
      playlists: TRENDING_PLAYLISTS,
    };
  }
}
