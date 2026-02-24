import { query } from "./_generated/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const listByCommunity = query({
  args: {
    communityId: v.id("communities"),
  },
  handler: async (context, args) => {
    return context.db
      .query("users")
      .withIndex("by_community", (queryBuilder) => queryBuilder.eq("activeCommunityId", args.communityId))
      .collect();
  },
});

export const create = mutation({
  args: {
    displayName: v.string(),
    communityId: v.optional(v.id("communities")),
  },
  handler: async (context, args) => {
    const now = Date.now();
    return context.db.insert("users", {
      displayName: args.displayName,
      avatarUrl: undefined,
      activeCommunityId: args.communityId,
      isOnline: true,
      lastSeenAt: now,
      metadata: { createdAt: now },
    });
  },
});

export const updateAvatar = mutation({
  args: {
    userId: v.id("users"),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (context, args) => {
    await context.db.patch(args.userId, { avatarUrl: args.avatarUrl });
  },
});