import { useState, useCallback, useEffect } from "react";
import { fetchPosts, updateReaction, rowToPost } from "@/lib/postService";
import type { Post, Category } from "@/types";

const REACTIONS_KEY = "lebehо_reactions";
const DISCUSSIONS_KEY = "lebehо_discussions";

function getStoredReactions(): Record<string, "positive" | "negative"> {
  try {
    const stored = localStorage.getItem(REACTIONS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function getStoredDiscussions(): string[] {
  try {
    const stored = localStorage.getItem(DISCUSSIONS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function usePosts(opts?: { category?: Category | null; userId?: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchPosts({ category: opts?.category, userId: opts?.userId });
      const userReactions = getStoredReactions();
      const followedDiscussions = getStoredDiscussions();
      const mapped = rows.map((row) => rowToPost(row, userReactions, followedDiscussions));
      setPosts(mapped);
    } catch (err: unknown) {
      console.error("Failed to load posts:", err);
      setError("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, [opts?.category, opts?.userId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const react = useCallback(
    (postId: string, reactionType: "positive" | "negative") => {
      const reactions = getStoredReactions();
      const current = reactions[postId];
      let positiveDelta = 0;
      let negativeDelta = 0;

      if (current === reactionType) {
        // Un-react
        delete reactions[postId];
        if (reactionType === "positive") positiveDelta = -1;
        else negativeDelta = -1;
      } else {
        // Switch or new reaction
        if (current === "positive") positiveDelta = -1;
        else if (current === "negative") negativeDelta = -1;
        reactions[postId] = reactionType;
        if (reactionType === "positive") positiveDelta += 1;
        else negativeDelta += 1;
      }

      localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions));

      // Optimistic UI update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const newReaction = reactions[postId];
          return {
            ...p,
            reactions: {
              positive: {
                ...p.reactions.positive,
                userReacted: newReaction === "positive",
                count: Math.max(0, p.reactions.positive.count + positiveDelta),
              },
              negative: {
                ...p.reactions.negative,
                userReacted: newReaction === "negative",
                count: Math.max(0, p.reactions.negative.count + negativeDelta),
              },
            },
          };
        })
      );

      // Persist to DB (fire-and-forget; don't block UI)
      updateReaction(postId, { positive: positiveDelta, negative: negativeDelta }).catch(
        (err) => console.error("Failed to persist reaction:", err)
      );
    },
    []
  );

  const toggleDiscussion = useCallback((postId: string) => {
    const discussions = getStoredDiscussions();
    const idx = discussions.indexOf(postId);
    if (idx >= 0) discussions.splice(idx, 1);
    else discussions.push(postId);
    localStorage.setItem(DISCUSSIONS_KEY, JSON.stringify(discussions));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isFollowingDiscussion: discussions.includes(postId) }
          : p
      )
    );
  }, []);

  // Called after a new post is created — prepends it locally without a full reload
  const prependPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return { posts, loading, error, react, toggleDiscussion, prependPost, reload: loadPosts };
}
