import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPlaylists = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const playlists = await ctx.db
      .query("playlists")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const result = await Promise.all(
      playlists.map(async (playlist) => {
        const songs = await ctx.db
          .query("playlistSongs")
          .withIndex("by_playlist", (q) => q.eq("playlistId", playlist._id))
          .collect();
        return {
          ...playlist,
          id: playlist._id,
          songsCount: songs.length,
          songs: songs.map((s) => ({
            youtubeId: s.youtubeId,
            title: s.title,
            artist: s.artist,
            thumbnailUrl: s.thumbnailUrl,
            duration: s.duration,
          })),
        };
      })
    );

    return result;
  },
});

export const getPlaylistById = query({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) return null;

    const songs = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    return {
      ...playlist,
      id: playlist._id,
      songsCount: songs.length,
      songs: songs.map((s) => ({
        youtubeId: s.youtubeId,
        title: s.title,
        artist: s.artist,
        thumbnailUrl: s.thumbnailUrl,
        duration: s.duration,
      })),
    };
  },
});

export const createPlaylist = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    creator: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    songs: v.optional(
      v.array(
        v.object({
          youtubeId: v.string(),
          title: v.string(),
          artist: v.string(),
          thumbnailUrl: v.string(),
          duration: v.optional(v.number()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const playlistId = await ctx.db.insert("playlists", {
      userId: args.userId,
      title: args.title,
      description: args.description || "",
      coverUrl: args.coverUrl || "",
      creator: args.creator || "User",
      isPublic: args.isPublic ?? true,
      createdAt: Date.now(),
    });

    if (args.songs && args.songs.length > 0) {
      for (let i = 0; i < args.songs.length; i++) {
        const song = args.songs[i];
        await ctx.db.insert("playlistSongs", {
          playlistId,
          youtubeId: song.youtubeId,
          title: song.title,
          artist: song.artist,
          thumbnailUrl: song.thumbnailUrl,
          duration: song.duration,
          position: i,
          addedAt: Date.now(),
        });
      }
    }

    return playlistId;
  },
});

export const addSongToPlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    youtubeId: v.string(),
    title: v.string(),
    artist: v.string(),
    thumbnailUrl: v.string(),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    const position = existing.length;

    await ctx.db.insert("playlistSongs", {
      playlistId: args.playlistId,
      youtubeId: args.youtubeId,
      title: args.title,
      artist: args.artist,
      thumbnailUrl: args.thumbnailUrl,
      duration: args.duration,
      position,
      addedAt: Date.now(),
    });
  },
});

export const removeSongFromPlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    youtubeId: v.string(),
  },
  handler: async (ctx, args) => {
    const songs = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    const target = songs.find((s) => s.youtubeId === args.youtubeId);
    if (target) {
      await ctx.db.delete(target._id);
    }
  },
});

export const deletePlaylist = mutation({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, args) => {
    const songs = await ctx.db
      .query("playlistSongs")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    for (const song of songs) {
      await ctx.db.delete(song._id);
    }

    await ctx.db.delete(args.playlistId);
  },
});
