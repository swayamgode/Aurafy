import { Track, SearchResult, Artist, Playlist } from "@/types/music";

// Curated featured mock data for fallback & offline / quota protection
export const FEATURED_ALBUM = {
  id: "featured-1",
  title: "Solar Echoes",
  artist: "Synthetic Collective",
  coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=800&auto=format&fit=crop",
  tag: "TRENDING ALBUM",
  youtubeId: "fJ9rUzIMcZQ", // High quality lofi / synth track
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
    youtubeId: "ELEKTRO-1",
    title: "ELEKTRO",
    artist: "Low Voltage",
    thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop",
    duration: 263,
    album: "Low Voltage EP",
  },
  {
    youtubeId: "NeonNights-2",
    title: "Neon Nights",
    artist: "Synthwave Collective",
    thumbnailUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&auto=format&fit=crop",
    duration: 228,
    album: "Cyber Skyline",
  },
  {
    youtubeId: "GoldenHour-3",
    title: "Golden Hour",
    artist: "Luna Ray",
    thumbnailUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=400&auto=format&fit=crop",
    duration: 210,
    album: "Solaris",
  },
  {
    youtubeId: "Structure-4",
    title: "Structure",
    artist: "The Architect",
    thumbnailUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400&auto=format&fit=crop",
    duration: 285,
    album: "Blueprints",
  },
  {
    youtubeId: "PeakSilence-5",
    title: "Peak Silence",
    artist: "Mountain Breeze",
    thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop",
    duration: 198,
    album: "Atmospheres",
  },
  {
    youtubeId: "RebelSpirit-6",
    title: "Rebel Spirit",
    artist: "Crimson Echo",
    thumbnailUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400&auto=format&fit=crop",
    duration: 242,
    album: "Overdrive",
  },
];

// YouTube API Search Functionality
export async function searchYouTube(queryStr: string): Promise<SearchResult> {
  if (!queryStr || queryStr.trim().length === 0) {
    return {
      songs: FOR_YOU_SONGS,
      artists: FAVOURITE_ARTISTS,
      playlists: TRENDING_PLAYLISTS,
    };
  }

  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    // Return filtered fallback results matching user query
    const lower = queryStr.toLowerCase();
    const filteredSongs = FOR_YOU_SONGS.concat(RECENTLY_PLAYED_INITIAL).filter(
      (t) => t.title.toLowerCase().includes(lower) || t.artist.toLowerCase().includes(lower)
    );
    const filteredArtists = FAVOURITE_ARTISTS.filter((a) => a.name.toLowerCase().includes(lower));
    const filteredPlaylists = TRENDING_PLAYLISTS.filter((p) => p.title.toLowerCase().includes(lower));

    return {
      songs: filteredSongs.length > 0 ? filteredSongs : FOR_YOU_SONGS,
      artists: filteredArtists,
      playlists: filteredPlaylists,
    };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=15&q=${encodeURIComponent(
      queryStr
    )}&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`YouTube API returned ${res.status}`);
    }

    const data = await res.json();
    const songs: Track[] = (data.items || []).map((item: any) => ({
      youtubeId: item.id.videoId,
      title: item.snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&"),
      artist: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      duration: 210, // Default estimated duration
    }));

    return {
      songs,
      artists: FAVOURITE_ARTISTS.filter((a) => a.name.toLowerCase().includes(queryStr.toLowerCase())),
      playlists: TRENDING_PLAYLISTS,
    };
  } catch (error) {
    console.warn("YouTube API search fallback triggered:", error);
    return {
      songs: FOR_YOU_SONGS,
      artists: FAVOURITE_ARTISTS,
      playlists: TRENDING_PLAYLISTS,
    };
  }
}
