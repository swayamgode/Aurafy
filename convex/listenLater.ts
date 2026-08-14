import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getListenLater = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("listenLater")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const isInListenLater = query({
  args: { userId: v.string(), youtubeId: v.string() },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("listenLater")
      .withIndex("by_user_track", (q) =>
        q.eq("userId", args.userId).eq("youtubeId", args.youtubeId)
      )
      .first();
    return !!item;
  },
});

export const addToListenLater = mutation({
  args: {
    userId: v.string(),
    youtubeId: v.string(),
    title: v.string(),
    artist: v.string(),
    thumbnailUrl: v.string(),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Deduplicate — don't add if already exists
    const existing = await ctx.db
      .query("listenLater")
      .withIndex("by_user_track", (q) =>
        q.eq("userId", args.userId).eq("youtubeId", args.youtubeId)
      )
      .first();

    if (existing) return { added: false };

    await ctx.db.insert("listenLater", {
      userId: args.userId,
      youtubeId: args.youtubeId,
      title: args.title,
      artist: args.artist,
      thumbnailUrl: args.thumbnailUrl,
      duration: args.duration,
      addedAt: Date.now(),
    });

    return { added: true };
  },
});

export const removeFromListenLater = mutation({
  args: { userId: v.string(), youtubeId: v.string() },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("listenLater")
      .withIndex("by_user_track", (q) =>
        q.eq("userId", args.userId).eq("youtubeId", args.youtubeId)
      )
      .first();

    if (item) {
      await ctx.db.delete(item._id);
    }
  },
});
