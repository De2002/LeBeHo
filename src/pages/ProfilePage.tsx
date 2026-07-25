import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Calendar, ExternalLink } from "lucide-react";
import { MOCK_USERS } from "@/lib/mockData";
import { MOCK_POSTS } from "@/lib/mockData";
import { getStoredUser } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { formatCount } from "@/lib/utils";
import CategoryBadge from "@/components/features/CategoryBadge";
import FollowButton from "@/components/features/FollowButton";
import TrustScore from "@/components/features/TrustScore";
import PostItem from "@/components/features/PostItem";
import { usePosts } from "@/hooks/usePosts";
import type { Category } from "@/types";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const currentUser = getStoredUser();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { posts, react, toggleDiscussion } = usePosts({ userId: undefined });

  const profileUser =
    username === currentUser.username
      ? currentUser
      : MOCK_USERS.find((u) => u.username === username);

  if (!profileUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-[hsl(var(--text-muted))]">User not found.</p>
        <Link to="/" className="lb-btn-outline mt-6 inline-flex">
          Back to feed
        </Link>
      </div>
    );
  }

  const isOwnProfile = profileUser.id === currentUser.id || (authUser && profileUser.id === authUser.id);
  const userPosts = posts.filter((p) => p.author.id === profileUser.id);
  const joinDate = new Date(profileUser.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const trustLabel =
    profileUser.trustScore >= 90
      ? "Highly Trusted"
      : profileUser.trustScore >= 75
      ? "Trusted"
      : profileUser.trustScore >= 60
      ? "Building Trust"
      : "New Voice";

  const trustColor =
    profileUser.trustScore >= 90
      ? "#16A34A"
      : profileUser.trustScore >= 75
      ? "#2563EB"
      : profileUser.trustScore >= 60
      ? "#CA8A04"
      : "#DC2626";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile Header — centered layout */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* Avatar — centered, prominent */}
        <div className="relative mb-4">
          <img
            src={profileUser.avatar}
            alt={profileUser.displayName}
            className="w-20 h-20 rounded-full object-cover border border-[hsl(var(--border))]"
          />
          <span
            className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[hsl(var(--background))]"
            style={{ backgroundColor: trustColor }}
            title={trustLabel}
          />
        </div>

        <h1 className="text-2xl font-extrabold text-[hsl(var(--text-primary))] mb-0.5">
          {profileUser.displayName}
        </h1>
        <p className="text-sm text-[hsl(var(--text-muted))] mb-3">
          @{profileUser.username}
        </p>

        {profileUser.bio && (
          <p className="text-sm text-[hsl(var(--text-secondary))] max-w-sm leading-relaxed mb-4">
            {profileUser.bio}
          </p>
        )}

        {/* Trust badge */}
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-sm border mb-4"
          style={{ color: trustColor, borderColor: trustColor + "40" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: trustColor }}
          />
          {trustLabel} · {profileUser.trustScore} Trust Score
        </span>

        {/* Topics */}
        {profileUser.topics.length > 0 && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
            {profileUser.topics.map((t) => (
              <CategoryBadge key={t} category={t as Category} />
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-[hsl(var(--text-muted))] mb-5">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            Joined {joinDate}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-5">
          <div className="text-center">
            <div className="text-lg font-extrabold text-[hsl(var(--text-primary))]">
              {formatCount(profileUser.postsCount)}
            </div>
            <div className="text-[11px] text-[hsl(var(--text-muted))] uppercase tracking-wide">
              Posts
            </div>
          </div>
          <div className="w-px h-8 bg-[hsl(var(--border))]" />
          <div className="text-center">
            <div className="text-lg font-extrabold text-[hsl(var(--text-primary))]">
              {formatCount(profileUser.followersCount)}
            </div>
            <div className="text-[11px] text-[hsl(var(--text-muted))] uppercase tracking-wide">
              Followers
            </div>
          </div>
          <div className="w-px h-8 bg-[hsl(var(--border))]" />
          <div className="text-center">
            <div className="text-lg font-extrabold text-[hsl(var(--text-primary))]">
              {formatCount(profileUser.followingCount)}
            </div>
            <div className="text-[11px] text-[hsl(var(--text-muted))] uppercase tracking-wide">
              Following
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isOwnProfile ? (
          <FollowButton userId={profileUser.id} />
        ) : (
          <button
            onClick={() => navigate("/settings/profile")}
            className="lb-btn-outline text-sm"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Thin divider */}
      <div className="lb-divider mb-6" />

      {/* Posts */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))] mb-2">
          {isOwnProfile ? "Your Posts" : `Posts by ${profileUser.displayName}`}
        </h2>
        {userPosts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[hsl(var(--text-muted))]">No posts yet.</p>
            {isOwnProfile && (
              <Link to="/create" className="lb-btn-primary mt-4 inline-flex">
                Make your first post
              </Link>
            )}
          </div>
        ) : (
          userPosts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              onReact={react}
              onToggleDiscussion={toggleDiscussion}
              preview
            />
          ))
        )}
      </div>
    </div>
  );
}
