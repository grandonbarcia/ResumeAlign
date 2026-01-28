import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    userId: v.string(),
    filename: v.optional(v.string()),
    originalText: v.string(),
    parsed: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('resumes', {
      userId: args.userId,
      filename: args.filename,
      originalText: args.originalText,
      parsed: args.parsed,
    });
    return id;
  },
});

export const listMine = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('resumes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);
  },
});

export const getMineById = query({
  args: { userId: v.string(), id: v.id('resumes') },
  handler: async (ctx, { userId, id }) => {
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  },
});
