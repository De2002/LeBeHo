import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { MOCK_POSTS } from "@/lib/mockData";
import { timeAgo, formatCount } from "@/lib/utils";
import CategoryBadge from "@/components/features/CategoryBadge";
import PostTypeBadge from "@/components/features/PostTypeBadge";
import TrustScore from "@/components/features/TrustScore";
import ReactionBar from "@/components/features/ReactionBar";
import SourceList from "@/components/features/SourceList";
import ShareButton from "@/components/features/ShareButton";
import FollowButton from "@/components/features/FollowButton";
import { usePosts } from "@/hooks/usePosts";
import { Bell, BellOff, ArrowUpRight, Star, Flame, MessageSquare } from "lucide-react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __semio__params?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __semio__gc_sidePanel_graphlogin?: (params: any) => void;
  }
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { posts, react, toggleDiscussion } = usePosts();

  const post = posts.find((p) => p.id === id) ?? MOCK_POSTS.find((p) => p.id === id);

  // Load GraphComment widget keyed to this post's id
  useEffect(() => {
    if (!id) return;

    // Remove any previously injected instance
    const existing = document.getElementById("gc-script");
    if (existing) existing.remove();

    window.__semio__params = {
      graphcommentId: "LeBeHo",
      behaviour: { uid: id },
      sidePanel: {
        width: 480,
        button: {
          background: "#0a0a0a",
          color: "#ffffff",
          label: "Read & React",
        },
        visible: true,
      },
    };

    const gc = document.createElement("script");
    gc.id = "gc-script";
    gc.type = "text/javascript";
    gc.async = true;
    gc.defer = true;
    gc.src =
      "https://integration.graphcomment.com/gc_sidePanel_graphlogin.js?" +
      Date.now();
    gc.onload = () => {
      if (
        typeof window.__semio__gc_sidePanel_graphlogin === "function" &&
        window.__semio__params
      ) {
        window.__semio__gc_sidePanel_graphlogin(window.__semio__params);
      }
    };
    (document.head || document.body).appendChild(gc);

    return () => {
      const s = document.getElementById("gc-script");
      if (s) s.remove();
    };
  }, [id]);

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
            @{post.author.username} · {formatCount(post.author.followersCount)}{" "}
            followers
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

      {/* More */}
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
        <span className="lb-btn-ghost cursor-default">
          <MessageSquare size={14} />
          <span>{formatCount(post.commentsCount)}</span>
        </span>
        <button
          onClick={() => toggleDiscussion(post.id)}
          className={`lb-btn-ghost ${
            post.isFollowingDiscussion ? "text-[hsl(var(--accent))]" : ""
          }`}
        >
          {post.isFollowingDiscussion ? (
            <BellOff size={14} />
          ) : (
            <Bell size={14} />
          )}
          {post.isFollowingDiscussion
            ? "Following discussion"
            : "Follow discussion"}
        </button>
        <div className="ml-auto">
          <ShareButton title={post.mainPoint} text={post.mainPoint} />
        </div>
      </div>

      {/* GraphComment discussion panel */}
      <div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
        <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))] mb-4">
          Discussion
        </h2>
        <div id="graphcomment" />
      </div>
    </div>
  );
}
