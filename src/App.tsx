import { useMutation, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Feed } from "./components/feed/Feed";
import { Layout } from "./components/layout/Layout";
import { useCommunity } from "./hooks/useCommunity";
import type { FeedPost, InteractionLabel } from "./types";
import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "./hooks/useSession";

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
  const { activeMode, activeConfig } = useCommunity("focus");
  const { session, setSession, clearSession } = useSession();
  const [messageDraft, setMessageDraft] = useState("");
  const [seedStateMessage, setSeedStateMessage] = useState("");
  const [postTypeDraft, setPostTypeDraft] = useState<"text" | "event" | "poll">("text");
  const [postContentDraft, setPostContentDraft] = useState("");
  const [composerStateMessage, setComposerStateMessage] = useState("");
  const [authName, setAuthName] = useState("");
  const [avatarInput, setAvatarInput] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomNameDraft, setRoomNameDraft] = useState("");
  const [authMessage, setAuthMessage] = useState("");

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
    community ? { communityId: community._id, roomId: selectedRoomId ?? undefined } : "skip",
  );
  const onlineMembersResponse = useQuery(
    anyApi.presence.getOnlineMembers,
    community ? { communityId: community._id } : "skip",
  );
  const roomsResponse = useQuery(
    anyApi.rooms.listByCommunity,
    community ? { communityId: community._id } : "skip",
  );

  const seedBootstrap = useMutation(anyApi.seed.bootstrap);
  const createPost = useMutation(anyApi.posts.create);
  const interactWithPost = useMutation(anyApi.presence.interactWithPost);
  const sendMessage = useMutation(anyApi.messages.send);
  const createUser = useMutation(anyApi.users.create);
  const updateAvatar = useMutation(anyApi.users.updateAvatar);
  const createRoom = useMutation(anyApi.rooms.create);
  const heartbeat = useMutation(anyApi.presence.heartbeat);

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

  const communityUsers = communityUsersResponse ?? [];
  const messages = messagesResponse ?? [];
  const onlineMembers = onlineMembersResponse ?? [];
  const rooms = roomsResponse ?? [];
  const currentUser = useMemo(
    () => communityUsers.find((user: any) => session && String(user._id) === session.userId),
    [communityUsers, session],
  );

  const onlineList = useMemo(() => onlineMembers, [onlineMembers]);
  const onlineCount = onlineList.length;

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(String(rooms[0]._id));
    }
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (!session || !community) return;
    heartbeat({ userId: session.userId as any, communityId: community._id }).catch(() => undefined);
    const intervalId = setInterval(() => {
      heartbeat({ userId: session.userId as any, communityId: community._id }).catch(() => undefined);
    }, 20000);
    return () => clearInterval(intervalId);
  }, [session, community, heartbeat]);

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
    if (!authorId || !session) {
      setComposerStateMessage("Sign up to create posts.");
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
      authorId: session.userId,
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
    if (!community || !messageDraft.trim() || !session) {
      return;
    }

    await sendMessage({
      communityId: community._id,
      authorId: session.userId,
      content: messageDraft.trim(),
      roomId: selectedRoomId ?? undefined,
      metadata: { source: "app" },
    });
    setMessageDraft("");
  };

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authName.trim()) return;
    const userId = await createUser({ displayName: authName.trim(), communityId: community?._id });
    setSession({ userId: String(userId), displayName: authName.trim() });
    setAuthMessage("Signed in.");
  };

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!community || !roomNameDraft.trim()) return;
    const slug = roomNameDraft.trim().toLowerCase().replace(/\s+/g, "-");
    const roomId = await createRoom({
      communityId: community._id,
      name: roomNameDraft.trim(),
      slug,
      metadata: { createdBy: session?.userId },
    });
    setRoomNameDraft("");
    setSelectedRoomId(String(roomId));
  };

  return (
    <Layout
      appTitle="Nexus Core"
      appSubtitle="Adaptive social base for rapid pivoting"
      modeSelector={null}
      navigationItems={activeConfig.navigationItems}
    >
      <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{activeConfig.title}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activeConfig.description}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Vibe interaction label: {activeConfig.interactionLabel}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Online now: {onlineCount}</p>
        <div className="mt-3 flex items-center gap-3">
          <button
            className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            onClick={handleSeedData}
            type="button"
          >
            Seed Sample Data
          </button>
          {seedStateMessage ? <span className="text-xs text-slate-500 dark:text-slate-400">{seedStateMessage}</span> : null}
        </div>
      </header>

      <Routes>
        <Route
          element={
            <>
              <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Create Post</h2>
                <form className="mt-3 grid gap-2" onSubmit={handleCreatePost}>
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring dark:border-slate-800 dark:bg-slate-950"
                    onChange={(event) => setPostTypeDraft(event.target.value as "text" | "event" | "poll")}
                    value={postTypeDraft}
                  >
                    <option value="text">Text</option>
                    <option value="event">Event</option>
                    <option value="poll">Poll</option>
                  </select>
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring dark:border-slate-800 dark:bg-slate-950"
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
                    <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900" type="submit">
                      Publish
                    </button>
                    {composerStateMessage ? <span className="text-xs text-slate-500 dark:text-slate-400">{composerStateMessage}</span> : null}
                  </div>
                </form>
              </section>

              <Feed onInteract={handleInteraction} posts={posts} />
            </>
          }
          path="/"
        />

        <Route
          element={
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900" id="rooms">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Rooms</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {rooms.map((room: any) => {
                  const isActive = String(room._id) === selectedRoomId;
                  return (
                    <button
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        isActive
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      }`}
                      key={String(room._id)}
                      onClick={() => setSelectedRoomId(String(room._id))}
                      type="button"
                    >
                      {room.name}
                    </button>
                  );
                })}
                {rooms.length === 0 ? <span className="text-xs text-slate-500 dark:text-slate-400">No rooms yet.</span> : null}
              </div>

              <form className="mt-3 flex gap-2" onSubmit={handleCreateRoom}>
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring dark:border-slate-800 dark:bg-slate-950"
                  onChange={(event) => setRoomNameDraft(event.target.value)}
                  placeholder="Create a room (e.g., design, general)"
                  value={roomNameDraft}
                />
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900" type="submit">
                  Create
                </button>
              </form>

              <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">Live Messages</h3>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto">
                {messages.map((message: any) => (
                  <p className="text-sm text-slate-700 dark:text-slate-200" key={String(message._id)}>
                    <span className="font-medium text-slate-900 dark:text-white">{message.authorName}:</span> {message.content}
                  </p>
                ))}
                {messages.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet.</p> : null}
              </div>

              <form className="mt-3 flex gap-2" onSubmit={handleSendMessage}>
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring dark:border-slate-800 dark:bg-slate-950"
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder="Write a message"
                  value={messageDraft}
                />
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900" type="submit">
                  Send
                </button>
                {!session ? <span className="text-xs text-slate-500 dark:text-slate-400">Sign up to chat.</span> : null}
              </form>
            </section>
          }
          path="/rooms"
        />

        <Route
          element={
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900" id="presence">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Online</h2>
              <div className="mt-3 space-y-2">
                {onlineList.map((member: any) => {
                  const lastSeenLabel = member.lastSeenAt
                    ? new Date(member.lastSeenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Active";
                  return (
                    <div
                      className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800"
                      key={String(member._id)}
                    >
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{member.displayName}</span>
                      <span className="text-xs text-emerald-600">Active {lastSeenLabel}</span>
                    </div>
                  );
                })}
                {onlineList.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No one is online right now.</p> : null}
              </div>
            </section>
          }
          path="/online"
        />

        <Route
          element={
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900" id="profile">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Profile</h2>
              {session ? (
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      {currentUser?.avatarUrl ? (
                        <img alt="Avatar" className="h-full w-full object-cover" src={currentUser.avatarUrl} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {session.displayName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-slate-700 dark:text-slate-200">Name: {session.displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">User ID: {session.userId}</p>
                    </div>
                  </div>
                  <form
                    className="space-y-2"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (!session) return;
                      await updateAvatar({ userId: session.userId as any, avatarUrl: avatarInput.trim() || undefined });
                      setAvatarInput("");
                      setAuthMessage("Avatar updated");
                    }}
                  >
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring dark:border-slate-800 dark:bg-slate-950"
                      onChange={(event) => setAvatarInput(event.target.value)}
                      placeholder="Paste image URL for your avatar"
                      value={avatarInput}
                    />
                    <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900" type="submit">
                      Save avatar
                    </button>
                  </form>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Active mode: {activeConfig.title}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Interaction label: {activeConfig.interactionLabel}</p>
                  <button
                    className="mt-2 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white dark:bg-slate-100 dark:text-slate-900"
                    onClick={clearSession}
                    type="button"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <form className="mt-3 space-y-2" onSubmit={handleAuth}>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring dark:border-slate-800 dark:bg-slate-950"
                    onChange={(event) => setAuthName(event.target.value)}
                    placeholder="Choose a display name"
                    value={authName}
                  />
                  <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-100 dark:text-slate-900" type="submit">
                    Sign up / Log in
                  </button>
                  {authMessage ? <p className="text-xs text-slate-500 dark:text-slate-400">{authMessage}</p> : null}
                  <p className="text-xs text-slate-500 dark:text-slate-400">Creates a lightweight profile (no email required).</p>
                </form>
              )}
            </section>
          }
          path="/profile"
        />

        <Route element={<Navigate to="/" replace />} path="*" />
      </Routes>
    </Layout>
  );
}