import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByCommunity = query({
  args: {
    communityId: v.id("communities"),
  },
  handler: async (context, args) => {
    const messages = await context.db
      .query("messages")
      .withIndex("by_community", (queryBuilder) => queryBuilder.eq("communityId", args.communityId))
      .order("desc")
      .take(30);

    const hydratedMessages = await Promise.all(
      messages.map(async (messageDocument) => {
        const author = await context.db.get(messageDocument.authorId);
        return {
          ...messageDocument,
          authorName: author?.displayName ?? "Unknown",
        };
      }),
    );

    return hydratedMessages.reverse();
  },
});

export const send = mutation({
  args: {
    communityId: v.id("communities"),
    authorId: v.id("users"),
    content: v.string(),
    metadata: v.any(),
  },
  handler: async (context, args) => {
    const messageId = await context.db.insert("messages", {
      communityId: args.communityId,
      authorId: args.authorId,
      content: args.content,
      metadata: args.metadata,
    });

    return messageId;
  },
});