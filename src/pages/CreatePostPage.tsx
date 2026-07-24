import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Link as LinkIcon } from "lucide-react";
import { CATEGORIES, POST_TYPE_LABELS, getCategoryMeta } from "@/constants";
import type { PostType, Category, Source, Post } from "@/types";
import { getStoredUser } from "@/lib/auth";
import { usePosts } from "@/hooks/usePosts";
import { toast } from "sonner";
import ImageDropZone from "@/components/features/ImageDropZone";
import RichTextEditor from "@/components/features/RichTextEditor";
import SourceInput from "@/components/features/SourceInput";
import CharacterRing from "@/components/features/CharacterRing";

const POST_TYPES = Object.entries(POST_TYPE_LABELS) as [PostType, string][];
const MAIN_POINT_MAX = 280;
const PLAIN_TEXT_MIN = 20;

function htmlToPlainText(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent ?? tmp.innerText ?? "";
}

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { addPost } = usePosts();
  const user = getStoredUser();

  const [postType, setPostType] = useState<PostType>("opinion");
  const [category, setCategory] = useState<Category>("technology");
  const [mainPoint, setMainPoint] = useState("");
  const [explanationHtml, setExplanationHtml] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [moreLink, setMoreLink] = useState("");
  const [moreLinkLabel, setMoreLinkLabel] = useState("");
  const [showMoreLink, setShowMoreLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const catMeta = getCategoryMeta(category);
  const explanationText = htmlToPlainText(explanationHtml);
  const canSubmit =
    mainPoint.trim().length >= 10 &&
    explanationText.trim().length >= PLAIN_TEXT_MIN &&
    mainPoint.trim().length <= MAIN_POINT_MAX;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const newPost: Post = {
      id: `p-${Date.now()}`,
      author: user,
      type: postType,
      category,
      mainPoint: mainPoint.trim(),
      explanation: explanationText.trim(),
      image: imageUrl || undefined,
      sources,
      moreLink: moreLink.trim() || undefined,
      moreLinkLabel: moreLinkLabel.trim() || undefined,
      reactions: {
        positive: { type: "positive", count: 0, userReacted: false },
        negative: { type: "negative", count: 0, userReacted: false },
      },
      commentsCount: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      isFollowingDiscussion: false,
      trending: false,
      truthPick: false,
    };

    setTimeout(() => {
      addPost(newPost);
      toast.success("Your post is live.");
      navigate(`/post/${newPost.id}`);
    }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="lb-btn-ghost pl-0">
          <ArrowLeft size={14} />
        </button>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">
          Make a Point
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Post type */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-2">
            What kind of post is this?
          </label>
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map(([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() => setPostType(type)}
                className={`text-xs font-medium px-3 py-1.5 rounded-sm border transition-colors duration-150 ${
                  postType === type
                    ? "border-[hsl(var(--text-primary))] text-[hsl(var(--text-primary))] bg-[hsl(var(--surface))]"
                    : "border-[hsl(var(--border))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1.5 rounded-sm border transition-colors duration-150 ${
                  category === cat.id
                    ? "border-current"
                    : "border-[hsl(var(--border))] text-[hsl(var(--text-muted))] hover:border-current"
                }`}
                style={
                  category === cat.id
                    ? { color: cat.color, borderColor: cat.color }
                    : {}
                }
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Point + character ring */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))]">
              Your Point
            </label>
            <CharacterRing value={mainPoint.length} max={MAIN_POINT_MAX} />
          </div>
          <textarea
            value={mainPoint}
            onChange={(e) => setMainPoint(e.target.value)}
            placeholder={`State your ${POST_TYPE_LABELS[postType].toLowerCase()} clearly and directly…`}
            rows={2}
            className="lb-textarea w-full text-xl font-bold leading-snug placeholder:font-normal placeholder:text-base"
            maxLength={MAIN_POINT_MAX + 10}
          />
          {mainPoint.length > MAIN_POINT_MAX && (
            <p className="text-xs text-red-500 mt-1">
              {mainPoint.length - MAIN_POINT_MAX} characters over limit
            </p>
          )}
        </div>

        {/* Featured Image */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-3">
            Featured Image{" "}
            <span className="normal-case font-normal tracking-normal text-[hsl(var(--text-muted))]">
              — optional
            </span>
          </label>
          <ImageDropZone value={imageUrl} onChange={setImageUrl} />
        </div>

        {/* Explanation — rich text */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-3">
            Explanation
          </label>
          <RichTextEditor
            value={explanationHtml}
            onChange={setExplanationHtml}
            placeholder="Explain your reasoning. Add context, arguments, and perspective. The clearer and more honest your explanation, the better the discussion."
            minRows={6}
          />
          {explanationText.length > 0 && explanationText.length < PLAIN_TEXT_MIN && (
            <p className="text-xs text-[hsl(var(--text-muted))] mt-2">
              {PLAIN_TEXT_MIN - explanationText.length} more characters needed
            </p>
          )}
        </div>

        {/* Sources — with auto-fetch */}
        <SourceInput sources={sources} onChange={setSources} />

        {/* More Link */}
        <div>
          <button
            type="button"
            onClick={() => setShowMoreLink((v) => !v)}
            className="lb-btn-ghost text-[11px] py-1 pl-0 mb-2"
          >
            <LinkIcon size={12} />
            {showMoreLink
              ? "Remove full article link"
              : "Link to full article or essay"}
          </button>
          {showMoreLink && (
            <div className="flex flex-col gap-2">
              <input
                type="url"
                value={moreLink}
                onChange={(e) => setMoreLink(e.target.value)}
                placeholder="https://..."
                className="lb-input text-sm"
              />
              <input
                type="text"
                value={moreLinkLabel}
                onChange={(e) => setMoreLinkLabel(e.target.value)}
                placeholder="Link label (optional)"
                className="lb-input text-sm"
              />
            </div>
          )}
        </div>

        {/* Submit bar */}
        <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: catMeta.color }}
            />
            <span className="text-xs text-[hsl(var(--text-muted))]">
              {catMeta.label} · {POST_TYPE_LABELS[postType]}
            </span>
            {sources.length > 0 && (
              <span className="text-xs text-[hsl(var(--text-muted))]">
                · {sources.length} source{sources.length > 1 ? "s" : ""}
              </span>
            )}
            {imageUrl && (
              <span className="text-xs text-[hsl(var(--text-muted))]">
                · image attached
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="lb-btn-primary disabled:opacity-40"
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
