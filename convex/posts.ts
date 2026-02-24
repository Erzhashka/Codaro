import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByCommunity = query({
  args: {
    communityId: v.id("communities"),
  },
  handler: async (context, args) => {
    const community = await context.db.get(args.communityId);
    if (!community) {
      return [];
    }

    const posts = await context.db
      .query("posts")
      .withIndex("by_community", (queryBuilder) => queryBuilder.eq("communityId", args.communityId))
      .order("desc")
      .take(50);

    return Promise.all(
      posts.map(async (postDocument) => {
        const author = await context.db.get(postDocument.authorId);
        return {
          ...postDocument,
          authorName: author?.displayName ?? "Unknown",
          communityName: community.name,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    communityId: v.id("communities"),
    authorId: v.id("users"),
    type: v.string(),
    body: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    interactionLabel: v.optional(v.string()),
    metadata: v.any(),
  },
  handler: async (context, args) => {
    const community = await context.db.get(args.communityId);
    const postId = await context.db.insert("posts", {
      communityId: args.communityId,
      authorId: args.authorId,
      type: args.type,
      body: args.body,
      attachments: args.attachments,
      interactionCount: 0,
      interactionLabel: args.interactionLabel ?? community?.interactionLabel ?? "Respect",
      metadata: args.metadata,
    });

    return postId;
  },
});