import { useState, useCallback } from "react";
import { MOCK_POSTS } from "@/lib/mockData";
import type { Post } from "@/types";

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

function applyUserData(posts: Post[]): Post[] {
  const reactions = getStoredReactions();
  const discussions = getStoredDiscussions();
  return posts.map((p) => ({
    ...p,
    reactions: {
      positive: {
        ...p.reactions.positive,
        userReacted: reactions[p.id] === "positive",
      },
      negative: {
        ...p.reactions.negative,
        userReacted: reactions[p.id] === "negative",
      },
    },
    isFollowingDiscussion: discussions.includes(p.id),
  }));
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>(() => applyUserData(MOCK_POSTS));

  const react = useCallback(
    (postId: string, reactionType: "positive" | "negative") => {
      const reactions = getStoredReactions();
      const current = reactions[postId];

      if (current === reactionType) {
        delete reactions[postId];
      } else {
        reactions[postId] = reactionType;
      }
      localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions));

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const wasPositive = p.reactions.positive.userReacted;
          const wasNegative = p.reactions.negative.userReacted;
          const newReaction = reactions[postId];

          return {
            ...p,
            reactions: {
              positive: {
                ...p.reactions.positive,
                userReacted: newReaction === "positive",
                count:
                  p.reactions.positive.count +
                  (newReaction === "positive" ? 1 : wasPositive ? -1 : 0),
              },
              negative: {
                ...p.reactions.negative,
                userReacted: newReaction === "negative",
                count:
                  p.reactions.negative.count +
                  (newReaction === "negative" ? 1 : wasNegative ? -1 : 0),
              },
            },
          };
        })
      );
    },
    []
  );

  const toggleDiscussion = useCallback((postId: string) => {
    const discussions = getStoredDiscussions();
    const idx = discussions.indexOf(postId);
    if (idx >= 0) {
      discussions.splice(idx, 1);
    } else {
      discussions.push(postId);
    }
    localStorage.setItem(DISCUSSIONS_KEY, JSON.stringify(discussions));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isFollowingDiscussion: discussions.includes(postId) }
          : p
      )
    );
  }, []);

  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return { posts, react, toggleDiscussion, addPost };
}
