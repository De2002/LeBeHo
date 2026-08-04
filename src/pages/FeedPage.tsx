import { useState, useMemo } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { FEED_TABS, CATEGORIES } from "@/constants";
import { getFollowing } from "@/lib/auth";
import PostFeed from "@/components/features/PostFeed";
import Sidebar from "@/components/layout/Sidebar";
import { usePosts } from "@/hooks/usePosts";
import type { FeedTab } from "@/types";
import type { Category } from "@/types";
import GuestBanner from "@/components/features/GuestBanner";
import AuthModal from "@/components/features/AuthModal";
import { useAuth } from "@/hooks/useAuth";

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex gap-12">
      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Guest intro banner */}
        {!user && (
          <GuestBanner onJoin={() => setAuthOpen(true)} />
        )}

        {/* Feed Tabs */}
        <div className="flex items-center gap-6 mb-2 border-b border-[hsl(var(--border))]">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`feed-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto pb-3 flex items-center gap-2">
            <button
              onClick={() => reload()}
              className="lb-btn-ghost p-1.5"
              aria-label="Refresh feed"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>

          </div>
        </div>

        {/* Category filter row */}
        <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-none mb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-sm border transition-colors flex-shrink-0 ${
              !activeCategory
                ? "border-[hsl(var(--text-primary))] text-[hsl(var(--text-primary))]"
                : "border-[hsl(var(--border))] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
            }`}
          >
            All
          </button>
          {CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setActiveCategory(
                  activeCategory === cat.id ? null : (cat.id as Category)
                )
              }
              className={`flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-sm border transition-colors ${
                activeCategory === cat.id
                  ? "border-current"
                  : "border-[hsl(var(--border))] text-[hsl(var(--text-muted))] hover:border-current"
              }`}
              style={
                activeCategory === cat.id
                  ? { color: cat.color, borderColor: cat.color }
                  : {}
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-[hsl(var(--text-muted))]" />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="py-10 text-center">
            <p className="text-sm text-[hsl(var(--text-muted))] mb-3">{error}</p>
            <button onClick={() => reload()} className="lb-btn-outline text-xs">
              Try again
            </button>
          </div>
        )}

        {/* Following empty state */}
        {!loading && !error && activeTab === "following" && filteredPosts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[hsl(var(--text-primary))] font-semibold mb-2">
              Your Following feed is empty
            </p>
            <p className="text-sm text-[hsl(var(--text-muted))]">
              Follow people, topics, or discussions to see their posts here.
            </p>
          </div>
        )}

        {!loading && !error && (
          <PostFeed
            posts={filteredPosts}
            onReact={react}
            onToggleDiscussion={toggleDiscussion}
            emptyMessage={
              activeTab === "truth-picks"
                ? "No Truth Picks yet."
                : "No posts match these filters."
            }
          />
        )}
      </main>

      {/* Sidebar */}
      <Sidebar />

      {/* Auth modal triggered by banner CTA */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode="signup"
      />
    </div>
  );
}
