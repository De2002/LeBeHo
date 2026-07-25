import { Link } from "react-router-dom";
import {
  MessageSquare,
  Bell,
  BellOff,
  ArrowUpRight,
  Flame,
  Star,
} from "lucide-react";
import { timeAgo, formatCount } from "@/lib/utils";
import CategoryBadge from "./CategoryBadge";
import PostTypeBadge from "./PostTypeBadge";
import TrustScore from "./TrustScore";
import ReactionBar from "./ReactionBar";
import SourceList from "./SourceList";
import ShareButton from "./ShareButton";
import type { Post } from "@/types";

interface PostItemProps {
  post: Post;
  onReact: (postId: string, type: "positive" | "negative") => void;
  onToggleDiscussion: (postId: string) => void;
  preview?: boolean;
}

export default function PostItem({
  post,
  onReact,
  onToggleDiscussion,
  preview = false,
}: PostItemProps) {
  const postUrl = `${window.location.origin}/post/${post.id}`;

  return (
    <article className="py-6 lb-divider animate-fade-in">
      {/* Meta row */}
      <div className="flex items-start gap-3 mb-3">
        <Link
          to={`/profile/${post.author.username}`}
          className="flex-shrink-0 mt-0.5"
          aria-label={post.author.displayName}
        >
          <img
            src={post.author.avatar}
            alt={post.author.displayName}
            className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity"
          />
        </Link>
        <div className="flex-1 min-w-0">
          {/* Row 1: name, trust, time, flags */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <Link
              to={`/profile/${post.author.username}`}
              className="text-sm font-semibold text-[hsl(var(--text-primary))] hover:underline"
            >
              {post.author.displayName}
            </Link>
            <TrustScore score={post.author.trustScore} />
            <span className="text-[hsl(var(--border))]">·</span>
            <span className="text-xs text-[hsl(var(--text-muted))] whitespace-nowrap">
              {timeAgo(post.createdAt)}
            </span>
            {post.trending && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-500 uppercase tracking-wide">
                <Flame size={10} />
                Trending
              </span>
            )}
            {post.truthPick && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-violet-500 uppercase tracking-wide">
                <Star size={10} />
                Truth Pick
              </span>
            )}
          </div>
          {/* Row 2: badges (only show on mobile as second line; hidden on sm+ where they fit) */}
          <div className="flex items-center gap-1.5 mt-1 sm:hidden">
            <CategoryBadge category={post.category} />
            <PostTypeBadge type={post.type} />
          </div>
        </div>
        {/* Badges on the right — hidden on mobile, shown on sm+ */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <CategoryBadge category={post.category} />
          <PostTypeBadge type={post.type} />
        </div>
      </div>

      {/* Main Point */}
      <Link to={`/post/${post.id}`} className="group block mb-3">
        <h2 className="text-xl font-bold leading-snug text-[hsl(var(--text-primary))] group-hover:text-[hsl(var(--accent))] transition-colors duration-150">
          {post.mainPoint}
        </h2>
      </Link>

      {/* Featured Image */}
      {post.image && (
        <Link to={`/post/${post.id}`} className="block mb-4">
          <img
            src={post.image}
            alt="Post visual"
            className="w-full h-48 sm:h-56 object-cover rounded-sm border border-[hsl(var(--border))]"
            loading="lazy"
          />
        </Link>
      )}

      {/* Explanation */}
      <p className="text-[15px] text-[hsl(var(--text-secondary))] leading-relaxed mb-4">
        {preview
          ? post.explanation.slice(0, 220) +
            (post.explanation.length > 220 ? "…" : "")
          : post.explanation}
      </p>

      {/* Sources */}
      {!preview && <SourceList sources={post.sources} />}
      {preview && post.sources.length > 0 && (
        <p className="text-xs text-[hsl(var(--text-muted))] mb-4">
          {post.sources.length} source{post.sources.length > 1 ? "s" : ""} attached
        </p>
      )}

      {/* Read More */}
      {post.moreLink && (
        <a
          href={post.moreLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-[hsl(var(--accent))] hover:underline mb-4"
        >
          {post.moreLinkLabel ?? "Read more"}
          <ArrowUpRight size={13} />
        </a>
      )}

      {/* Action Row */}
      <div className="flex items-center gap-1 flex-wrap mt-4 pt-3 border-t border-[hsl(var(--border-subtle))]">
        <ReactionBar post={post} onReact={onReact} />

        <div className="w-px h-4 bg-[hsl(var(--border))] mx-1" />

        <Link to={`/post/${post.id}`} className="lb-btn-ghost">
          <MessageSquare size={14} />
          {post.commentsCount > 0 && (
            <span className="text-xs">{post.commentsCount}</span>
          )}
        </Link>

        <button
          onClick={() => onToggleDiscussion(post.id)}
          className={`lb-btn-ghost ${
            post.isFollowingDiscussion
              ? "text-[hsl(var(--accent))]"
              : ""
          }`}
          aria-label={
            post.isFollowingDiscussion ? "Unfollow discussion" : "Follow discussion"
          }
        >
          {post.isFollowingDiscussion ? <BellOff size={14} /> : <Bell size={14} />}
          <span className="hidden sm:inline">
            {post.isFollowingDiscussion ? "Following" : "Follow"}
          </span>
        </button>

        <div className="ml-auto">
          <ShareButton
            title={post.mainPoint}
            text={post.mainPoint}
            url={postUrl}
          />
        </div>
      </div>
    </article>
  );
}
