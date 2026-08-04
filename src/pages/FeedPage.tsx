import { useState, useMemo } from "react";
import { Flame, Clock, Users, Shield, Loader2, RefreshCw } from "lucide-react";
import { CATEGORIES } from "@/constants";
import { getFollowing } from "@/lib/auth";
import PostFeed from "@/components/features/PostFeed";
import { usePosts } from "@/hooks/usePosts";
import type { FeedTab } from "@/types";
import type { Category } from "@/types";
import GuestBanner from "@/components/features/GuestBanner";
import AuthModal from "@/components/features/AuthModal";
import { useAuth } from "@/hooks/useAuth";

const TABS: { id: FeedTab["id"]; label: string; icon: React.ReactNode }[] = [
  { id: "discover",    label: "Trending",   icon: <Flame size={14} /> },
  { id: "following",   label: "Following",  icon: <Users size={14} /> },
  { id: "truth-picks", label: "Expert",     icon: <Shield size={14} /> },
];

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab["id"]>("discover");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const { posts, loading, error, react, toggleDiscussion, reload } = usePosts({ category: activeCategory });
  const following = getFollowing();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (activeTab === "following") {
      list = list.filter((p) => following.includes(p.author.id));
    } else if (activeTab === "truth-picks") {
      list = list.filter((p) => p.truthPick);
    }
    return list;
  }, [posts, activeTab, following]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      {/* Guest banner */}
      {!user && <GuestBanner onJoin={() => setAuthOpen(true)} />}

      {/* Feed Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] rounded-t-xl px-2 pt-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`feed-tab px-3 ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => reload()}
          className="ml-auto p-1.5 mb-3 rounded-full text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--background))] transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-none mb-4">
        <button
          onClick={() => setActiveCategory(null)}
          className={`text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 ${
            !activeCategory
              ? "border-[hsl(var(--text-primary))] text-[hsl(var(--text-primary))] bg-[hsl(var(--text-primary)/0.06)]"
              : "border-[hsl(var(--border))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
          }`}
        >
          All
        </button>
        {CATEGORIES.slice(0, 8).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : (cat.id as Category))}
            className={`flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-colors ${
              activeCategory === cat.id ? "border-current" : "border-[hsl(var(--border))] text-[hsl(var(--text-muted))]"
            }`}
            style={activeCategory === cat.id ? { color: cat.color, borderColor: cat.color, backgroundColor: cat.color + "14" } : {}}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={20} className="animate-spin text-[hsl(var(--text-muted))]" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="py-10 text-center">
          <p className="text-sm text-[hsl(var(--text-muted))] mb-3">{error}</p>
          <button onClick={() => reload()} className="lb-btn-outline text-xs">Try again</button>
        </div>
      )}

      {/* Following empty */}
      {!loading && !error && activeTab === "following" && filteredPosts.length === 0 && (
        <div className="py-12 text-center bg-[hsl(var(--surface))] rounded-2xl border border-[hsl(var(--border))]">
          <p className="font-semibold text-[hsl(var(--text-primary))] mb-1">Your Following feed is empty</p>
          <p className="text-sm text-[hsl(var(--text-muted))]">Follow people to see their posts here.</p>
        </div>
      )}

      {!loading && !error && (
        <PostFeed
          posts={filteredPosts}
          onReact={react}
          onToggleDiscussion={toggleDiscussion}
          emptyMessage={activeTab === "truth-picks" ? "No Expert picks yet." : "No posts match these filters."}
        />
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultMode="signup" />
    </div>
  );
}
