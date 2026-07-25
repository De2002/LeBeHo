import { useState, useCallback, useEffect } from "react";
import { fetchPosts, rowToPost } from "@/lib/postService";
import { fetchUserReactions, toggleReaction, type ReactionType } from "@/lib/reactionService";
import { useAuth } from "@/hooks/useAuth";
import type { Post, Category } from "@/types";
import { toast } from "sonner";

const DISCUSSIONS_KEY = "lebehо_discussions";

function getStoredDiscussions(): string[] {
  try {
    const stored = localStorage.getItem(DISCUSSIONS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function usePosts(opts?: { category?: Category | null; userId?: string }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchPosts({ category: opts?.category, userId: opts?.userId });
      const followedDiscussions = getStoredDiscussions();

      // Fetch per-user reactions from Supabase if logged in
      let userReactions: Record<string, ReactionType> = {};
      if (user?.id && rows.length > 0) {
        userReactions = await fetchUserReactions(user.id, rows.map((r) => r.id));
      }

      const mapped = rows.map((row) => rowToPost(row, userReactions, followedDiscussions));
      setPosts(mapped);
    } catch (err: unknown) {
      console.error("Failed to load posts:", err);
      setError("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, [opts?.category, opts?.userId, user?.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const react = useCallback(
    async (postId: string, reactionType: "positive" | "negative") => {
      if (!user) {
        toast.error("Sign in to react to posts.");
        return;
      }

      // Determine current state from the local posts list
      const currentPost = posts.find((p) => p.id === postId);
      if (!currentPost) return;

      const currentType: ReactionType | null = currentPost.reactions.positive.userReacted
        ? "positive"
        : currentPost.reactions.negative.userReacted
        ? "negative"
        : null;

      // Compute deltas for optimistic update
      let positiveDelta = 0;
      let negativeDelta = 0;
      let newType: ReactionType | null;

      if (currentType === reactionType) {
        // Un-react
        newType = null;
        if (reactionType === "positive") positiveDelta = -1;
        else negativeDelta = -1;
      } else {
        newType = reactionType;
        if (currentType === "positive") positiveDelta = -1;
        else if (currentType === "negative") negativeDelta = -1;
        if (reactionType === "positive") positiveDelta += 1;
        else negativeDelta += 1;
      }

      // Optimistic UI update immediately
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            reactions: {
              positive: {
                ...p.reactions.positive,
                userReacted: newType === "positive",
                count: Math.max(0, p.reactions.positive.count + positiveDelta),
              },
              negative: {
                ...p.reactions.negative,
                userReacted: newType === "negative",
                count: Math.max(0, p.reactions.negative.count + negativeDelta),
              },
            },
          };
        })
      );

      // Persist to Supabase
      try {
        await toggleReaction(user.id, postId, reactionType, currentType);
      } catch (err) {
        console.error("Failed to persist reaction:", err);
        toast.error("Failed to save reaction.");
        // Revert optimistic update
        loadPosts();
      }
    },
    [user, posts, loadPosts]
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

  const prependPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return { posts, loading, error, react, toggleDiscussion, prependPost, reload: loadPosts };
}
