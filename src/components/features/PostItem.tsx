import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Bookmark, Share2, ThumbsUp, ThumbsDown } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { getCategoryMeta } from "@/constants";
import { REACTION_LABELS } from "@/constants";
import type { Post } from "@/types";
import ShareButton from "./ShareButton";

interface PostItemProps {
  post: Post;
  onReact: (postId: string, type: "positive" | "negative") => void;
  onToggleDiscussion: (postId: string) => void;
  preview?: boolean;
}

export default function PostItem({ post, onReact, preview = true }: PostItemProps) {
  const navigate = useNavigate();
  const catMeta = getCategoryMeta(post.category);
  const labels = REACTION_LABELS[post.type];

  const total = post.reactions.positive.count + post.reactions.negative.count;
  const agreePercent = total > 0 ? Math.round((post.reactions.positive.count / total) * 100) : 0;
  const disagreePercent = total > 0 ? 100 - agreePercent : 0;

  const postUrl = `${window.location.origin}/post/${post.id}`;

  return (
    <article className="post-card mb-4 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
      {/* Category accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: catMeta.color }} />

      {/* Card body */}
      <div className="p-5 pt-0">
        {/* Author — centered, avatar overlapping bar */}
        <div className="flex flex-col items-center text-center -mt-5 mb-4">
          <Link
            to={`/profile/${post.author.username}`}
            onClick={(e) => e.stopPropagation()}
            className="block"
          >
            <img
              src={post.author.avatar}
              alt={post.author.displayName}
              className="w-12 h-12 rounded-full object-cover border-2 border-[hsl(var(--surface))] shadow-sm mb-2"
            />
          </Link>
          <div className="flex items-center gap-1.5 justify-center">
            <Link
              to={`/profile/${post.author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-[hsl(var(--text-primary))] text-[15px] hover:underline"
            >
              {post.author.displayName}
            </Link>
            {/* Blue verified badge */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <circle cx="8" cy="8" r="8" fill="#1D9BF0"/>
              <path d="M5 8.5L7 10.5L11 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {post.author.profession && (
            <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{post.author.profession}</p>
          )}
          <p className="text-[11px] text-[hsl(var(--text-muted))] mt-1">
            {timeAgo(post.createdAt)} ·{" "}
            <span className="font-semibold" style={{ color: catMeta.color }}>
              {catMeta.label}
            </span>
          </p>
        </div>

        {/* Featured image (if present) */}
        {post.image && (
          <div className="mb-4 -mx-5">
            <img
              src={post.image}
              alt="Post visual"
              className="w-full object-cover max-h-52"
              loading="lazy"
            />
          </div>
        )}

        {/* Main point */}
        <h2 className="text-[18px] font-extrabold leading-snug text-[hsl(var(--text-primary))] text-center mb-3">
          {post.mainPoint}
        </h2>

        {/* Explanation preview */}
        {post.explanation && (
          <p className="text-[14px] text-[hsl(var(--text-secondary))] leading-relaxed text-center mb-4">
            {(() => {
              const plain = post.explanation.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              return plain.length > 180 ? plain.slice(0, 180) + "…" : plain;
            })()}
          </p>
        )}

        {/* Agree / Disagree stats */}
        {total > 0 && (
          <div className="flex items-stretch gap-3 mb-4">
            <div className="flex-1 flex flex-col items-start gap-1 px-4 py-3 rounded-xl border border-[hsl(var(--border))]">
              <div className="flex items-center gap-1.5">
                <ThumbsUp size={15} className="text-[hsl(var(--agree))]" />
                <span className="text-[16px] font-extrabold" style={{ color: "hsl(var(--agree))" }}>
                  {agreePercent}%
                </span>
              </div>
              <span className="text-xs text-[hsl(var(--text-muted))]">{labels.positive}</span>
            </div>
            <div className="flex-1 flex flex-col items-start gap-1 px-4 py-3 rounded-xl border border-[hsl(var(--border))]">
              <div className="flex items-center gap-1.5">
                <ThumbsDown size={15} className="text-[hsl(var(--disagree))]" />
                <span className="text-[16px] font-extrabold" style={{ color: "hsl(var(--disagree))" }}>
                  {disagreePercent}%
                </span>
              </div>
              <span className="text-xs text-[hsl(var(--text-muted))]">{labels.negative}</span>
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--border-subtle))]">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.id}`); }}
            className="flex items-center gap-1.5 text-[13px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          >
            <MessageSquare size={14} />
            <span>{post.commentsCount > 0 ? post.commentsCount : ""} Discussion</span>
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-[13px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          >
            <Bookmark size={14} />
            <span>Save</span>
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <ShareButton
              title={post.mainPoint}
              text={post.mainPoint}
              url={postUrl}
              compact
            />
          </div>
        </div>
      </div>
    </article>
  );
}
