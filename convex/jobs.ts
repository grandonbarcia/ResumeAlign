import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    userId: v.string(),
    sourceUrl: v.optional(v.string()),
    rawText: v.string(),
    structured: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('jobs', {
      userId: args.userId,
      sourceUrl: args.sourceUrl,
      rawText: args.rawText,
      structured: args.structured,
    });
    return id;
  },
});

export const listMine = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('jobs')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);
  },
});

export const getMineById = query({
  args: { userId: v.string(), id: v.id('jobs') },
  handler: async (ctx, { userId, id }) => {
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  },
});
