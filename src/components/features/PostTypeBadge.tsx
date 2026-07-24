import { POST_TYPE_LABELS } from "@/constants";
import type { PostType } from "@/types";

interface PostTypeBadgeProps {
  type: PostType;
}

export default function PostTypeBadge({ type }: PostTypeBadgeProps) {
  return (
    <span className="text-[11px] font-medium tracking-wide uppercase text-[hsl(var(--text-muted))] border border-[hsl(var(--border))] px-2 py-0.5 rounded-sm">
      {POST_TYPE_LABELS[type]}
    </span>
  );
}
