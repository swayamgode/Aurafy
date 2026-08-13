import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getRecentlyPlayed = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const history = await ctx.db
      .query("recentlyPlayed")
      .withIndex("by_user_playedAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Deduplicate by youtubeId while preserving latest order
    const seen = new Set<string>();
    const result = [];
    for (const item of history) {
      if (!seen.has(item.youtubeId)) {
        seen.add(item.youtubeId);
        result.push(item);
      }
    }

    return result;
  },
});

export const addRecentlyPlayed = mutation({
  args: {
    userId: v.string(),
    youtubeId: v.string(),
    title: v.string(),
    artist: v.string(),
    thumbnailUrl: v.string(),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("recentlyPlayed", {
      userId: args.userId,
      youtubeId: args.youtubeId,
      title: args.title,
      artist: args.artist,
      thumbnailUrl: args.thumbnailUrl,
      duration: args.duration,
      playedAt: Date.now(),
    });
  },
});
