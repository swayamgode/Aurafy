# Music App — UI/UX Design Specification

## 1. Overview

This document defines the UI/UX design system and screen specifications for the mobile music application shown in the reference designs.

### Design Direction

- **Style:** Modern, minimal, premium music-player interface
- **Primary theme:** Light / off-white interface with strong black typography
- **Accent:** Red used for active states, favorites, important actions, and progress
- **Shape language:** Rounded cards, pill buttons, circular controls
- **Visual personality:** Clean, editorial, spacious, slightly futuristic
- **Target platform:** Mobile-first application
- **Primary navigation:** Home, Search/Explore, Favorites, Profile
- **Persistent element:** Mini music player above bottom navigation

---

# 2. Design Principles

### 2.1 Minimalism
Keep the interface uncluttered. Use whitespace and typography to establish hierarchy rather than excessive decoration.

### 2.2 Music-first Experience
Album artwork, song titles, artist names, playlists, and playback controls should remain the strongest visual elements.

### 2.3 Clear Hierarchy
Every screen should have an obvious order:

1. Page title
2. Featured content
3. Content sections
4. Lists / recommendations
5. Persistent player
6. Bottom navigation

### 2.4 Consistent Interaction
Buttons, cards, icons, player controls, and navigation should behave consistently throughout the application.

---

# 3. Color System

| Token | Suggested Value | Usage |
|---|---|---|
| Primary Black | `#000000` | Main text, primary buttons |
| Dark Surface | `#2D2D2D` | Mini player, dark cards |
| Background | `#F8F9FA` | Main application background |
| White | `#FFFFFF` | Cards, controls, surfaces |
| Accent Red | `#D7192F` | Favorites, active navigation, important actions |
| Muted Text | `#5F6368` | Secondary text |
| Light Text | `#8A8D91` | Metadata and timestamps |
| Border | `#E3E4E6` | Dividers and subtle outlines |
| Light Surface | `#F1F2F3` | Pills, filters, secondary cards |

### Color Usage Rules

- Use black for primary text and high-priority actions.
- Use red sparingly so that active states remain noticeable.
- Use off-white rather than pure white for the main page background.
- Dark surfaces should be reserved for playback components and selected promotional cards.

---

# 4. Typography

The interface uses a modern sans-serif visual style.

### Recommended Font

**Primary:** Inter, SF Pro Display, or a similar modern sans-serif.

| Style | Weight | Approx. Size |
|---|---:|---:|
| Display Heading | 700 | 30–34px |
| Page Heading | 700 | 26–30px |
| Section Heading | 700 | 20–22px |
| Card Title | 600 | 16–18px |
| Body | 400 | 14–16px |
| Metadata | 400 | 12–14px |
| Button | 600 | 12–14px |
| Caption | 500 | 10–12px |

### Typography Rules

- Keep headings bold and short.
- Use muted gray for artist names and supporting information.
- Avoid using more than two font weights within a single component.
- Song titles should always have stronger contrast than artist names.

---

# 5. Spacing System

Use an 8px-based spacing system.

```text
4px   — micro spacing
8px   — icon/text spacing
12px  — compact spacing
16px  — standard component spacing
20px  — section spacing
24px  — large component spacing
32px  — major section spacing
40px+ — page-level spacing
```

### Screen Margins

Recommended horizontal page padding:

**24px**

Some compact screens may use **16–20px** where necessary.

---

# 6. Border Radius

| Component | Radius |
|---|---:|
| Small buttons | 18–22px |
| Pills | 20–24px |
| Song artwork | 10–14px |
| Standard cards | 18–24px |
| Featured cards | 24–28px |
| Mini player | 28–36px |
| Primary play button | 50% |
| Bottom navigation | 0–16px depending on layout |

The overall design relies heavily on rounded surfaces.

---

# 7. Iconography

Use a simple outline icon set with consistent stroke width.

Recommended icons:

- Menu
- Search
- Home
- Compass / Explore
- Heart
- Profile
- More
- Play
- Pause
- Previous
- Next
- Shuffle
- Repeat
- Download / Import
- Upload
- Clock
- Statistics
- Close
- Arrow

### Icon Rules

- Use outline icons for inactive states.
- Use filled icons for important active states.
- Favorites use a filled red heart.
- Active bottom navigation icons use red.
- Playback icons should remain visually simple and highly recognizable.

---

# 8. Global Components

## 8.1 Top App Bar

Structure:

```text
[Menu]   Page Title                         [Search]
```

