import BubblePostItem from "./BubblePostItem";
import type { Post } from "@/types";

interface PostFeedProps {
  posts: Post[];
  onReact: (postId: string, type: "positive" | "negative") => void;
  onToggleDiscussion: (postId: string) => void;
  emptyMessage?: string;
}

export default function PostFeed({
  posts,
  emptyMessage = "No posts yet.",
}: PostFeedProps) {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[hsl(var(--text-muted))] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="pt-4">
      {posts.map((post, index) => (
        <BubblePostItem
          key={post.id}
          post={post}
          index={index}
        />
      ))}
    </div>
  );
}
