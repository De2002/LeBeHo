import { useState, useEffect, useCallback } from "react";
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
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfileByUsername } from "@/lib/profileService";
import { fetchPosts, rowToPost } from "@/lib/postService";
import { fetchUserReactions, toggleReaction, type ReactionType } from "@/lib/reactionService";
import { getFollowerCount, getFollowingCount, isFollowing } from "@/lib/followService";
import { formatCount } from "@/lib/utils";
import CategoryBadge from "@/components/features/CategoryBadge";
import FollowButton from "@/components/features/FollowButton";
import PostItem from "@/components/features/PostItem";
import type { Category, Post } from "@/types";
import type { ProfileData } from "@/lib/profileService";
import { toast } from "sonner";

type ProfileRow = ProfileData & { id: string; created_at?: string };

function trustInfo(agreeRatio: number, postCount: number) {
  if (postCount === 0) return { label: "New Voice", color: "#6B7280" };
  if (agreeRatio >= 0.75) return { label: "Highly Trusted", color: "#16A34A" };
  if (agreeRatio >= 0.55) return { label: "Trusted", color: "#2563EB" };
  if (agreeRatio >= 0.4) return { label: "Building Trust", color: "#CA8A04" };
  return { label: "New Voice", color: "#6B7280" };
}

function normaliseUrl(url: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

function formatJoinDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// In-memory discussion follow set for this page
const localDiscSet = new Set<string>();

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [authUserFollows, setAuthUserFollows] = useState(false);

  // Fetch profile
  useEffect(() => {
    if (!username) return;
    setLoadingProfile(true);
    fetchProfileByUsername(username).then((p) => {
      setProfile(p);
      setLoadingProfile(false);
    });
  }, [username]);

  // Fetch follow counts + auth user follow state once profile id is known
  useEffect(() => {
    if (!profile?.id) return;
    getFollowerCount(profile.id).then(setFollowerCount);
    getFollowingCount(profile.id).then(setFollowingCount);
    if (authUser?.id && authUser.id !== profile.id) {
      isFollowing(authUser.id, profile.id).then(setAuthUserFollows);
    }
  }, [profile?.id, authUser?.id]);

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

  // React handler
  const handleReact = useCallback(async (postId: string, reactionType: "positive" | "negative") => {
    if (!authUser) {
      toast.error("Sign in to react to posts.");
      return;
    }
    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;

    const currentType: ReactionType | null = currentPost.reactions.positive.userReacted
      ? "positive" : currentPost.reactions.negative.userReacted ? "negative" : null;

    let positiveDelta = 0;
    let negativeDelta = 0;
    let newType: ReactionType | null;

    if (currentType === reactionType) {
      newType = null;
      if (reactionType === "positive") positiveDelta = -1;
      else negativeDelta = -1;
    } else {
      newType = reactionType;
      if (currentType === "positive") positiveDelta = -1;
      else if (currentType === "negative") negativeDelta = -1;
      if (reactionType === "positive") positiveDelta += 1;
      else negativeDelta += 1;
    }

    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      return {
        ...p,
        reactions: {
          positive: { ...p.reactions.positive, userReacted: newType === "positive", count: Math.max(0, p.reactions.positive.count + positiveDelta) },
          negative: { ...p.reactions.negative, userReacted: newType === "negative", count: Math.max(0, p.reactions.negative.count + negativeDelta) },
        },
      };
    }));

    try {
      await toggleReaction(authUser.id, postId, reactionType, currentType);
    } catch {
      toast.error("Failed to save reaction.");
    }
  }, [authUser, posts]);

  // Toggle discussion follow (in-memory)
  const handleToggleDiscussion = useCallback((postId: string) => {
    if (localDiscSet.has(postId)) localDiscSet.delete(postId);
    else localDiscSet.add(postId);
    const following = localDiscSet.has(postId);
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, isFollowingDiscussion: following } : p));
  }, []);

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
        <Link to="/" className="lb-btn-outline mt-6 inline-flex">Back to feed</Link>
      </div>
    );
  }

  const isOwnProfile = authUser?.id === profile.id;
  const displayName = profile.display_name || profile.username || "Unknown";
  const avatar = profile.avatar_url
    ? profile.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0a0a0a&color=ffffff&size=160`;

  // Compute trust score from real reaction data
  const totalPositive = posts.reduce((s, p) => s + p.reactions.positive.count, 0);
  const totalReactions = posts.reduce((s, p) => s + p.reactions.positive.count + p.reactions.negative.count, 0);
  const agreeRatio = totalReactions > 0 ? totalPositive / totalReactions : 0;
  const { label: trustLabel, color: trustColor } = trustInfo(agreeRatio, posts.length);

  const joinDate = formatJoinDate(profile.created_at);
  const hasSocials = profile.website || profile.twitter || profile.linkedin || profile.instagram;

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
        <p className="text-sm text-[hsl(var(--text-muted))] mb-2">@{profile.username}</p>

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

        {/* Trust badge */}
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-sm border mb-4"
          style={{ color: trustColor, borderColor: trustColor + "40" }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: trustColor }} />
          {trustLabel}
        </span>

        {/* Join date */}
        {joinDate && (
          <p className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--text-muted))] mb-3">
            <Calendar size={10} />
            Joined {joinDate}
          </p>
        )}

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
            <div className="text-[11px] text-[hsl(var(--text-muted))] uppercase tracking-wide">Posts</div>
          </div>
          <div className="w-px h-8 bg-[hsl(var(--border))]" />
          <div className="text-center">
            <div className="text-lg font-extrabold text-[hsl(var(--text-primary))]">
              {formatCount(followerCount)}
            </div>
            <div className="text-[11px] text-[hsl(var(--text-muted))] uppercase tracking-wide">Followers</div>
          </div>
          <div className="w-px h-8 bg-[hsl(var(--border))]" />
          <div className="text-center">
            <div className="text-lg font-extrabold text-[hsl(var(--text-primary))]">
              {formatCount(followingCount)}
            </div>
            <div className="text-[11px] text-[hsl(var(--text-muted))] uppercase tracking-wide">Following</div>
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
          <FollowButton
            userId={profile.id}
            onToggle={(f) => setFollowerCount((c) => f ? c + 1 : Math.max(0, c - 1))}
          />
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
              onReact={handleReact}
              onToggleDiscussion={handleToggleDiscussion}
              preview
            />
          ))
        )}
      </div>
    </div>
  );
}
