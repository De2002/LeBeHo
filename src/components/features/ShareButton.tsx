import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  compact?: boolean;
}

export default function ShareButton({ title, text, url, compact }: ShareButtonProps) {
  const shareUrl = url ?? window.location.href;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Could not copy link"));
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-[13px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
      aria-label="Share this post"
    >
      <Share2 size={compact ? 14 : 15} />
      <span>Share</span>
    </button>
  );
}
