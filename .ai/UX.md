# UX

This file defines interaction and behavior rules.

## General

The application should feel:

- Fast
- Predictable
- Minimal
- Smooth
- Music-first

Do not add interactions that are not necessary.

## Navigation

Bottom navigation is persistent.

Home → Discovery
Explore → Search/discovery
Favorites → Saved music
Profile → User/activity

## Music Playback

Tapping a song starts playback.

Mini Player appears when music is playing.

Tapping Mini Player opens Now Playing.

Now Playing contains:

- Artwork
- Song
- Artist
- Favorite
- Previous
- Play/Pause
- Next
- Progress
- Queue
- Output device

## Favorites

Tap heart:

Favorite → Unfavorite
Unfavorite → Favorite

Favorite state must update immediately.

## Playlist

Create playlist flow:

Create
→ Add Songs
→ Remove Songs
→ Save

Saving requires a playlist name.

## Search

Search supports:

Songs
Albums
Artists
Playlists
Podcasts

Preserve recent searches.

## Import

Import flow:

Select source
→ Scan media
→ Show progress
→ Import
→ Add to library

## Gestures

Mini player can expand into Now Playing.

Horizontal content sections should support horizontal scrolling.

## Feedback

Buttons should provide immediate visual feedback.

Favorite actions should have a small animation.

Playback state should update immediately.

## Animation

Keep animations subtle.

100–150ms:
Small interaction feedback

200–300ms:
Cards/transitions

300–400ms:
Player expansion

Do not over-animate the application.