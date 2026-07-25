import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PenLine, Trash2, ThumbsUp, ThumbsDown, MessageSquare, BarChart2, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { deletePost } from "@/lib/postService";
import { timeAgo, formatCount } from "@/lib/utils";
import { toast } from "sonner";
import CategoryBadge from "@/components/features/CategoryBadge";
import PostTypeBadge from "@/components/features/PostTypeBadge";

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { posts, loading, error, reload } = usePosts({ userId: user?.id });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (postId: string) => {
    setDeleting(true);
    try {
      await deletePost(postId);
      toast.success("Post deleted.");
      reload();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to delete post.");
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 size={20} className="animate-spin text-[hsl(var(--text-muted))]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-[hsl(var(--text-muted))] mb-4">
          Sign in to view your post stats.
        </p>
        <Link to="/" className="lb-btn-outline inline-flex">
          Back to feed
        </Link>
      </div>
    );
  }

  const totalPositive = posts.reduce((s, p) => s + p.reactions.positive.count, 0);
  const totalNegative = posts.reduce((s, p) => s + p.reactions.negative.count, 0);
  const totalComments = posts.reduce((s, p) => s + p.commentsCount, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="lb-btn-ghost pl-0">
          <ArrowLeft size={14} />
        </button>
        <BarChart2 size={16} className="text-[hsl(var(--text-muted))]" />
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">
          Post Stats
        </h1>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-px border border-[hsl(var(--border))] rounded-sm overflow-hidden mb-8 bg-[hsl(var(--border))]">
        <div className="bg-[hsl(var(--background))] px-4 py-4 text-center">
          <div className="text-2xl font-extrabold text-[hsl(var(--text-primary))]">
            {posts.length}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-[hsl(var(--text-muted))] mt-1">
            Posts
          </div>
        </div>
        <div className="bg-[hsl(var(--background))] px-4 py-4 text-center">
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCount(totalPositive)}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-[hsl(var(--text-muted))] mt-1">
            Positive
          </div>
        </div>
        <div className="bg-[hsl(var(--background))] px-4 py-4 text-center">
          <div className="text-2xl font-extrabold text-[hsl(var(--text-primary))]">
            {formatCount(totalComments)}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-[hsl(var(--text-muted))] mt-1">
            Comments
          </div>
        </div>
      </div>

      {/* Posts list */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))]">
          Your Posts
        </h2>
        <button onClick={reload} className="lb-btn-ghost p-1.5" aria-label="Refresh">
          <RefreshCw size={12} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={18} className="animate-spin text-[hsl(var(--text-muted))]" />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[hsl(var(--text-muted))] mb-3">{error}</p>
          <button onClick={reload} className="lb-btn-outline text-xs">
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[hsl(var(--text-muted))] mb-4">No posts yet.</p>
          <Link to="/create" className="lb-btn-primary inline-flex">
            Make your first post
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[hsl(var(--border))]">
          {posts.map((post) => {
            const total = post.reactions.positive.count + post.reactions.negative.count;
            const positivePercent = total > 0
              ? Math.round((post.reactions.positive.count / total) * 100)
              : null;

            return (
              <div key={post.id} className="py-5 group">
                {/* Top row: badges + edit button */}
                <div className="flex items-center gap-2 mb-2">
                  <CategoryBadge category={post.category} />
                  <PostTypeBadge type={post.type} />
                  <span className="text-xs text-[hsl(var(--text-muted))] ml-1">
                    {timeAgo(post.createdAt)}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/edit/${post.id}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-sm border border-[hsl(var(--border))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:border-[hsl(var(--text-muted))] transition-colors"
                      aria-label="Edit post"
                    >
                      <PenLine size={11} />
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(post.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-sm border border-[hsl(var(--border))] text-[hsl(var(--text-muted))] hover:text-rose-500 hover:border-rose-400 transition-colors"
                      aria-label="Delete post"
                    >
                      <Trash2 size={11} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Main point */}
                <Link
                  to={`/post/${post.id}`}
                  className="block text-base font-bold text-[hsl(var(--text-primary))] hover:text-[hsl(var(--accent))] leading-snug mb-3 transition-colors"
                >
                  {post.mainPoint}
                </Link>

                {/* Stats row */}
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <ThumbsUp size={12} />
                    {formatCount(post.reactions.positive.count)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                    <ThumbsDown size={12} />
                    {formatCount(post.reactions.negative.count)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))]">
                    <MessageSquare size={12} />
                    {post.commentsCount} comment{post.commentsCount !== 1 ? "s" : ""}
                  </span>

                  {positivePercent !== null && (
                    <>
                      <div className="w-px h-3 bg-[hsl(var(--border))]" />
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1 bg-[hsl(var(--border))] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${positivePercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-[hsl(var(--text-muted))]">
                          {positivePercent}% agree
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setConfirmDeleteId(null)}
          />
          <div className="relative z-10 w-full max-w-sm mx-4 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-sm shadow-xl p-6">
            <h3 className="text-base font-bold text-[hsl(var(--text-primary))] mb-2">
              Delete post?
            </h3>
            <p className="text-sm text-[hsl(var(--text-secondary))] mb-6 leading-relaxed">
              This will permanently remove the post and all its comments. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="lb-btn-ghost text-sm disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <><Loader2 size={13} className="animate-spin" /> Deleting…</>
                ) : (
                  <><Trash2 size={13} /> Delete Post</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
