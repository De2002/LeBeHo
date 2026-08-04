import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, MoreHorizontal, MessageSquare, Loader2, ThumbsUp, ThumbsDown, Share2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { getCategoryMeta, REACTION_LABELS } from "@/constants";
import SourceList from "@/components/features/SourceList";
import ShareButton from "@/components/features/ShareButton";
import FollowButton from "@/components/features/FollowButton";
import CommentSheet from "@/components/features/CommentSheet";
import { fetchPostById, rowToPost } from "@/lib/postService";
import { fetchUserReactions } from "@/lib/reactionService";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import type { Post } from "@/types";
import AuthModal from "@/components/features/AuthModal";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { react } = usePosts();

  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [liveCommentCount, setLiveCommentCount] = useState<number | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoadingPost(true);
    fetchPostById(id).then(async (row) => {
      if (!row) { setPost(null); setLoadingPost(false); return; }
      let userReactions: Record<string, "positive" | "negative"> = {};
      if (user?.id) {
        userReactions = await fetchUserReactions(user.id, [row.id]);
      }
      setPost(rowToPost(row, userReactions));
      setLoadingPost(false);
    });
  }, [id, user?.id]);

  if (loadingPost) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 size={22} className="animate-spin text-[hsl(var(--text-muted))]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-[hsl(var(--text-muted))]">Post not found.</p>
        <Link to="/" className="lb-btn-outline mt-6 inline-flex">Back to feed</Link>
      </div>
    );
  }

  const catMeta = getCategoryMeta(post.category);
  const labels = REACTION_LABELS[post.type];
  const total = post.reactions.positive.count + post.reactions.negative.count;
  const agreePercent = total > 0 ? Math.round((post.reactions.positive.count / total) * 100) : 50;
  const disagreePercent = total > 0 ? 100 - agreePercent : 50;
  const displayCount = liveCommentCount ?? post.commentsCount;

  // SVG donut arc helper
  const r = 44;
  const circ = 2 * Math.PI * r;
  const agreeDash = (agreePercent / 100) * circ;
  const disagreeDash = (disagreePercent / 100) * circ;

  const handleReact = async (type: "positive" | "negative") => {
    if (!user) { setAuthOpen(true); return; }
    await react(post.id, type);
    // Refetch to get updated counts
    const row = await fetchPostById(post.id);
    if (row) {
      const userReactions = await fetchUserReactions(user.id, [row.id]);
      setPost(rowToPost(row, userReactions));
    }
  };

  return (
    <>
      {/* Mobile-style top bar */}
      <div className="sticky top-0 z-40 bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))] sm:hidden">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-[hsl(var(--background))] transition-colors">
            <ArrowLeft size={20} className="text-[hsl(var(--text-primary))]" />
          </button>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-[hsl(var(--background))] transition-colors text-[hsl(var(--text-secondary))]">
              <Bookmark size={18} />
            </button>
            <button className="p-2 rounded-full hover:bg-[hsl(var(--background))] transition-colors text-[hsl(var(--text-secondary))]">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-28">
        {/* Desktop back */}
        <button onClick={() => navigate(-1)} className="lb-btn-ghost mb-6 pl-0 hidden sm:inline-flex">
          <ArrowLeft size={14} /> Back
        </button>

        {/* Author header */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Category bar at top */}
          <div className="w-full h-1.5 rounded-full mb-6" style={{ backgroundColor: catMeta.color }} />

          <Link to={`/profile/${post.author.username}`}>
            <img
              src={post.author.avatar}
              alt={post.author.displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-[hsl(var(--surface))] shadow-md -mt-8 mb-3"
            />
          </Link>
          <div className="flex items-center gap-1.5 justify-center mb-0.5">
            <Link to={`/profile/${post.author.username}`} className="font-bold text-[hsl(var(--text-primary))] text-[16px] hover:underline">
              {post.author.displayName}
            </Link>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <circle cx="8" cy="8" r="8" fill="#1D9BF0"/>
              <path d="M5 8.5L7 10.5L11 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {post.author.profession && (
            <p className="text-sm text-[hsl(var(--text-muted))] mb-1">{post.author.profession}</p>
          )}
          <p className="text-xs text-[hsl(var(--text-muted))]">
            {timeAgo(post.createdAt)} ·{" "}
            <span className="font-semibold" style={{ color: catMeta.color }}>{catMeta.label}</span>
          </p>
          <div className="mt-3">
            <FollowButton userId={post.author.id} size="sm" />
          </div>
        </div>

        {/* Main point */}
        <h1 className="text-2xl sm:text-[26px] font-extrabold leading-tight text-[hsl(var(--text-primary))] mb-4 text-center">
          {post.mainPoint}
        </h1>

        {/* Short summary (first paragraph of explanation as teaser) */}
        {post.explanation && (
          <p className="text-[15px] text-[hsl(var(--text-secondary))] leading-relaxed mb-6 text-center">
            {(() => {
              const plain = post.explanation.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              return plain.length > 200 ? plain.slice(0, 200) + "…" : plain;
            })()}
          </p>
        )}

        {/* Image */}
        {post.image && (
          <img
            src={post.image}
            alt="Post visual"
            className="w-full rounded-2xl border border-[hsl(var(--border))] mb-6 object-cover max-h-80"
          />
        )}

        {/* Explanation — full */}
        {post.explanation && (
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-[hsl(var(--text-primary))] mb-3">Why I think this</h3>
            <div
              className="rich-content text-[15px] text-[hsl(var(--text-secondary))] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.explanation }}
            />
          </div>
        )}

        {/* Divider */}
        <hr className="border-[hsl(var(--border))] my-6" />

        {/* Sources */}
        <SourceList sources={post.sources} />

        {/* Voting section */}
        <div className="my-6 p-5 bg-[hsl(var(--surface))] rounded-2xl border border-[hsl(var(--border))] shadow-sm">
          {/* Stats row */}
          <div className="flex items-center justify-between mb-5">
            {/* Agree % */}
            <div className="text-center flex-1">
              <p className="text-3xl font-extrabold" style={{ color: "hsl(var(--agree))" }}>{agreePercent}%</p>
              <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{labels.positive}</p>
            </div>

            {/* Donut chart */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                {/* Background circle */}
                <circle cx="48" cy="48" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
                {/* Agree arc */}
                {agreePercent > 0 && (
                  <circle
                    cx="48" cy="48" r={r} fill="none"
                    stroke="hsl(var(--agree))" strokeWidth="10"
                    strokeDasharray={`${agreeDash} ${circ - agreeDash}`}
                    strokeLinecap="round"
                  />
                )}
                {/* Disagree arc */}
                {disagreePercent > 0 && (
                  <circle
                    cx="48" cy="48" r={r} fill="none"
                    stroke="hsl(var(--disagree))" strokeWidth="10"
                    strokeDasharray={`${disagreeDash} ${circ - disagreeDash}`}
                    strokeDashoffset={-agreeDash}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-sm font-extrabold text-[hsl(var(--text-primary))] leading-none">{total}</p>
                <p className="text-[9px] text-[hsl(var(--text-muted))] leading-none mt-0.5">Total votes</p>
              </div>
            </div>

            {/* Disagree % */}
            <div className="text-center flex-1">
              <p className="text-3xl font-extrabold" style={{ color: "hsl(var(--disagree))" }}>{disagreePercent}%</p>
              <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{labels.negative}</p>
            </div>
          </div>

          {/* Agree / Disagree buttons */}
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => handleReact("positive")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                post.reactions.positive.userReacted
                  ? "bg-[hsl(var(--agree))] text-white shadow-md scale-[0.98]"
                  : "bg-[hsl(142_70%_38%/0.12)] text-[hsl(var(--agree))] hover:bg-[hsl(142_70%_38%/0.2)]"
              }`}
            >
              <ThumbsUp size={16} />
              {labels.positive}
            </button>
            <button
              onClick={() => handleReact("negative")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                post.reactions.negative.userReacted
                  ? "bg-[hsl(var(--disagree))] text-white shadow-md scale-[0.98]"
                  : "bg-[hsl(0_78%_48%/0.10)] text-[hsl(var(--disagree))] hover:bg-[hsl(0_78%_48%/0.18)]"
              }`}
            >
              <ThumbsDown size={16} />
              {labels.negative}
            </button>
          </div>

          {/* Sign in nudge */}
          {!user && (
            <button
              onClick={() => setAuthOpen(true)}
              className="w-full py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm text-[hsl(var(--text-muted))] hover:border-[hsl(var(--text-primary))] transition-colors"
            >
              You must{" "}
              <span className="text-[hsl(var(--accent))] font-semibold">sign in</span>{" "}
              to vote
            </button>
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between py-3 border-t border-b border-[hsl(var(--border))] mb-6">
          <button
            onClick={() => setCommentSheetOpen(true)}
            className="flex items-center gap-1.5 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          >
            <MessageSquare size={15} />
            {displayCount > 0 ? `${displayCount} Discussion` : "Discussion"}
          </button>
          <button className="flex items-center gap-1.5 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors">
            <Bookmark size={15} />
            Save
          </button>
          <ShareButton title={post.mainPoint} text={post.mainPoint} compact />
        </div>

        {/* Top Discussions preview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-[hsl(var(--text-primary))]">Top Discussions</h3>
            <button
              onClick={() => setCommentSheetOpen(true)}
              className="text-xs font-semibold text-[hsl(var(--accent))] hover:underline"
            >
              See all
            </button>
          </div>
          {displayCount === 0 ? (
            <p className="text-sm text-[hsl(var(--text-muted))] text-center py-3">No discussions yet.</p>
          ) : (
            <p className="text-sm text-[hsl(var(--text-muted))] text-center py-3 cursor-pointer hover:text-[hsl(var(--text-primary))]" onClick={() => setCommentSheetOpen(true)}>
              View {displayCount} comment{displayCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Join CTA */}
        {!user && (
          <button
            onClick={() => setAuthOpen(true)}
            className="w-full py-3.5 rounded-xl border-2 border-[hsl(var(--accent))] text-[hsl(var(--accent))] font-bold text-sm hover:bg-[hsl(var(--accent)/0.06)] transition-colors"
          >
            Join the discussion
          </button>
        )}
      </div>

      {/* Comment sheet */}
      <CommentSheet
        open={commentSheetOpen}
        onClose={() => setCommentSheetOpen(false)}
        postId={post.id}
        commentsCount={displayCount}
        onCountChange={setLiveCommentCount}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode="signup" />
    </>
  );
}