### Behavior

- Left menu opens navigation drawer.
- Center/left title identifies the current page.
- Search icon opens Search.
- Profile avatar may replace search on account/activity screens.

---

## 8.2 Bottom Navigation

Four primary destinations:

```text
Home     Explore     Favorites     Profile
```

### States

**Inactive**
- Gray icon
- Gray/secondary text

**Active**
- Red icon
- Optional red label

The bottom navigation remains fixed at the bottom of the application.

---

## 8.3 Mini Music Player

The mini player appears above the bottom navigation whenever a song is playing.

Structure:

```text
[Artwork]  Song
           Artist

          [Previous] [Play/Pause] [Next]
```

### Design

- Dark charcoal background on most screens.
- Rounded pill/card shape.
- Small album artwork.
- White playback controls.
- Main play/pause control uses a white circular button.
- Player should remain visible while navigating between screens.

### Interaction

- Tap artwork/title → open Now Playing.
- Tap play/pause → toggle playback.
- Previous/Next → change track.
- Player should animate smoothly when the current track changes.

---

# 9. Screen Specifications

# 9.1 Home / Music Screen

## Purpose

The main discovery screen for finding music, albums, artists, playlists, and recommendations.

## Layout

```text
Header
  ├── Menu
  ├── Music
  └── Search

Featured Album
  ├── Background artwork
  ├── Trending Album label
  ├── Album title
  └── Artist

Recently Played
  └── Horizontal album cards

Favourite Artists
  └── Circular artist avatars

Trending Playlists
  ├── Morning Rush
  ├── Lofi Nights
  └── Hip-Hop Essentials

For You
  └── Recommended song list

Mini Player
Bottom Navigation
```

## Featured Album

Large rounded promotional card.

Example content:

**Solar Echoes**  
By Synthetic Collective

Use artwork as the background with a dark gradient overlay for readability.

## Recently Played

Horizontal scrolling cards showing:

- Artwork
- Song title
- Artist

## Favourite Artists

Circular artwork/avatar cards.

Display artist name underneath.

## Trending Playlists

Use large rounded cards with visual differences between playlists.

Examples:

- Morning Rush
- Lofi Nights
- Hip-Hop Essentials

## For You

Compact song list:

```text
Artwork | Song
         Artist                  Duration   More
```

---

# 9.2 Favorites Screen

## Purpose

Display the user's liked music.

## Layout

```text
Header
  ├── Menu
  ├── Favourites
  └── Search

Category Filters
  ├── All Songs
  ├── Recently Added
  └── Albums

Favorite Song List

Mini Player

Bottom Navigation
```

## Filter Pills

Selected:

- Black background
- White text

Unselected:

- Light gray background
- Dark text

## Song Row

```text
[Artwork]  Song Title
           Artist • Album/Metadata             [Heart] [...]
```

The heart icon is filled red because the song is favorited.

---

# 9.3 Create Playlist Screen

## Purpose

Allow users to create and customize a playlist.

## Layout

```text
[Close] Create Playlist                 [Save]

             [Cover Image]
             Upload Cover

PLAYLIST NAME
Study Beats
────────────────────────

DESCRIPTION
Tell more about this vibe...
────────────────────────

Songs in Playlist                  [ + ADD SONGS ]

[Artwork] Midnight Thoughts
          Lofi Sleepy                       [Remove]

[Artwork] Focus State
          Deep Focus Collective             [Remove]

[Artwork] Rainy Window
          Acoustic Dreams                   [Remove]

[Artwork] System Overload
          Glitch Mob                        [Remove]

Suggested for You

[Playlist Card]       [Playlist Card]

Mini Player
```

## Cover Upload

Large rounded-square artwork area.

Center:

- Camera/upload icon
- "UPLOAD COVER"

Tapping opens device image selection.

## Save Button

Outlined pill button.

Disabled state should be shown when the playlist name is empty.

## Add Songs

Red pill action:

**+ ADD SONGS**

Opens song selection.

## Remove Song

Use a subtle gray `×` icon on the right side.

---

# 9.4 Import Music Screen

## Purpose

Import music from local storage or synchronize an online library.

## Layout

```text
Header
  ├── Menu
  ├── Import
  └── Search

Import Hero Banner

Source Selection

[Import from Device]
Local storage & SD card

[Sync Online Library]
Connect Spotify or Apple Music

Scanning Media

60%
Finding audio tracks...

[Progress Bar]

1,248 files found

Popular Formats

Syncing...
```

## Source Cards

