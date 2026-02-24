export type InteractionLabel = "Respect" | "Support" | "Energy";

export type NicheMode = "focus" | "fitness" | "creative";

export type FeedPostType = "text" | "event" | "poll";

export type FeedPostBase = {
  id: string;
  authorName: string;
  communityName: string;
  type: FeedPostType;
  createdAt: number;
  interactionLabel: InteractionLabel;
  interactionCount: number;
  metadata?: Record<string, unknown>;
};

export type TextFeedPost = FeedPostBase & {
  type: "text";
  body: string;
};

export type EventFeedPost = FeedPostBase & {
  type: "event";
  eventTitle: string;
  eventTime: string;
  eventLocation: string;
};

export type PollFeedPost = FeedPostBase & {
  type: "poll";
  question: string;
  options: Array<{ label: string; votes: number }>;
};

export type FeedPost = TextFeedPost | EventFeedPost | PollFeedPost;

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
};

export type NicheModeConfig = {
  mode: NicheMode;
  title: string;
  description: string;
  interactionLabel: InteractionLabel;
  navigationItems: NavigationItem[];
};