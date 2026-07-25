import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { TrendingUp, Hash } from "lucide-react";
import { CATEGORIES } from "@/constants";
import { supabase } from "@/lib/supabase";
import FollowButton from "@/components/features/FollowButton";
import { formatCount } from "@/lib/utils";
import { usePosts } from "@/hooks/usePosts";
import type { User } from "@/types";

export default function Sidebar() {
  const { posts } = usePosts();
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .limit(3);

      if (error) {
        console.error("[Sidebar] Error fetching users:", error);
      } else {
        setSuggestedUsers((data || []) as User[]);
      }
    };

    fetchSuggestedUsers();
  }, []);

  const trendingPosts = posts.filter((p) => p.trending).slice(0, 3);

  return (
    <aside className="hidden lg:block w-[280px] flex-shrink-0">
      <div className="sticky top-20 flex flex-col gap-8">
        {/* Categories */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-3 flex items-center gap-1.5">
            <Hash size={11} />
            Topics
          </h3>
          <div className="flex flex-col gap-0.5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/?category=${cat.id}`}
                className="flex items-center gap-2.5 py-1.5 text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors duration-150 group"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 opacity-80"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-3 flex items-center gap-1.5">
            <TrendingUp size={11} />
            Trending
          </h3>
          <div className="flex flex-col gap-4">
            {trendingPosts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="block group"
              >
                <p className="text-sm font-semibold text-[hsl(var(--text-primary))] leading-snug group-hover:text-[hsl(var(--accent))] transition-colors line-clamp-2">
                  {post.mainPoint}
                </p>
                <p className="text-xs text-[hsl(var(--text-muted))] mt-1">
                  {formatCount(post.commentsCount)} comments
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Suggested */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-3">
            Voices to Follow
          </h3>
          <div className="flex flex-col gap-3">
            {suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-2.5">
                <Link to={`/profile/${user.username}`} className="flex-shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${user.username}`}
                    className="text-sm font-medium text-[hsl(var(--text-primary))] hover:underline block truncate"
                  >
                    {user.displayName}
                  </Link>
                  <p className="text-[11px] text-[hsl(var(--text-muted))] truncate">
                    {user.topics.slice(0, 2).join(", ")}
                  </p>
                </div>
                <FollowButton userId={user.id} size="sm" />
              </div>
            ))}
          </div>
        </section>

        <p className="text-[10px] text-[hsl(var(--text-muted))]">
          LeBeHo · Let's Be Honest
        </p>
      </div>
    </aside>
  );
}
