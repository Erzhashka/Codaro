import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    activeCommunityId: v.optional(v.id("communities")),
    isOnline: v.boolean(),
    lastSeenAt: v.number(),
    metadata: v.any(),
  })
    .index("by_community", ["activeCommunityId"])
    .index("by_online", ["isOnline"]),

  communities: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    interactionLabel: v.string(),
    metadata: v.any(),
  }).index("by_slug", ["slug"]),

  posts: defineTable({
    communityId: v.id("communities"),
    authorId: v.id("users"),
    type: v.string(),
    body: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    interactionCount: v.number(),
    interactionLabel: v.string(),
    metadata: v.any(),
  })
    .index("by_community", ["communityId"])
    .index("by_author", ["authorId"]),

  messages: defineTable({
    communityId: v.id("communities"),
    authorId: v.id("users"),
    content: v.string(),
    metadata: v.any(),
  }).index("by_community", ["communityId"]),
});