Two primary cards:

### Import from Device

- Red device icon
- Title
- Description
- Chevron

### Sync Online Library

- Dark circular sync icon
- Title
- Description
- Check indicator

Selected source uses a stronger outline.

## Scan Progress

Display:

- Percentage
- Progress bar
- Current operation
- Files discovered

---

# 9.5 Listening Activity Screen

## Purpose

Show personalized listening analytics.

## Layout

```text
Header

Listening Activity
Your sonic journey over the last 30 days.

Most Played Genre
Lo-Fi Jazz
428 Tracks

[Overview] [History] [Stats]

Recently Played

Playback Statistics
  ├── 12.5h Avg. Daily
  ├── +12% vs Last Week
  └── 376 Hours Total

Top Genres
  ├── Indie Rock
  ├── Lo-Fi Jazz
  ├── Synth Wave
  ├── Neo Soul
  └── Ambient

Listening History

Mini Player
Bottom Navigation
```

## Genre Highlight Card

Large dark card with subtle red glow.

Content:

**MOST PLAYED GENRE**  
**Lo-Fi Jazz**

`428 TRACKS`

## Statistics Cards

Use simple metric cards with:

- Small icon
- Large number
- Supporting label

Examples:

**12.5h**  
AVG. DAILY

**+12%**  
VS LAST WEEK

**376 Hours**  
TOTAL LISTENING TIME

---

# 9.6 Lock Screen Player

## Purpose

Provide a focused lock-screen-style music playback experience.

## Layout

```text
03:48
MONDAY, JUNE 12

[Large Album Artwork]

After Hours
The Weeknd                                  [Heart]

────────────●────────────
02:48                    04:22

[Shuffle] [Previous] [Play] [Next] [Repeat]

             ↑
       SWIPE UP TO UNLOCK
```

## Visual Style

- Very minimal
- Large centered artwork
- Soft background glow
- Large time display
- White rounded player card
- Black playback controls
- Red favorite icon

The screen should feel like a dedicated music lock screen rather than a normal application page.

---

# 9.7 Now Playing Screen

## Purpose

Provide full-screen playback controls.

## Layout

```text
[Down]             Play                 [...]

               [HI-RES]

             [Album Artwork]

ELEKTRO                              [Heart]
Low Voltage

02:48                              04:23

[Repeat] [Previous] [Pause] [Next] [Queue]

Playing On
Studio Pro One                         [CHANGE]
```

## Main Artwork

Large rounded image container with subtle shadow.

## Song Information

Title:

**ELEKTRO**

Artist:

**Low Voltage**

Favorite button appears on the right.

## Playback Controls

Primary pause/play button:

- Large circular control
- Black background
- White icon

Secondary controls:

- Previous
- Next
- Repeat
- Queue

## Output Device Card

Bottom card:

```text
[Device Icon]
PLAYING ON
Studio Pro One                         CHANGE
```

---

# 9.8 Search Screen

## Purpose

Search songs, albums, artists, playlists, and podcasts.

## Layout

```text
Header
  ├── Menu
  ├── Music
  └── Search

[ Search artists, songs, lyrics... ]

Songs | Albums | Artists | Playlists | Podcasts

Search Results

[Artwork] Neon Nights
          Synthwave Collective                 [...]

[Artwork] Golden Hour
          Luna Ray                             [...]

[Artwork] Structure
          The Architect                        [...]

[Artwork] Peak Silence
          Mountain Breeze                      [...]

[Artwork] Rebel Spirit
          Crimson Echo                         [...]

Recent Searches

[Indie Pop Essentials] [Global Top 50]

Mini Player
Bottom Navigation
```

## Search Field

Large rounded input area.

Placeholder:

**Artists, songs, lyrics...**

Include search icon on the left.

## Search Tabs

Horizontal tab navigation:

- Songs
- Albums
- Artists
- Playlists
- Podcasts

Active tab should use stronger typography.

---

# 10. Playlist Recommendation Cards

Used on Create Playlist and discovery screens.

Structure:

```text
[Large Artwork]

Playlist Name
Creator

[ADD]
```

### Example

**Nordic Chill**  
Ambient Explorer

**Vinyl Library**  
The Archivist

Buttons use black background with white text.

---

# 11. Song List Component

Reusable throughout the application.

```text
┌─────────────────────────────────────────┐
│ [IMG]  Song Title                3:42  ...│
│        Artist Name                       │
└─────────────────────────────────────────┘
```

### Variants

