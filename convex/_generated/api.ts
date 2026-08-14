/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { AnyApi } from "convex/server";

export const api: any = {
  playlists: {
    getPlaylists: "playlists:getPlaylists" as any,
    getPlaylistById: "playlists:getPlaylistById" as any,
    createPlaylist: "playlists:createPlaylist" as any,
    addSongToPlaylist: "playlists:addSongToPlaylist" as any,
    removeSongFromPlaylist: "playlists:removeSongFromPlaylist" as any,
    deletePlaylist: "playlists:deletePlaylist" as any,
  },
  favorites: {
    getFavorites: "favorites:getFavorites" as any,
    isFavorite: "favorites:isFavorite" as any,
    toggleFavorite: "favorites:toggleFavorite" as any,
  },
  listenLater: {
    getListenLater: "listenLater:getListenLater" as any,
    isInListenLater: "listenLater:isInListenLater" as any,
    addToListenLater: "listenLater:addToListenLater" as any,
    removeFromListenLater: "listenLater:removeFromListenLater" as any,
  },
  recentlyPlayed: {
    getRecentlyPlayed: "recentlyPlayed:getRecentlyPlayed" as any,
    addRecentlyPlayed: "recentlyPlayed:addRecentlyPlayed" as any,
  },
};

export const internal: any = {};
