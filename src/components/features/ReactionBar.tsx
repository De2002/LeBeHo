import { ThumbsUp, ThumbsDown } from "lucide-react";
import { REACTION_LABELS } from "@/constants";
import { formatCount } from "@/lib/utils";
import type { Post } from "@/types";

interface ReactionBarProps {
  post: Post;
  onReact: (postId: string, type: "positive" | "negative") => void;
  compact?: boolean;
}

export default function ReactionBar({ post, onReact, compact = false }: ReactionBarProps) {
  const labels = REACTION_LABELS[post.type];
  const total =
    post.reactions.positive.count + post.reactions.negative.count;
  const positivePercent =
    total > 0 ? Math.round((post.reactions.positive.count / total) * 100) : 50;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onReact(post.id, "positive")}
        className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 ${
          post.reactions.positive.userReacted
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-[hsl(var(--text-muted))] hover:text-emerald-600"
        }`}
        aria-label={labels.positive}
        aria-pressed={post.reactions.positive.userReacted}
      >
        <ThumbsUp size={14} />
        {!compact && <span className="text-xs">{labels.positive}</span>}
        <span className="text-xs">{formatCount(post.reactions.positive.count)}</span>
      </button>

      {!compact && (
        <div className="flex-1 max-w-[80px] h-px bg-[hsl(var(--border))] relative overflow-hidden rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${positivePercent}%` }}
          />
        </div>
      )}

      <button
        onClick={() => onReact(post.id, "negative")}
        className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 ${
          post.reactions.negative.userReacted
            ? "text-rose-600 dark:text-rose-400"
            : "text-[hsl(var(--text-muted))] hover:text-rose-600"
        }`}
        aria-label={labels.negative}
        aria-pressed={post.reactions.negative.userReacted}
      >
        <ThumbsDown size={14} />
        {!compact && <span className="text-xs">{labels.negative}</span>}
        <span className="text-xs">{formatCount(post.reactions.negative.count)}</span>
      </button>
    </div>
  );
}
