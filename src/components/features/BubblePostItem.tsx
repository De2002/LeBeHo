import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/constants";
import type { Post } from "@/types";

/** Rotating pastel fills for light mode — index mod 5 */
const BUBBLE_COLORS_LIGHT = [
  "hsl(38 50% 93%)",   // warm cream
  "hsl(252 45% 93%)",  // soft lavender
  "hsl(142 30% 91%)",  // mint green
  "hsl(210 45% 92%)",  // sky blue
  "hsl(18 55% 92%)",   // peach
];

const BUBBLE_COLORS_DARK = [
  "hsl(38 20% 18%)",
  "hsl(252 20% 20%)",
  "hsl(142 15% 18%)",
  "hsl(210 20% 19%)",
  "hsl(18 20% 18%)",
];

function isDark() {
  return document.documentElement.classList.contains("dark");
}

interface BubblePostItemProps {
  post: Post;
  index: number;
}

export default function BubblePostItem({ post, index }: BubblePostItemProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const isLeft = index % 2 === 0;

  // Staggered IntersectionObserver reveal
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const delay = Math.min(index, 6) * 70; // cap stagger at ~420ms
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -24px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);
  const colorIndex = index % 5;
  const bubbleColor = isDark()
    ? BUBBLE_COLORS_DARK[colorIndex]
    : BUBBLE_COLORS_LIGHT[colorIndex];

  const catMeta = CATEGORIES.find((c) => c.id === post.category);

  const handleClick = () => {
    navigate(`/post/${post.id}`);
  };

  const avatarEl = (
    <button
      onClick={() => navigate(`/profile/${post.author.username || post.author.id}`)}
      className="flex-shrink-0 focus:outline-none group"
      aria-label={`View ${post.author.displayName}'s profile`}
    >
      <img
        src={post.author.avatar}
        alt={post.author.displayName}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-[hsl(var(--background))] shadow-sm group-hover:opacity-85 transition-opacity flex-shrink-0"
      />
    </button>
  );

  const bubbleEl = (
    <div className="relative max-w-[78%] sm:max-w-[72%]">
      {/* Tail */}
      {isLeft ? (
        <span
          className="absolute top-5 -left-[10px] w-0 h-0"
          style={{
            borderTop: "10px solid transparent",
            borderBottom: "4px solid transparent",
            borderRight: `11px solid ${bubbleColor}`,
          }}
          aria-hidden
        />
      ) : (
        <span
          className="absolute top-5 -right-[10px] w-0 h-0"
          style={{
            borderTop: "10px solid transparent",
            borderBottom: "4px solid transparent",
            borderLeft: `11px solid ${bubbleColor}`,
          }}
          aria-hidden
        />
      )}

      {/* Bubble */}
      <button
        onClick={handleClick}
        className="
          block w-full text-left
          rounded-2xl px-5 py-4
          transition-all duration-150
          hover:brightness-95 active:scale-[0.99]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--text-primary))] focus-visible:ring-offset-2
          cursor-pointer
        "
        style={{ backgroundColor: bubbleColor }}
        aria-label={`Read post: ${post.mainPoint}`}
      >
        {/* Main point */}
        <p
          className="
            text-[hsl(var(--text-primary))] font-light leading-snug
            text-[1.15rem] sm:text-[1.3rem]
            [font-family:'Inter',system-ui,sans-serif]
          "
        >
          {post.mainPoint}
        </p>

        {/* Footer row: category + reactions + comments */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {catMeta && (
            <span
              className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
              style={{
                color: catMeta.color,
                backgroundColor: catMeta.color + "22",
              }}
            >
              {catMeta.label}
            </span>
          )}
          <span className="text-[11px] text-[hsl(var(--text-muted))] font-medium">
            {post.author.displayName}
          </span>
          {/* Reaction summary */}
          {(post.reactions.positive > 0 || post.reactions.negative > 0) && (
            <>
              <span className="text-[hsl(var(--border))]">·</span>
              <span className="text-[11px] text-[hsl(var(--text-muted))] tabular-nums">
                {post.reactions.positive > 0 && (
                  <span className="mr-1">👍 {post.reactions.positive}</span>
                )}
                {post.reactions.positive > 0 && post.reactions.negative > 0 && (
                  <span className="opacity-40 mr-1">·</span>
                )}
                {post.reactions.negative > 0 && (
                  <span>👎 {post.reactions.negative}</span>
                )}
              </span>
            </>
          )}
          {post.commentsCount > 0 && (
            <>
              <span className="text-[hsl(var(--border))]">·</span>
              <span className="text-[11px] text-[hsl(var(--text-muted))]">
                {post.commentsCount} comment{post.commentsCount !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8 ${
        isLeft ? "flex-row" : "flex-row-reverse"
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0)"
          : isLeft
          ? "translateY(18px)"
          : "translateY(18px)",
        transition: visible
          ? "opacity 380ms cubic-bezier(0.22,1,0.36,1), transform 380ms cubic-bezier(0.22,1,0.36,1)"
          : "none",
      }}
    >
      {avatarEl}
      {bubbleEl}
    </div>
  );
}
