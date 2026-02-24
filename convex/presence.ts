import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ONLINE_WINDOW_MS = 45_000;

export const heartbeat = mutation({
  args: {
    userId: v.id("users"),
    communityId: v.id("communities"),
  },
  handler: async (context, args) => {
    await context.db.patch(args.userId, {
      activeCommunityId: args.communityId,
      isOnline: true,
      lastSeenAt: Date.now(),
    });
  },
});

export const getOnlineMembers = query({
  args: {
    communityId: v.id("communities"),
  },
  handler: async (context, args) => {
    const threshold = Date.now() - ONLINE_WINDOW_MS;
    const members = await context.db
      .query("users")
      .withIndex("by_community", (queryBuilder) => queryBuilder.eq("activeCommunityId", args.communityId))
      .collect();

    return members.filter((member) => member.isOnline && member.lastSeenAt >= threshold);
  },
});

export const interactWithPost = mutation({
  args: {
    postId: v.id("posts"),
    interactionDelta: v.number(),
  },
  handler: async (context, args) => {
    const post = await context.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const nextCount = Math.max(0, post.interactionCount + args.interactionDelta);
    await context.db.patch(args.postId, {
      interactionCount: nextCount,
    });
  },
});