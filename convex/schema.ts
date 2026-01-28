import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  resumes: defineTable({
    userId: v.string(),
    filename: v.optional(v.string()),
    originalText: v.string(),
    parsed: v.optional(v.any()),
  }).index('by_user', ['userId']),

  jobs: defineTable({
    userId: v.string(),
    sourceUrl: v.optional(v.string()),
    rawText: v.string(),
    structured: v.optional(v.any()),
  }).index('by_user', ['userId']),

  tailoringRuns: defineTable({
    userId: v.string(),
    resumeId: v.id('resumes'),
    jobId: v.id('jobs'),
    tailored: v.any(),
    explanations: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_resume', ['resumeId'])
    .index('by_job', ['jobId']),
});
