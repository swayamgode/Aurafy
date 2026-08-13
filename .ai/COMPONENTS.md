# COMPONENTS

This file defines reusable UI components.

## AppHeader

Used on primary screens.

Structure:

Menu
Title
Optional action

Do not create separate headers for every screen unless the design requires it.

---

## BottomNavigation

Global navigation.

Items:

Home
Explore
Favorites
Profile

Active item = red.

---

## MiniPlayer

Global playback component.

Contains:

- Artwork
- Song title
- Artist
- Previous
- Play/Pause
- Next

Behavior:

Tap → Now Playing.

---

## SongCard

Reusable song representation.

Structure:

Artwork
Title
Artist
Optional metadata
Optional duration
Optional action

Variants should be handled through props rather than duplicate components.

---

## AlbumCard

Contains:

Artwork
Album/song title
Artist

Used in horizontal carousels.

---

## ArtistCard

Contains:

Circular artwork
Artist name

---

## PlaylistCard

Contains:

Artwork
Playlist name
Creator
Optional action

---

## FilterPill

Used for:

All Songs
Recently Added
Albums
Genres
etc.

Active:

Black background
White text

Inactive:

Light background
Dark text

---

## PlayButton

Circular primary playback control.

States:

Play
Pause

---

## PlaybackControls

Contains:

Previous
Play/Pause
Next

Optional:

Shuffle
Repeat
Queue

---

## SearchBar

Contains:

Search icon
Input
Placeholder

Placeholder example:

"Artists, songs, lyrics..."

---

## StatsCard

Contains:

Icon
Large metric
Label

Example:

12.5h
AVG. DAILY

---

## GenreChip

Small rounded filter element.

Active genre:

Black background
White text

Inactive:

Light gray background.

---

## Rules

Reuse components.

Do not create:

SongCard2
SongItem
MusicSongCard
NewSongCard

when an existing SongCard can be extended.

If a component needs a new visual variant, prefer:

variant="compact"

or

variant="favorite"

rather than duplicating the component.