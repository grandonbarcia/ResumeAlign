import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    resumeId: v.id('resumes'),
    jobId: v.id('jobs'),
    tailored: v.any(),
    explanations: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error('Authentication required.');
    }

    const id = await ctx.db.insert('tailoringRuns', {
      userId,
      resumeId: args.resumeId,
      jobId: args.jobId,
      tailored: args.tailored,
      explanations: args.explanations,
      createdAt: Date.now(),
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
      .query('tailoringRuns')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);
  },
});

export const getMineById = query({
  args: { id: v.optional(v.id('tailoringRuns')) },
  handler: async (ctx, { id }) => {
    if (!id) return null;

    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  },
});
