import { useMutation, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { FormEvent, useMemo, useState } from "react";
import { Feed } from "./components/feed/Feed";
import { Layout } from "./components/layout/Layout";
import { useCommunity } from "./hooks/useCommunity";
import type { FeedPost, InteractionLabel } from "./types";

type PostMetadata = {
  eventTitle?: string;
  eventTime?: string;
  eventLocation?: string;
  question?: string;
  options?: Array<{ label: string; votes: number }>;
};

function toInteractionLabel(value: string): InteractionLabel {
  if (value === "Respect" || value === "Support" || value === "Energy") {
    return value;
  }
  return "Respect";
}

function toPostMetadata(value: unknown): PostMetadata {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as PostMetadata;
}

export default function App() {
  const { activeMode, availableModes, activeConfig, switchMode } = useCommunity("focus");
  const [messageDraft, setMessageDraft] = useState("");
  const [seedStateMessage, setSeedStateMessage] = useState("");
  const [postTypeDraft, setPostTypeDraft] = useState<"text" | "event" | "poll">("text");
  const [postContentDraft, setPostContentDraft] = useState("");
  const [composerStateMessage, setComposerStateMessage] = useState("");

  const community = useQuery(anyApi.communities.getBySlug, { slug: activeMode });
  const communityUsersResponse = useQuery(
    anyApi.users.listByCommunity,
    community ? { communityId: community._id } : "skip",
  );
  const postsResponse = useQuery(
    anyApi.posts.listByCommunity,
    community ? { communityId: community._id } : "skip",
  );
  const messagesResponse = useQuery(
    anyApi.messages.listByCommunity,
    community ? { communityId: community._id } : "skip",
  );
  const onlineMembersResponse = useQuery(
    anyApi.presence.getOnlineMembers,
    community ? { communityId: community._id } : "skip",
  );

  const seedBootstrap = useMutation(anyApi.seed.bootstrap);
  const createPost = useMutation(anyApi.posts.create);
  const interactWithPost = useMutation(anyApi.presence.interactWithPost);
  const sendMessage = useMutation(anyApi.messages.send);

  const posts: FeedPost[] = useMemo(() => {
    if (!postsResponse) {
      return [];
    }

    return postsResponse.map((postDocument: any) => {
      const metadata = toPostMetadata(postDocument.metadata);
      const commonPostFields = {
        id: String(postDocument._id),
        authorName: postDocument.authorName,
        communityName: postDocument.communityName,
        createdAt: postDocument._creationTime,
        interactionLabel: toInteractionLabel(postDocument.interactionLabel),
        interactionCount: postDocument.interactionCount,
        metadata: postDocument.metadata,
      };

      if (postDocument.type === "event") {
        return {
          ...commonPostFields,
          type: "event" as const,
          eventTitle: metadata.eventTitle ?? "Community Event",
          eventTime: metadata.eventTime ?? "TBD",
          eventLocation: metadata.eventLocation ?? "Main Room",
        };
      }

      if (postDocument.type === "poll") {
        return {
          ...commonPostFields,
          type: "poll" as const,
          question: metadata.question ?? "Vote on the next challenge",
          options: metadata.options ?? [],
        };
      }

      return {
        ...commonPostFields,
        type: "text" as const,
        body: postDocument.body ?? "",
      };
    });
  }, [postsResponse]);

  const onlineCount = onlineMembersResponse?.length ?? 0;
  const communityUsers = communityUsersResponse ?? [];
  const messages = messagesResponse ?? [];

  const handleSeedData = async () => {
    const result = await seedBootstrap({});
    if (result.seeded) {
      setSeedStateMessage("Sample data seeded.");
      return;
    }
    setSeedStateMessage("Sample data already exists.");
  };

  const handleInteraction = async (postId: string, interactionDelta: number) => {
    await interactWithPost({ postId, interactionDelta });
  };

  const handleCreatePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setComposerStateMessage("");

    if (!community) {
      setComposerStateMessage("Community not ready yet.");
      return;
    }

    const authorId = communityUsers[0]?._id;
    if (!authorId) {
      setComposerStateMessage("Seed sample data first to create posts.");
      return;
    }

    const normalizedContent = postContentDraft.trim();
    if (!normalizedContent) {
      return;
    }

    const postMetadata =
      postTypeDraft === "event"
        ? {
            eventTitle: normalizedContent,
            eventTime: "TBD",
            eventLocation: "Main Room",
          }
        : postTypeDraft === "poll"
          ? {
              question: normalizedContent,
              options: [
                { label: "Option A", votes: 0 },
                { label: "Option B", votes: 0 },
              ],
            }
          : {
              source: "composer",
            };

    await createPost({
      communityId: community._id,
      authorId,
      type: postTypeDraft,
      body: postTypeDraft === "text" ? normalizedContent : undefined,
      attachments: undefined,
      interactionLabel: activeConfig.interactionLabel,
      metadata: postMetadata,
    });

    setPostContentDraft("");
    setComposerStateMessage("Post created.");
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!community || !messageDraft.trim()) {
      return;
    }

    const fallbackAuthorId = communityUsers[0]?._id ?? postsResponse?.[0]?.authorId;
    if (!fallbackAuthorId) {
      return;
    }

    await sendMessage({
      communityId: community._id,
      authorId: fallbackAuthorId,
      content: messageDraft.trim(),
      metadata: { source: "app" },
    });
    setMessageDraft("");
  };

  return (
    <Layout
      appTitle="Nexus Core"
      appSubtitle="Adaptive social base for rapid pivoting"
      modeSelector={
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Niche Mode</p>
          <div className="flex flex-wrap gap-2">
            {availableModes.map((mode) => {
              const isActive = mode === activeMode;
              return (
                <button
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  key={mode}
                  onClick={() => switchMode(mode)}
                  type="button"
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>
      }
      navigationItems={activeConfig.navigationItems}
    >
      <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">{activeConfig.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{activeConfig.description}</p>
        <p className="mt-2 text-xs text-slate-500">Vibe interaction label: {activeConfig.interactionLabel}</p>
        <p className="mt-1 text-xs text-slate-500">Online now: {onlineCount}</p>
        <div className="mt-3 flex items-center gap-3">
          <button
            className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white transition hover:bg-slate-700"
            onClick={handleSeedData}
            type="button"
          >
            Seed Sample Data
          </button>
          {seedStateMessage ? <span className="text-xs text-slate-500">{seedStateMessage}</span> : null}
        </div>
      </header>

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Create Post</h2>
        <form className="mt-3 grid gap-2" onSubmit={handleCreatePost}>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
            onChange={(event) => setPostTypeDraft(event.target.value as "text" | "event" | "poll")}
            value={postTypeDraft}
          >
            <option value="text">Text</option>
            <option value="event">Event</option>
            <option value="poll">Poll</option>
          </select>
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
            onChange={(event) => setPostContentDraft(event.target.value)}
            placeholder={
              postTypeDraft === "text"
                ? "Share an update"
                : postTypeDraft === "event"
                  ? "Event title"
                  : "Poll question"
            }
            value={postContentDraft}
          />
          <div className="flex items-center gap-2">
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white" type="submit">
              Publish
            </button>
            {composerStateMessage ? <span className="text-xs text-slate-500">{composerStateMessage}</span> : null}
          </div>
        </form>
      </section>

      <Feed onInteract={handleInteraction} posts={posts} />

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" id="rooms">
        <h2 className="text-sm font-semibold text-slate-900">Live Messages</h2>
        <div className="mt-3 max-h-40 space-y-2 overflow-auto">
          {messages.map((message: any) => (
            <p className="text-sm text-slate-700" key={String(message._id)}>
              <span className="font-medium text-slate-900">{message.authorName}:</span> {message.content}
            </p>
          ))}
          {messages.length === 0 ? <p className="text-sm text-slate-500">No messages yet.</p> : null}
        </div>

        <form className="mt-3 flex gap-2" onSubmit={handleSendMessage}>
          <input
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring"
            onChange={(event) => setMessageDraft(event.target.value)}
            placeholder="Write a message"
            value={messageDraft}
          />
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white" type="submit">
            Send
          </button>
        </form>
      </section>
    </Layout>
  );
}