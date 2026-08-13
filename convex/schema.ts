import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    userId: v.string(),
  }).index("by_userId", ["userId"]),

  favorites: defineTable({
    userId: v.string(),
    youtubeId: v.string(),
    title: v.string(),
    artist: v.string(),
    thumbnailUrl: v.string(),
    duration: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_track", ["userId", "youtubeId"]),

  playlists: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    creator: v.optional(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  playlistSongs: defineTable({
    playlistId: v.id("playlists"),
    youtubeId: v.string(),
    title: v.string(),
    artist: v.string(),
    thumbnailUrl: v.string(),
    duration: v.optional(v.number()),
    position: v.number(),
    addedAt: v.number(),
  }).index("by_playlist", ["playlistId"]),

  recentlyPlayed: defineTable({
    userId: v.string(),
    youtubeId: v.string(),
    title: v.string(),
    artist: v.string(),
    thumbnailUrl: v.string(),
    duration: v.optional(v.number()),
    playedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_playedAt", ["userId", "playedAt"]),

  searchCache: defineTable({
    query: v.string(),
    resultsJson: v.string(),
    updatedAt: v.number(),
  }).index("by_query", ["query"]),
});
