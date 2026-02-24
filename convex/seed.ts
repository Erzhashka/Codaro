import { mutation } from "./_generated/server";

export const bootstrap = mutation({
  args: {},
  handler: async (context) => {
    const existingCommunities = await context.db.query("communities").take(1);
    if (existingCommunities.length > 0) {
      return { seeded: false, reason: "Data already exists" };
    }

    const focusCommunityId = await context.db.insert("communities", {
      name: "Focus Hub",
      slug: "focus",
      description: "Deep work sessions and accountability circles.",
      interactionLabel: "Respect",
      metadata: { starter: true },
    });

    const fitnessCommunityId = await context.db.insert("communities", {
      name: "Fitness Clan",
      slug: "fitness",
      description: "Training streaks and weekly challenges.",
      interactionLabel: "Energy",
      metadata: { starter: true },
    });

    const creativeCommunityId = await context.db.insert("communities", {
      name: "Creative Loop",
      slug: "creative",
      description: "Daily prompts, feedback swaps, and shipping rituals.",
      interactionLabel: "Support",
      metadata: { starter: true },
    });

    const ariUserId = await context.db.insert("users", {
      displayName: "Ari",
      avatarUrl: undefined,
      activeCommunityId: focusCommunityId,
      isOnline: true,
      lastSeenAt: Date.now(),
      metadata: { role: "member" },
    });

    const nadiaUserId = await context.db.insert("users", {
      displayName: "Nadia",
      avatarUrl: undefined,
      activeCommunityId: focusCommunityId,
      isOnline: true,
      lastSeenAt: Date.now(),
      metadata: { role: "host" },
    });

    const miloUserId = await context.db.insert("users", {
      displayName: "Milo",
      avatarUrl: undefined,
      activeCommunityId: fitnessCommunityId,
      isOnline: false,
      lastSeenAt: Date.now() - 90_000,
      metadata: { role: "member" },
    });

    await context.db.insert("posts", {
      communityId: focusCommunityId,
      authorId: ariUserId,
      type: "text",
      body: "Shared my top ritual for staying consistent. Who else is doing a 25-minute sprint today?",
      attachments: undefined,
      interactionCount: 28,
      interactionLabel: "Respect",
      metadata: { tags: ["ritual", "focus"] },
    });

    await context.db.insert("posts", {
      communityId: focusCommunityId,
      authorId: nadiaUserId,
      type: "event",
      body: undefined,
      attachments: undefined,
      interactionCount: 16,
      interactionLabel: "Respect",
      metadata: {
        eventTitle: "Live Co-working Session",
        eventTime: "Today · 6:30 PM",
        eventLocation: "Room Alpha",
      },
    });

    await context.db.insert("posts", {
      communityId: fitnessCommunityId,
      authorId: miloUserId,
      type: "poll",
      body: undefined,
      attachments: undefined,
      interactionCount: 34,
      interactionLabel: "Energy",
      metadata: {
        question: "What should this weekend challenge focus on?",
        options: [
          { label: "Consistency", votes: 11 },
          { label: "Intensity", votes: 9 },
          { label: "Recovery", votes: 14 },
        ],
      },
    });

    await context.db.insert("posts", {
      communityId: creativeCommunityId,
      authorId: nadiaUserId,
      type: "text",
      body: "Tonight: share one draft and one feedback note in the loop.",
      attachments: undefined,
      interactionCount: 8,
      interactionLabel: "Support",
      metadata: { challenge: "feedback-swap" },
    });

    await context.db.insert("messages", {
      communityId: focusCommunityId,
      authorId: ariUserId,
      content: "Sprint room opens in 10 minutes.",
      metadata: { channel: "general" },
    });

    await context.db.insert("messages", {
      communityId: focusCommunityId,
      authorId: nadiaUserId,
      content: "Bringing a short planning template for everyone.",
      metadata: { channel: "general" },
    });

    return {
      seeded: true,
      counts: {
        communities: 3,
        users: 3,
        posts: 4,
        messages: 2,
      },
    };
  },
});