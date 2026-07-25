import { useEffect } from "react";
import PostItem from "./PostItem";
import type { Post } from "@/types";

declare global {
  interface Window {
    __semio__helpers_counter?: (siteId: string) => void;
    graphcomment_counter?: () => void;
  }
}

// Load GraphComment counter script once per mount
function useGraphCommentCounter() {
  useEffect(() => {
    if (document.getElementById("gc-counter-script")) {
      // Already loaded — just re-run the counter
      window.graphcomment_counter?.();
      return;
    }

    const script = document.createElement("script");
    script.id = "gc-counter-script";
    script.type = "text/javascript";
    script.async = true;
    script.defer = true;
    script.src = "https://integration.graphcomment.com/helpers_counter.js?" + Date.now();
    script.onload = () => {
      window.__semio__helpers_counter?.("LeBeHo");
    };
    (document.head || document.body).appendChild(script);
  }, []);
}

interface PostFeedProps {
  posts: Post[];
  onReact: (postId: string, type: "positive" | "negative") => void;
  onToggleDiscussion: (postId: string) => void;
  emptyMessage?: string;
}

export default function PostFeed({
  posts,
  onReact,
  onToggleDiscussion,
  emptyMessage = "No posts yet.",
}: PostFeedProps) {
  useGraphCommentCounter();

  // Re-run counter when posts list changes so new gc-counter elements are filled
  useEffect(() => {
    window.graphcomment_counter?.();
  }, [posts]);
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[hsl(var(--text-muted))] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          onReact={onReact}
          onToggleDiscussion={onToggleDiscussion}
          preview
        />
      ))}
    </div>
  );
}
