import { useState, useCallback, useEffect } from "react";
import { fetchPosts, rowToPost } from "@/lib/postService";
import { fetchUserReactions, toggleReaction, type ReactionType } from "@/lib/reactionService";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Post, Category } from "@/types";
import { toast } from "sonner";

async function getFollowedDiscussions(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("discussion_follows")
    .select("post_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[getFollowedDiscussions] Error:", error);
    return [];
  }

  return data?.map((row) => row.post_id) || [];
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

      // Fetch per-user reactions from Supabase if logged in
      let userReactions: Record<string, ReactionType> = {};
      let followedDiscussions: string[] = [];
      
      if (user?.id) {
        if (rows.length > 0) {
          userReactions = await fetchUserReactions(user.id, rows.map((r) => r.id));
        }
        followedDiscussions = await getFollowedDiscussions(user.id);
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

  const toggleDiscussion = useCallback(
    async (postId: string) => {
      if (!user?.id) {
        toast.error("Sign in to follow discussions.");
        return;
      }

      try {
        const currentPost = posts.find((p) => p.id === postId);
        const isCurrentlyFollowing = currentPost?.isFollowingDiscussion || false;

        if (isCurrentlyFollowing) {
          // Unfollow
          const { error } = await supabase
            .from("discussion_follows")
            .delete()
            .eq("user_id", user.id)
            .eq("post_id", postId);

          if (error) throw error;
        } else {
          // Follow
          const { error } = await supabase
            .from("discussion_follows")
            .insert({ user_id: user.id, post_id: postId });

          if (error) throw error;
        }

        // Update local state
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, isFollowingDiscussion: !isCurrentlyFollowing } : p
          )
        );
      } catch (err) {
        console.error("[toggleDiscussion] Error:", err);
        toast.error("Failed to update discussion follow.");
      }
    },
    [user?.id, posts]
  );

  const prependPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return { posts, loading, error, react, toggleDiscussion, prependPost, reload: loadPosts };
}
