import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isIntroDismissed, dismissIntro } from "@/lib/auth";

interface GuestBannerProps {
  onJoin?: () => void;
}

export default function GuestBanner({ onJoin }: GuestBannerProps) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(() => !user && !isIntroDismissed());

  if (user || !visible) return null;

  const handleDismiss = () => {
    dismissIntro();
    setVisible(false);
  };

  return (
    <div className="post-card mb-4 relative overflow-hidden">
      {/* Top accent */}
      <div className="h-1.5 w-full bg-[hsl(var(--accent))]" />

      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>

      <div className="px-5 py-5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--accent))] mb-2">
          Welcome to LeBeHo
        </p>
        <h2 className="text-xl font-extrabold text-[hsl(var(--text-primary))] leading-snug mb-2">
          Broadcasting honesty.
        </h2>
        <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed mb-5 max-w-sm mx-auto">
          Share opinions you actually stand behind. Agree, disagree, and have real conversations — backed by reasoning and sources.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { if (onJoin) onJoin(); handleDismiss(); }}
            className="bg-[hsl(var(--accent))] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Join LeBeHo
            <ArrowRight size={14} />
          </button>
          <button
            onClick={handleDismiss}
            className="text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          >
            Just browsing
          </button>
        </div>
      </div>
    </div>
  );
}