- Default song row
- Favorite row
- Search result row
- Listening history row
- Playlist row

---

# 12. Interaction Design

## Playback

- Tap song → start playback.
- Tap mini player → open Now Playing.
- Tap play/pause → toggle state.
- Previous/next controls change track.
- Swipe player upward → expand to full player.
- Swipe down on Now Playing → return to previous screen.

## Favorites

- Tap heart → add/remove favorite.
- Animate heart when selected.
- Update Favorites screen immediately.

## Playlists

- Create playlist.
- Upload cover.
- Add/remove songs.
- Save playlist.
- Suggested playlists can be added directly.

## Search

- Search should update results as the user types or after submission.
- Preserve recent searches.
- Selecting a result opens its corresponding detail/player screen.

## Import

- User selects source.
- App scans media.
- Progress indicator updates.
- Imported songs become available in the library.

---

# 13. Motion & Animation

Animations should be subtle and fast.

### Recommended Timing

- Button feedback: 100–150ms
- Card transition: 200–300ms
- Screen transition: 250–350ms
- Mini-player expansion: 300–400ms
- Favorite animation: 150–250ms

### Suggested Animations

- Heart scale/bounce on favorite.
- Album artwork crossfade when song changes.
- Mini player smoothly expands into Now Playing.
- Horizontal carousels use natural momentum scrolling.
- Progress bars animate smoothly.
- Playlist cards slightly scale on press.

---

# 14. Responsive Design

The supplied references are mobile-first.

### Recommended Base

```text
Mobile width: 390–430px
```

### Safe Areas

Maintain sufficient bottom padding for:

- Bottom navigation
- Mini player
- Gesture area

### Desktop Adaptation

If adapted to desktop:

- Keep mobile-style player controls but expand into a dedicated bottom player.
- Use a left sidebar for navigation.
- Convert horizontal carousels into responsive grids.
- Use larger artwork and multi-column layouts.

---

# 15. Accessibility

- Maintain readable contrast between text and backgrounds.
- Minimum touch target: **44 × 44px**.
- Do not communicate state using color alone.
- Provide labels for icon-only controls.
- Support dynamic text sizing where possible.
- Ensure playback controls are accessible to screen readers.
- Use semantic labels for songs, artists, playlists, and navigation.

---

# 16. Component Architecture

Suggested reusable component structure:

```text
App
├── AppHeader
├── BottomNavigation
├── MiniPlayer
├── FeaturedCard
├── SectionHeader
├── SongCard
├── SongList
├── AlbumCard
├── ArtistCard
├── PlaylistCard
├── FilterPill
├── PlayButton
├── PlaybackControls
├── ProgressBar
├── SearchBar
├── StatsCard
├── GenreChip
└── DeviceCard
```

---

# 17. Suggested Screen Routes

```text
/
├── /home
├── /search
├── /favorites
├── /profile
├── /playlist/create
├── /import
├── /activity
├── /now-playing
└── /lock-screen
```

---

# 18. Design Tokens

```css
:root {
  --color-primary: #000000;
  --color-background: #f8f9fa;
  --color-surface: #ffffff;
  --color-dark-surface: #2d2d2d;
  --color-accent: #d7192f;
  --color-text: #111111;
  --color-text-secondary: #5f6368;
  --color-text-muted: #8a8d91;
  --color-border: #e3e4e6;

  --radius-sm: 12px;
  --radius-md: 20px;
  --radius-lg: 28px;
  --radius-pill: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
}
```

---

# 19. Overall UX Flow

```text
                    ┌──────────┐
                    │   HOME   │
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       SEARCH        FAVORITES       PROFILE
          │
          ▼
      SONG / ALBUM
          │
          ▼
     MINI PLAYER
          │
          ▼
     NOW PLAYING
          │
          ▼
    LOCK SCREEN

HOME
 │
 ├── Create Playlist
 │      └── Add Songs
 │
 ├── Import Music
 │      └── Scan Library
 │
 └── Listening Activity
```

---

# 20. Final Design Summary

The application should feel like a **premium personal music ecosystem** rather than a simple audio player.

The strongest characteristics of the design are:

- Minimal off-white interface
- Bold black typography
- Red accent for active states
- Large expressive album artwork
- Rounded cards and pill controls
- Persistent mini player
- Simple four-item bottom navigation
- Editorial-style music discovery
- Personalized statistics and recommendations
- Smooth transitions between browsing and playback

The visual language should remain consistent across all screens while allowing each screen to have its own hierarchy and purpose.
