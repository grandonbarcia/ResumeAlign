import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    userId: v.string(),
    resumeId: v.id('resumes'),
    jobId: v.id('jobs'),
    tailored: v.any(),
    explanations: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('tailoringRuns', {
      userId: args.userId,
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
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('tailoringRuns')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);
  },
});

export const getMineById = query({
  args: { userId: v.string(), id: v.id('tailoringRuns') },
  handler: async (ctx, { userId, id }) => {
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  },
});
