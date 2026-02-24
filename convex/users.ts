import { query } from "./_generated/server";
import { v } from "convex/values";

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