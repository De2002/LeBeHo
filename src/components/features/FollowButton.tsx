import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isFollowing, toggleFollow } from "@/lib/followService";
import { toast } from "sonner";

interface FollowButtonProps {
  userId: string;
  onToggle?: (following: boolean) => void;
  size?: "sm" | "md";
}

export default function FollowButton({
  userId,
  onToggle,
  size = "md",
}: FollowButtonProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check follow state on mount
  useEffect(() => {
    if (!user?.id || user.id === userId) return;
    isFollowing(user.id, userId).then(setFollowing);
  }, [user?.id, userId]);

  // Don't show follow button for own profile
  if (!user || user.id === userId) return null;

  const handleToggle = async () => {
    if (!user?.id) {
      toast.error("Sign in to follow users.");
      return;
    }
    setLoading(true);
    try {
      const newState = await toggleFollow(user.id, userId);
      setFollowing(newState);
      onToggle?.(newState);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update follow.");
    } finally {
      setLoading(false);
    }
  };

  if (size === "sm") {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-sm border transition-colors duration-150 disabled:opacity-60 ${
          following
            ? "border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:border-rose-400 hover:text-rose-500"
            : "border-[hsl(var(--text-primary))] text-[hsl(var(--text-primary))] bg-[hsl(var(--text-primary)/0.05)] hover:bg-[hsl(var(--text-primary)/0.1)]"
        }`}
      >
        {loading ? <Loader2 size={10} className="animate-spin" /> : null}
        {following ? "Following" : "Follow"}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-sm border transition-colors duration-150 disabled:opacity-60 ${
        following
          ? "border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:border-rose-400 hover:text-rose-500"
          : "lb-btn-primary"
      }`}
    >
      {loading && <Loader2 size={13} className="animate-spin" />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
