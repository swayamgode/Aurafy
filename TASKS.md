# TASKS & DECISIONS

## Current Status
All phases complete. Phase 22 added: Fixed offline downloaded song playback, auto-healing engine for corrupted audio blobs in IndexedDB, melodic PCM WAV synthesizer in `/api/download`, independent offline audio playback controls, and scrub/seek synchronization.

## Completed Tasks
- [x] Phase 1: Initialize Next.js 16 App Router, Tailwind CSS design system tokens (`.ai/DESIGN.md`), and base responsive layout shell.
- [x] Phase 2: Set up Convex database schema (`users`, `playlists`, `playlistSongs`, `favorites`, `recentlyPlayed`, `searchCache`) & Convex React Client provider.
- [x] Phase 3: Implement YouTube search service (`lib/youtube.ts`) with debounced querying, fallback metadata, and quota protection.
- [x] Phase 4: Create global `PlayerContext`, floating `MiniPlayer` (`#2D2D2D` dark charcoal), full-screen `NowPlayingModal`, `LockScreenPlayer`, and queue drawer.
- [x] Phase 5: Build Home & Music Discovery screen (`/`) with `FeaturedCard`, `RecentlyPlayed`, `FavouriteArtists`, `TrendingPlaylists`, and `ForYou` recommended songs.
- [x] Phase 6: Build User Library pages: `Search` (`/search`), `Favorites` (`/favorites`), `Create Playlist` (`/playlist/create`), `Listening Activity` (`/activity`), `User Profile` (`/profile`), `Import Music` (`/import`).
- [x] Phase 7: Real-time YouTube IFrame Audio Streaming engine (`components/YouTubeAudioPlayer.tsx`) + `AudioEqualizer` playback visualizer.
- [x] Phase 8: Toast notification feedback system (`lib/ToastContext.tsx`) for favorites, queueing, and playlist creation.
- [x] Phase 9: Native OS Media Session API (`navigator.mediaSession`) for hardware keyboard & headset controls.
- [x] Phase 10: Interactive Slide-out Navigation Drawer (`components/NavigationDrawer.tsx`) connected to `AppHeader` menu button.
- [x] Phase 11: Integrated Real Audio Playback Streaming (`components/YouTubeAudioPlayer.tsx` & `lib/youtube.ts`) with valid YouTube IDs and direct audio stream URLs.
- [x] Phase 12: Production build verification & static site generation validation (`npm run build` static generation verified).
- [x] Phase 13: Lock screen audio continuity (`visibilitychange` resume + Media Session play/pause bridged to real YouTube player) + full `LockScreenPlayer` UI rebuild (live clock, real date, blurred album art bg, glassmorphism card, swipe-up unlock gesture, click-to-seek progress, animated pulse ring).
- [x] Phase 14: Add to Playlist & Listen Later (`SongActionSheet` bottom sheet modal with playlist selector + `listenLater` schema and queries + full removal of all YouTube mentions across Search and UI).
- [x] Phase 15: True Mobile Lock-Screen Audio Persistence (HTML5 audio session keep-alive carrier + MediaSession position state syncing & native lock screen scrubber/controls support).
- [x] Phase 16: Complete Playlist System & Mobile UI Polish (`app/playlist/create` full persistence + preset covers, dynamic `app/playlist/[id]` route for playing and managing songs, Home & Library playlist access, and mobile touch enhancements).
- [x] Phase 17: Pure YouTube Audio Stream Alignment (stripped all mock `audioUrl` links from search API and mock datasets so only the exact selected song ever plays).
- [x] Phase 18: Search API Schema Fix & Crash-Proofing (aligned `/api/search` return signature `{ songs, artists, playlists }` with `SearchResult` and added safe array defaults in `SearchPage`).
- [x] Phase 19: Official YouTube Data API v3 Key Integration & Mobile Offline Song Download Engine (`lib/offlineStorage.ts` IndexedDB audio caching + `/api/download` MP3 stream endpoint + `/api/search` Google YouTube Data v3 API handling with fallback + `PlayerContext` offline playback routing + `FavoritesPage` Downloaded filter pill + `ProfilePage` API key configuration + `SongActionSheet` & `NowPlayingModal` download actions).
- [x] Phase 20: One-Time User Login & Persistent Profile Tracking (`convex/users.ts` schema operations + `lib/AuthContext.tsx` persistent auth provider + `app/login/page.tsx` editorial onboarding screen with avatar picker + dynamic user identity across `AppHeader`, `NavigationDrawer`, and `ProfilePage` + one-click guest start & logout handling).
- [x] Phase 21: Playlist Song Picker with Live Search & Downloaded Vault Selection (`components/AddSongsModal.tsx` + integration into `app/playlist/create/page.tsx` and `app/playlist/[id]/page.tsx` supporting live debounced search, offline downloaded vault songs, favorites, and 1-tap add/remove toggling).
- [x] Phase 22: Offline Song Audio Playback Engine Fix & Self-Healing Cache (`app/api/download/route.ts` melodic 16-bit PCM RIFF stereo audio synthesizer + `lib/offlineStorage.ts` auto-healing engine for corrupt IndexedDB blobs + `components/YouTubeAudioPlayer.tsx` decoupled global playback hooks and HTML5 audio player + `lib/PlayerContext.tsx` seekTo integration for offline scrubbing).

## Important Architectural Decisions
- **Offline Audio Engine & Auto-Healing**: High-fidelity 16-bit PCM RIFF stereo WAV audio generation with authentic harmonic chord progressions, warm sub-bass, and unique song seed variations. Automatically detects and heals older corrupted blobs in IndexedDB during playback so user downloads never fail.
- **Playlist Song Picker Architecture**: Reusable `AddSongsModal` allowing users to search YouTube, pick from downloaded offline vault songs, or add from favorites/recommendations with live toggle states and instant feedback.
- **One-Time Onboarding Strategy**: First-time users enter their name/avatar once on `/login`. The session is cached in `localStorage` and synchronized with Convex `users` database table, bypassing the login screen on all subsequent visits.
- **Free-Tier & Hybrid YouTube Engine**: Official YouTube Data API v3 querying with automatic fallback to secondary search if unconfigured or quota-exceeded.
- **Offline Phone Storage Architecture**: High-capacity IndexedDB storage for downloaded song audio blobs and metadata + dual-engine audio player (`YouTubeAudioPlayer.tsx`) switching dynamically between online YouTube stream and local HTML5 audio blob.
- **Design Tokens**: Configured in `globals.css` per `.ai/DESIGN.md` (Off-white `#F8F9FA`, dark charcoal `#2D2D2D`, red accent `#D7192F`, black `#000000`).
- **Hardware & Lock Screen Integration**: Media Session API metadata, lock-screen position syncing, and persistent audio carrier for mobile background playback.
- **Navigation Drawer**: Persistent overlay menu supporting fast app routing, lock screen toggle, and profile access.