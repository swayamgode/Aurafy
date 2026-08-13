export interface Track {
  youtubeId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  duration?: number; // duration in seconds
  album?: string;
  audioUrl?: string;
}

export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  genre?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  creator?: string;
  songsCount?: number;
  songs?: Track[];
  userId?: string;
}

export interface SearchResult {
  songs: Track[];
  artists: Artist[];
  playlists: Playlist[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface ListeningStat {
  avgDaily: string;
  vsLastWeek: string;
  totalHours: string;
  mostPlayedGenre: string;
  mostPlayedCount: number;
}
