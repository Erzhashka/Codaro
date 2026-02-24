import { query } from "./_generated/server";
import { v } from "convex/values";

export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (context, args) => {
    return context.db
      .query("communities")
      .withIndex("by_slug", (queryBuilder) => queryBuilder.eq("slug", args.slug))
      .first();
  },
});

export const list = query({
  args: {},
  handler: async (context) => {
    return context.db.query("communities").collect();
  },
});