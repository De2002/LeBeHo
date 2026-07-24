import { Heart } from "lucide-react";
import { useState } from "react";
import { timeAgo, formatCount } from "@/lib/utils";
import TrustScore from "./TrustScore";
import type { Comment } from "@/types";
import { Link } from "react-router-dom";

interface CommentItemProps {
  comment: Comment;
}

export default function CommentItem({ comment }: CommentItemProps) {
  const [liked, setLiked] = useState(comment.userLiked);
  const [likeCount, setLikeCount] = useState(comment.likesCount);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <div className="flex gap-3 py-4 lb-divider-subtle last:border-0">
      <Link to={`/profile/${comment.author.username}`} className="flex-shrink-0">
        <img
          src={comment.author.avatar}
          alt={comment.author.displayName}
          className="w-7 h-7 rounded-full object-cover"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            to={`/profile/${comment.author.username}`}
            className="text-sm font-semibold text-[hsl(var(--text-primary))] hover:underline"
          >
            {comment.author.displayName}
          </Link>
          <TrustScore score={comment.author.trustScore} />
          <span className="text-xs text-[hsl(var(--text-muted))]">
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
          {comment.content}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleLike}
            className={`inline-flex items-center gap-1 text-xs transition-colors duration-150 ${
              liked
                ? "text-rose-600"
                : "text-[hsl(var(--text-muted))] hover:text-rose-500"
            }`}
          >
            <Heart size={12} fill={liked ? "currentColor" : "none"} />
            <span>{formatCount(likeCount)}</span>
          </button>
          {comment.sourcesCount !== undefined && comment.sourcesCount > 0 && (
            <span className="text-xs text-[hsl(var(--text-muted))]">
              {comment.sourcesCount} source{comment.sourcesCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
