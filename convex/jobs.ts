import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    sourceUrl: v.optional(v.string()),
    rawText: v.string(),
    structured: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error('Authentication required.');
    }

    const id = await ctx.db.insert('jobs', {
      userId,
      sourceUrl: args.sourceUrl,
      rawText: args.rawText,
      structured: args.structured,
    });
    return id;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    return await ctx.db
      .query('jobs')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);
  },
});

export const getMineById = query({
  args: { id: v.id('jobs') },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  },
});
