import { useState } from "react";
import { X, ArrowRight, MessageSquareQuote, BookOpen, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isIntroDismissed, dismissIntro } from "@/lib/auth";

interface GuestBannerProps {
  onJoin?: () => void;
}

export default function GuestBanner({ onJoin }: GuestBannerProps) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(
    () => !user && !isIntroDismissed()
  );

  // Hide if user signs in while banner is visible
  if (user || !visible) return null;

  const handleDismiss = () => {
    dismissIntro();
    setVisible(false);
  };

  const pillars = [
    {
      icon: MessageSquareQuote,
      heading: "Make a Point",
      body: "State your opinion, idea, or observation clearly. Add your reasoning and attach sources to back it up.",
    },
    {
      icon: BookOpen,
      heading: "Evidence Counts",
      body: "Posts with sources carry more weight. The platform rewards well-reasoned arguments over noise.",
    },
    {
      icon: Users,
      heading: "Real Discussion",
      body: "Agree, disagree, or add to the conversation. Follow discussions that matter to you and get notified.",
    },
  ];

  return (
    <div className="mb-6 border border-[hsl(var(--border))] rounded-sm relative">
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 p-1 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
      >
        <X size={13} />
      </button>

      <div className="px-5 pt-6 pb-5">
        {/* Eyebrow */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-2">
          Welcome to LeBeHo
        </p>

        {/* Headline */}
        <h2 className="text-xl font-bold text-[hsl(var(--text-primary))] leading-snug mb-2 max-w-lg">
          Honest opinions. Clear reasoning.
          <br />
          Real conversations.
        </h2>

        {/* Description */}
        <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed max-w-xl mb-6">
          LeBeHo is where people share ideas they actually stand behind. Every
          post has a clear point, an explanation, and optional sources — so
          discussions stay grounded. Browse freely, or join to make your own
          points heard.
        </p>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {pillars.map(({ icon: Icon, heading, body }) => (
            <div key={heading} className="flex gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <Icon size={14} className="text-[hsl(var(--text-muted))]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--text-primary))] mb-0.5">
                  {heading}
                </p>
                <p className="text-xs text-[hsl(var(--text-secondary))] leading-relaxed">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[hsl(var(--border-subtle))] mb-4" />

        {/* CTA row */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              if (onJoin) onJoin();
              handleDismiss();
            }}
            className="lb-btn-primary gap-2"
          >
            Join LeBeHo
            <ArrowRight size={13} />
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          >
            Just browsing
          </button>
        </div>
      </div>
    </div>
  );
}
