import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ExternalLink,
  Briefcase,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  Loader2,
  BarChart2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { fetchProfileByUsername } from "@/lib/profileService";
import { fetchPosts, rowToPost } from "@/lib/postService";
import { fetchUserReactions } from "@/lib/reactionService";
import { formatCount } from "@/lib/utils";
import CategoryBadge from "@/components/features/CategoryBadge";
import FollowButton from "@/components/features/FollowButton";
import PostItem from "@/components/features/PostItem";
import type { Category, Post } from "@/types";
import type { ProfileData } from "@/lib/profileService";

type ProfileRow = ProfileData & { id: string };

function trustInfo(score: number) {
  if (score >= 90) return { label: "Highly Trusted", color: "#16A34A" };
  if (score >= 75) return { label: "Trusted", color: "#2563EB" };
  if (score >= 60) return { label: "Building Trust", color: "#CA8A04" };
  return { label: "New Voice", color: "#DC2626" };
}

function normaliseUrl(url: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: authUser } = useAuth();
  const { react: reactPost, toggleDiscussion: toggleDisc } = usePosts();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Fetch profile
  useEffect(() => {
    if (!username) return;
    setLoadingProfile(true);
    fetchProfileByUsername(username).then((p) => {
      setProfile(p);
      setLoadingProfile(false);
    });
  }, [username]);

  // Fetch posts once profile id is known
  useEffect(() => {
    if (!profile?.id) return;
    setLoadingPosts(true);
    fetchPosts({ userId: profile.id }).then(async (rows) => {
      let userReactions: Record<string, "positive" | "negative"> = {};
      if (authUser?.id) {
        userReactions = await fetchUserReactions(authUser.id, rows.map((r) => r.id));
      }
      setPosts(rows.map((r) => rowToPost(r, userReactions)));
      setLoadingPosts(false);
    }).catch(() => setLoadingPosts(false));
  }, [profile?.id, authUser?.id]);

  if (loadingProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 size={20} className="animate-spin text-[hsl(var(--text-muted))]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-[hsl(var(--text-muted))]">User not found.</p>
        <Link to="/" className="lb-btn-outline mt-6 inline-flex">
          Back to feed
        </Link>
      </div>
    );
  }

  const isOwnProfile = authUser?.id === profile.id;
  const displayName = profile.display_name || profile.username || "Unknown";
  const avatar = profile.avatar_url
    ? profile.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0a0a0a&color=ffffff&size=160`;

  const { label: trustLabel, color: trustColor } = trustInfo(70);

  const joinDate = ""; // not stored in profile table; would need created_at column

  const hasSocials =
    profile.website || profile.twitter || profile.linkedin || profile.instagram;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* Avatar */}
        <div className="relative mb-4">
          <img
            src={avatar}
            alt={displayName}
            className="w-24 h-24 rounded-full object-cover border border-[hsl(var(--border))]"
          />
          <span
            className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-[hsl(var(--background))]"
            style={{ backgroundColor: trustColor }}
            title={trustLabel}
          />
        </div>

        {/* Name */}
        <h1 className="text-2xl font-extrabold text-[hsl(var(--text-primary))] mb-0.5 leading-tight">
          {displayName}
        </h1>
        <p className="text-sm text-[hsl(var(--text-muted))] mb-2">
          @{profile.username}
        </p>

        {/* Profession */}
        {profile.profession && (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--text-secondary))] mb-3">
            <Briefcase size={11} className="text-[hsl(var(--text-muted))]" />
            {profile.profession}
          </p>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-[hsl(var(--text-secondary))] max-w-sm leading-relaxed mb-4">
            {profile.bio}
          </p>
        )}

        <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-sm border mb-4"
            style={{ color: trustColor, borderColor: trustColor + "40" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: trustColor }} />
            {trustLabel}
          </span>

        {/* Topics */}
        {profile.topics.length > 0 && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
            {profile.topics.map((t) => (
              <CategoryBadge key={t} category={t as Category} />
            ))}
          </div>
        )}

        {/* Social links */}
        {hasSocials && (
          <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
            {profile.website && (
              <a
                href={normaliseUrl(profile.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--accent))] transition-colors"
                title="Website"
              >
                <Globe size={13} />
                <span className="max-w-[120px] truncate">
                  {profile.website.replace(/^https?:\/\//, "")}
                </span>
                <ExternalLink size={10} />
              </a>
            )}
            {profile.twitter && (
              <a
                href={`https://x.com/${profile.twitter.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                title="X / Twitter"
              >
                <Twitter size={13} />
                @{profile.twitter.replace(/^@/, "")}
              </a>
            )}
            {profile.linkedin && (
              <a
                href={`https://linkedin.com/in/${profile.linkedin.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[hsl(var(--text-muted))] hover:text-[#0A66C2] transition-colors"
                title="LinkedIn"
              >
                <Linkedin size={13} />
                {profile.linkedin.replace(/^@/, "")}
              </a>
            )}
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[hsl(var(--text-muted))] hover:text-[#E1306C] transition-colors"
                title="Instagram"
              >
                <Instagram size={13} />
                @{profile.instagram.replace(/^@/, "")}
              </a>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-6 mb-5">
          <div className="text-center">
            <div className="text-lg font-extrabold text-[hsl(var(--text-primary))]">
              {loadingPosts ? "—" : formatCount(posts.length)}
            </div>
            <div className="text-[11px] text-[hsl(var(--text-muted))] uppercase tracking-wide">
              Posts
            </div>
          </div>
          <div className="w-px h-8 bg-[hsl(var(--border))]" />
          <div className="text-center">
            <div className="text-lg font-extrabold text-[hsl(var(--text-primary))]">—</div>
            <div className="text-[11px] text-[hsl(var(--text-muted))] uppercase tracking-wide">
              Followers
            </div>
          </div>
          <div className="w-px h-8 bg-[hsl(var(--border))]" />
          <div className="text-center">
            <div className="text-lg font-extrabold text-[hsl(var(--text-primary))]">—</div>
            <div className="text-[11px] text-[hsl(var(--text-muted))] uppercase tracking-wide">
              Following
            </div>
          </div>
        </div>

        {/* CTA */}
        {isOwnProfile ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/settings/profile")}
              className="lb-btn-outline text-sm"
            >
              Edit Profile
            </button>
            <button
              onClick={() => navigate("/stats")}
              className="lb-btn-ghost text-sm"
            >
              <BarChart2 size={13} />
              Stats
            </button>
          </div>
        ) : (
          <FollowButton userId={profile.id} />
        )}
      </div>

      {/* Divider */}
      <div className="lb-divider mb-6" />

      {/* Posts section */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-2">
          {isOwnProfile ? "Your Posts" : `Posts by ${displayName}`}
        </h2>

        {loadingPosts ? (
          <div className="flex justify-center py-10">
            <Loader2 size={18} className="animate-spin text-[hsl(var(--text-muted))]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[hsl(var(--text-muted))]">No posts yet.</p>
            {isOwnProfile && (
              <Link to="/create" className="lb-btn-primary mt-4 inline-flex">
                Make your first post
              </Link>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              onReact={reactPost}
              onToggleDiscussion={toggleDisc}
              preview
            />
          ))
        )}
      </div>
    </div>
  );
}
