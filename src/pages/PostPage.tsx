import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, ArrowUpRight, Star, Flame, MessageSquare } from "lucide-react";
import { MOCK_POSTS } from "@/lib/mockData";
import { timeAgo, formatCount } from "@/lib/utils";
import CategoryBadge from "@/components/features/CategoryBadge";
import PostTypeBadge from "@/components/features/PostTypeBadge";
import TrustScore from "@/components/features/TrustScore";
import ReactionBar from "@/components/features/ReactionBar";
import SourceList from "@/components/features/SourceList";
import ShareButton from "@/components/features/ShareButton";
import FollowButton from "@/components/features/FollowButton";
import CommentSheet from "@/components/features/CommentSheet";
import { usePosts } from "@/hooks/usePosts";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { posts, react, toggleDiscussion } = usePosts();

  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [liveCommentCount, setLiveCommentCount] = useState<number | null>(null);

  const post = posts.find((p) => p.id === id) ?? MOCK_POSTS.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-[hsl(var(--text-muted))]">Post not found.</p>
        <Link to="/" className="lb-btn-outline mt-6 inline-flex">
          Back to feed
        </Link>
      </div>
    );
  }

  const displayCount = liveCommentCount ?? post.commentsCount;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="lb-btn-ghost mb-6 pl-0">
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Author */}
      <div className="flex items-start gap-3 mb-5">
        <Link to={`/profile/${post.author.username}`} className="flex-shrink-0">
          <img
            src={post.author.avatar}
            alt={post.author.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/profile/${post.author.username}`}
              className="font-semibold text-[hsl(var(--text-primary))] hover:underline"
            >
              {post.author.displayName}
            </Link>
            <TrustScore score={post.author.trustScore} showLabel />
            <span className="text-xs text-[hsl(var(--text-muted))]">
              {timeAgo(post.createdAt)}
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
            @{post.author.username} · {formatCount(post.author.followersCount)} followers
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <CategoryBadge category={post.category} />
          <PostTypeBadge type={post.type} />
          <FollowButton userId={post.author.id} size="sm" />
        </div>
      </div>

      {/* Flags */}
      <div className="flex items-center gap-3 mb-3">
        {post.trending && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500">
            <Flame size={12} /> Trending
          </span>
        )}
        {post.truthPick && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-500">
            <Star size={12} /> Truth Pick
          </span>
        )}
      </div>

      {/* Main Point */}
      <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-[hsl(var(--text-primary))] mb-5">
        {post.mainPoint}
      </h1>

      {/* Image */}
      {post.image && (
        <img
          src={post.image}
          alt="Post visual"
          className="w-full rounded-sm border border-[hsl(var(--border))] mb-6 object-cover max-h-96"
        />
      )}

      {/* Explanation */}
      <div className="mb-6">
        <p className="text-[16px] text-[hsl(var(--text-secondary))] leading-relaxed whitespace-pre-wrap">
          {post.explanation}
        </p>
      </div>

      {/* Sources */}
      <SourceList sources={post.sources} />

      {/* More link */}
      {post.moreLink && (
        <a
          href={post.moreLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--accent))] hover:underline mt-4"
        >
          {post.moreLinkLabel ?? "Read more"}
          <ArrowUpRight size={13} />
        </a>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap mt-6 pt-4 border-t border-[hsl(var(--border))]">
        <ReactionBar post={post} onReact={react} />

        <div className="w-px h-4 bg-[hsl(var(--border))] mx-1" />

        {/* Comment button — opens sheet */}
        <button
          onClick={() => setCommentSheetOpen(true)}
          className="lb-btn-ghost"
          aria-label="Open comments"
        >
          <MessageSquare size={14} />
          {displayCount > 0 && (
            <span className="text-xs">{displayCount}</span>
          )}
        </button>

        <button
          onClick={() => toggleDiscussion(post.id)}
          className={`lb-btn-ghost ${
            post.isFollowingDiscussion ? "text-[hsl(var(--accent))]" : ""
          }`}
        >
          {post.isFollowingDiscussion ? <BellOff size={14} /> : <Bell size={14} />}
          <span className="hidden sm:inline">
            {post.isFollowingDiscussion ? "Following discussion" : "Follow discussion"}
          </span>
        </button>

        <div className="ml-auto">
          <ShareButton title={post.mainPoint} text={post.mainPoint} />
        </div>
      </div>

      {/* Slide-up comment sheet */}
      <CommentSheet
        open={commentSheetOpen}
        onClose={() => setCommentSheetOpen(false)}
        postId={post.id}
        commentsCount={displayCount}
        onCountChange={setLiveCommentCount}
      />
    </div>
  );
}
