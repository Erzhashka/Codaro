import type { FC, ReactNode } from "react";
import type { EventFeedPost, FeedPost, FeedPostType, PollFeedPost, TextFeedPost } from "../../types";

type FeedProps = {
  posts: FeedPost[];
  onInteract?: (postId: string, interactionDelta: number) => void;
};

type InteractionHandlerProps = {
  onInteract?: (postId: string, interactionDelta: number) => void;
};

function BaseCard({ children }: { children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {children}
    </article>
  );
}

const TextPostCard: FC<{ post: TextFeedPost } & InteractionHandlerProps> = ({
  post,
  onInteract,
}) => {
  return (
    <BaseCard>
      <header className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800 dark:text-white">{post.authorName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{post.communityName}</p>
      </header>
      <p className="text-sm text-slate-700 dark:text-slate-200">{post.body}</p>
      <footer className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {post.interactionLabel}: {post.interactionCount}
        </span>
        <button
          className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => onInteract?.(post.id, 1)}
          type="button"
        >
          + {post.interactionLabel}
        </button>
      </footer>
    </BaseCard>
  );
};

const EventPostCard: FC<{ post: EventFeedPost } & InteractionHandlerProps> = ({
  post,
  onInteract,
}) => {
  return (
    <BaseCard>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Event</p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{post.eventTitle}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {post.eventTime} · {post.eventLocation}
      </p>
      <footer className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {post.interactionLabel}: {post.interactionCount}
        </span>
        <button
          className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => onInteract?.(post.id, 1)}
          type="button"
        >
          + {post.interactionLabel}
        </button>
      </footer>
    </BaseCard>
  );
};

const PollPostCard: FC<{ post: PollFeedPost } & InteractionHandlerProps> = ({
  post,
  onInteract,
}) => {
  return (
    <BaseCard>
      <p className="text-sm font-medium text-slate-900 dark:text-white">{post.question}</p>
      <div className="mt-3 space-y-2">
        {post.options.map((option) => (
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200" key={option.label}>
            {option.label}
            <span className="float-right text-slate-500 dark:text-slate-400">{option.votes}</span>
          </div>
        ))}
      </div>
      <footer className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {post.interactionLabel}: {post.interactionCount}
        </span>
        <button
          className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => onInteract?.(post.id, 1)}
          type="button"
        >
          + {post.interactionLabel}
        </button>
      </footer>
    </BaseCard>
  );
};

type PostRendererMap = {
  [Key in FeedPostType]: FC<{ post: Extract<FeedPost, { type: Key }> } & InteractionHandlerProps>;
};

const postRenderers: PostRendererMap = {
  text: TextPostCard,
  event: EventPostCard,
  poll: PollPostCard,
};

export function Feed({ posts, onInteract }: FeedProps) {
  return (
    <section className="space-y-3" id="feed">
      {posts.map((post) => {
        const PostCard = postRenderers[post.type] as FC<{ post: FeedPost } & InteractionHandlerProps>;
        return <PostCard key={post.id} post={post} onInteract={onInteract} />;
      })}
    </section>
  );
}