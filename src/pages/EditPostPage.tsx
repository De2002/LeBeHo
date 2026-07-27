import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Link as LinkIcon, Loader2 } from "lucide-react";
import { CATEGORIES, POST_TYPE_LABELS, getCategoryMeta } from "@/constants";
import type { PostType, Category, Source } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { fetchPostById, updatePost, uploadPostImage } from "@/lib/postService";
import { toast } from "sonner";
import ImageDropZone from "@/components/features/ImageDropZone";
import RichTextEditor from "@/components/features/RichTextEditor";
import SourceInput from "@/components/features/SourceInput";
import CharacterRing from "@/components/features/CharacterRing";

const POST_TYPES = Object.entries(POST_TYPE_LABELS) as [PostType, string][];
const MAIN_POINT_MAX = 280;

function htmlToPlainText(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent ?? tmp.innerText ?? "";
}

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loadingPost, setLoadingPost] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const [postType, setPostType] = useState<PostType>("opinion");
  const [category, setCategory] = useState<Category>("technology");
  const [mainPoint, setMainPoint] = useState("");
  const [explanationHtml, setExplanationHtml] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [showMoreLink, setShowMoreLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load post data
  useEffect(() => {
    if (!id) return;
    setLoadingPost(true);
    fetchPostById(id).then((row) => {
      if (!row) {
        setNotFound(true);
        setLoadingPost(false);
        return;
      }
      if (user && row.user_id !== user.id) {
        setUnauthorized(true);
        setLoadingPost(false);
        return;
      }
      setPostType(row.type as PostType);
      setCategory(row.category as Category);
      setMainPoint(row.main_point);
      // Restore explanation as plain text wrapped in a paragraph for the editor
      setExplanationHtml(`<p>${(row.explanation ?? "").replace(/\n/g, "<br>")}</p>`);
      setImageUrl(row.image_url ?? "");
      setSources(Array.isArray(row.sources) ? row.sources : []);
      setLoadingPost(false);
    });
  }, [id, user]);

  const catMeta = getCategoryMeta(category);
  const explanationText = htmlToPlainText(explanationHtml);
  const canSubmit =
    mainPoint.trim().length >= 10 &&
    explanationText.trim().length >= 20 &&
    mainPoint.trim().length <= MAIN_POINT_MAX;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting || !id || !user) return;

    setSubmitting(true);
    try {
      // If imageUrl is still an object/blob URL, the user selected a new file
      let finalImageUrl: string | null =
        imageUrl && !imageUrl.startsWith("blob:") ? imageUrl : null;
      if (imageFile) {
        try {
          finalImageUrl = await uploadPostImage(user.id, imageFile);
          console.log("[EditPost] image uploaded:", finalImageUrl);
        } catch (err: unknown) {
          toast.error(`Image upload failed: ${(err as Error).message ?? "unknown error"}`);
          setSubmitting(false);
          return;
        }
      }

      await updatePost(id, {
        mainPoint: mainPoint.trim(),
        explanation: explanationHtml.trim(),
        category,
        type: postType,
        imageUrl: finalImageUrl,
        sources,
      });

      toast.success("Post updated.");
      navigate(`/post/${id}`);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update post.");
      setSubmitting(false);
    }
  };

  const handleImageChange = (url: string, file?: File) => {
    if (!url) {
      setImageUrl("");
      setImageFile(null);
      return;
    }
    if (file) {
      setImageFile(file);
      setImageUrl(url);
    } else {
      setImageFile(null);
      setImageUrl(url);
    }
  };

  if (loadingPost) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 size={20} className="animate-spin text-[hsl(var(--text-muted))]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-[hsl(var(--text-muted))]">Post not found.</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-[hsl(var(--text-muted))]">
          You can only edit your own posts.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="lb-btn-ghost pl-0">
          <ArrowLeft size={14} />
        </button>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">
          Edit Post
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Post type */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-2">
            Post Type
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

        {/* Main Point */}
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
            rows={2}
            className="lb-textarea w-full text-xl font-bold leading-snug"
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
          <ImageDropZone value={imageUrl} onChange={handleImageChange} />
        </div>

        {/* Explanation */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] block mb-3">
            Explanation
          </label>
          <RichTextEditor
            value={explanationHtml}
            onChange={setExplanationHtml}
            placeholder="Explain your reasoning..."
            minRows={6}
          />
        </div>

        {/* Sources */}
        <SourceInput sources={sources} onChange={setSources} />

        {/* More Link toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowMoreLink((v) => !v)}
            className="lb-btn-ghost text-[11px] py-1 pl-0 mb-2"
          >
            <LinkIcon size={12} />
            {showMoreLink ? "Remove full article link" : "Link to full article or essay"}
          </button>
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
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="lb-btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="lb-btn-primary disabled:opacity-40 min-w-[80px] justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
