import { useState, useEffect, useCallback, useRef } from "react";
import { ThumbsUp, Reply, Trash2, ChevronDown, ChevronUp, Send, Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchComments,
  addComment,
  deleteComment,
  toggleCommentLike,
  type CommentData,
} from "@/lib/commentService";
import { toast } from "sonner";

// ── Single comment node ────────────────────────────────────────────────────────
interface CommentNodeProps {
  comment: CommentData;
  depth?: number;
  currentUserId?: string;
  onReply: (parentId: string, parentAuthor: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
}

function CommentNode({
  comment,
  depth = 0,
  currentUserId,
  onReply,
  onDelete,
  onLike,
}: CommentNodeProps) {
  const [showReplies, setShowReplies] = useState(depth < 1);
  const hasReplies = comment.replies.length > 0;
  const isOwn = currentUserId === comment.userId;
  const maxDepth = 3;

  return (
    <div className={`flex gap-3 ${depth > 0 ? "mt-3" : "mt-4"}`}>
      {/* Avatar + thread line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <img
          src={comment.author.avatar}
          alt={comment.author.displayName}
          className={`rounded-full object-cover flex-shrink-0 ${
            depth === 0 ? "w-8 h-8" : "w-6 h-6"
          }`}
        />
        {hasReplies && showReplies && (
          <div className="w-px flex-1 mt-2 bg-[hsl(var(--border))]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Meta */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className="text-sm font-semibold text-[hsl(var(--text-primary))]">
            {comment.author.displayName}
          </span>
          <span className="text-[hsl(var(--border))] text-xs">·</span>
          <span className="text-xs text-[hsl(var(--text-muted))]">
            {timeAgo(comment.createdAt)}
          </span>
        </div>

        {/* Text */}
        <p className="text-[14px] text-[hsl(var(--text-secondary))] leading-relaxed whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <button
            onClick={() => onLike(comment.id)}
            className={`inline-flex items-center gap-1 text-xs transition-colors ${
              comment.userLiked
                ? "text-[hsl(var(--accent))] font-semibold"
                : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
            }`}
          >
            <ThumbsUp size={11} className={comment.userLiked ? "fill-current" : ""} />
            <span>({comment.likesCount})</span>
          </button>

          {currentUserId && depth < maxDepth && (
            <button
              onClick={() => onReply(comment.id, comment.author.displayName)}
              className="inline-flex items-center gap-1 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--accent))] transition-colors"
            >
              <Reply size={11} />
              reply
            </button>
          )}

          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="inline-flex items-center gap-1 text-xs text-[hsl(var(--text-muted))] hover:text-red-500 transition-colors"
            >
              <Trash2 size={11} />
              delete
            </button>
          )}
        </div>

        {/* Toggle replies */}
        {hasReplies && (
          <button
            onClick={() => setShowReplies((v) => !v)}
            className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-[hsl(var(--accent))] hover:underline"
          >
            {showReplies ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showReplies
              ? "Hide replies"
              : `Show ${comment.replies.length} repl${
                  comment.replies.length === 1 ? "y" : "ies"
                }`}
          </button>
        )}

        {/* Nested replies */}
        {hasReplies && showReplies && (
          <div className="mt-1">
            {comment.replies.map((reply) => (
              <CommentNode
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                currentUserId={currentUserId}
                onReply={onReply}
                onDelete={onDelete}
                onLike={onLike}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Composer ───────────────────────────────────────────────────────────────────
interface ComposerProps {
  placeholder: string;
  onSubmit: (text: string) => Promise<void>;
  autoFocus?: boolean;
  onCancel?: () => void;
  compact?: boolean;
  avatar?: string;
}

function Composer({ placeholder, onSubmit, autoFocus, onCancel, compact, avatar }: ComposerProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2.5 items-start">
      {avatar && !compact && (
        <img
          src={avatar}
          alt=""
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
        />
      )}
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className="lb-textarea text-sm resize-none w-full"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="flex items-center gap-2 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="lb-btn-ghost text-xs py-1 px-2"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="lb-btn-primary text-xs py-1.5 px-3 disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            {submitting ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Send size={11} />
            )}
            {compact ? "Reply" : "Comment"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Main CommentSection ────────────────────────────────────────────────────────
interface CommentSectionProps {
  postId: string;
  initialCount?: number;
  onCountChange?: (count: number) => void;
}

export default function CommentSection({
  postId,
  initialCount = 0,
  onCountChange,
}: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{
    id: string;
    author: string;
  } | null>(null);
  const replyRef = useRef<HTMLDivElement>(null);

  const countAll = (list: CommentData[]): number =>
    list.reduce((acc, c) => acc + 1 + countAll(c.replies), 0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComments(postId, user?.id);
      setComments(data);
      onCountChange?.(countAll(data));
    } catch (err) {
      console.error("Failed to load comments:", err);
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, [postId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (replyTarget) {
      setTimeout(
        () =>
          replyRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          }),
        80
      );
    }
  }, [replyTarget]);

  const handleAddComment = async (content: string) => {
    if (!user) {
      toast.error("Sign in to comment.");
      return;
    }
    await addComment(postId, user.id, content);
    await load();
    toast.success("Comment posted.");
  };

  const handleAddReply = async (content: string) => {
    if (!user || !replyTarget) return;
    await addComment(postId, user.id, content, replyTarget.id);
    setReplyTarget(null);
    await load();
    toast.success("Reply posted.");
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    const removeFromTree = (list: CommentData[]): CommentData[] =>
      list
        .filter((c) => c.id !== commentId)
        .map((c) => ({ ...c, replies: removeFromTree(c.replies) }));
    setComments((prev) => {
      const updated = removeFromTree(prev);
      onCountChange?.(countAll(updated));
      return updated;
    });
    try {
      await deleteComment(commentId);
    } catch {
      toast.error("Failed to delete comment.");
      load();
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast.error("Sign in to like comments.");
      return;
    }

    const findComment = (list: CommentData[]): CommentData | null => {
      for (const c of list) {
        if (c.id === commentId) return c;
        const found = findComment(c.replies);
        if (found) return found;
      }
      return null;
    };
    const target = findComment(comments);
    if (!target) return;

    // Optimistic update
    const updateTree = (list: CommentData[]): CommentData[] =>
      list.map((c) => {
        if (c.id === commentId) {
          const liked = !c.userLiked;
          return {
            ...c,
            userLiked: liked,
            likesCount: liked
              ? c.likesCount + 1
              : Math.max(0, c.likesCount - 1),
          };
        }
        return { ...c, replies: updateTree(c.replies) };
      });
    setComments((prev) => updateTree(prev));

    try {
      await toggleCommentLike(commentId, user.id, target.userLiked ?? false);
    } catch (err) {
      console.error("toggleLike failed:", err);
      load(); // revert on failure
    }
  };

  const totalCount = countAll(comments);

  return (
    <div className="pt-4">
      {/* Top-level composer */}
      {user ? (
        <div className="mb-5">
          <Composer
            placeholder="Share your thoughts…"
            onSubmit={handleAddComment}
            avatar={user.avatar}
          />
        </div>
      ) : (
        <div className="mb-5 px-4 py-3 border border-[hsl(var(--border))] rounded-sm text-sm text-[hsl(var(--text-muted))]">
          Sign in to join the discussion.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 size={18} className="animate-spin text-[hsl(var(--text-muted))]" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-6">
          <p className="text-sm text-[hsl(var(--text-muted))] mb-2">{error}</p>
          <button onClick={load} className="lb-btn-outline text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && comments.length === 0 && (
        <p className="text-sm text-[hsl(var(--text-muted))] py-4 text-center">
          No comments yet. Be the first.
        </p>
      )}

      {/* Comment tree */}
      {!loading && !error && comments.length > 0 && (
        <div className="divide-y divide-[hsl(var(--border-subtle))]">
          {comments.map((comment) => (
            <div key={comment.id} className="pb-4">
              <CommentNode
                comment={comment}
                depth={0}
                currentUserId={user?.id}
                onReply={(id, author) => setReplyTarget({ id, author })}
                onDelete={handleDelete}
                onLike={handleLike}
              />
            </div>
          ))}
        </div>
      )}

      {/* Inline reply composer */}
      {replyTarget && user && (
        <div
          ref={replyRef}
          className="mt-4 pt-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))] rounded-sm p-3"
        >
          <p className="text-xs text-[hsl(var(--text-muted))] mb-2 font-medium">
            Replying to{" "}
            <span className="text-[hsl(var(--text-primary))]">
              {replyTarget.author}
            </span>
          </p>
          <Composer
            placeholder={`Reply to ${replyTarget.author}…`}
            onSubmit={handleAddReply}
            onCancel={() => setReplyTarget(null)}
            autoFocus
            compact
          />
        </div>
      )}
    </div>
  );
}
