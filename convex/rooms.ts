import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByCommunity = query({
  args: {
    communityId: v.id("communities"),
  },
  handler: async (context, args) => {
    return context.db
      .query("rooms")
      .withIndex("by_community", (queryBuilder) => queryBuilder.eq("communityId", args.communityId))
      .collect();
  },
});

export const create = mutation({
  args: {
    communityId: v.id("communities"),
    name: v.string(),
    slug: v.string(),
    metadata: v.any(),
  },
  handler: async (context, args) => {
    const existing = await context.db
      .query("rooms")
      .withIndex("by_slug", (queryBuilder) => queryBuilder.eq("slug", args.slug))
      .first();
    if (existing) {
      return existing._id;
    }

    return context.db.insert("rooms", {
      communityId: args.communityId,
      name: args.name,
      slug: args.slug,
      metadata: args.metadata,
    });
  },
});