import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getFavorites = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const isFavorite = query({
  args: { userId: v.string(), youtubeId: v.string() },
  handler: async (ctx, args) => {
    const fav = await ctx.db
      .query("favorites")
      .withIndex("by_user_track", (q) =>
        q.eq("userId", args.userId).eq("youtubeId", args.youtubeId)
      )
      .first();
    return !!fav;
  },
});

export const toggleFavorite = mutation({
  args: {
    userId: v.string(),
    youtubeId: v.string(),
    title: v.string(),
    artist: v.string(),
    thumbnailUrl: v.string(),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_track", (q) =>
        q.eq("userId", args.userId).eq("youtubeId", args.youtubeId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    } else {
      await ctx.db.insert("favorites", {
        userId: args.userId,
        youtubeId: args.youtubeId,
        title: args.title,
        artist: args.artist,
        thumbnailUrl: args.thumbnailUrl,
        duration: args.duration,
        createdAt: Date.now(),
      });
      return { favorited: true };
    }
  },
});
