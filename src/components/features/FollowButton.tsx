import { useState } from "react";
import { toggleFollow, getFollowing } from "@/lib/auth";

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  onToggle?: (following: boolean) => void;
  size?: "sm" | "md";
}

export default function FollowButton({
  userId,
  initialFollowing = false,
  onToggle,
  size = "md",
}: FollowButtonProps) {
  const [following, setFollowing] = useState(
    () => initialFollowing || getFollowing().includes(userId)
  );

  const handleToggle = () => {
    const updatedList = toggleFollow(userId);
    const newState = updatedList.includes(userId);
    setFollowing(newState);
    onToggle?.(newState);
  };

  if (size === "sm") {
    return (
      <button
        onClick={handleToggle}
        className={`text-xs font-semibold px-3 py-1 rounded-sm border transition-colors duration-150 ${
          following
            ? "border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:border-rose-400 hover:text-rose-500"
            : "border-[hsl(var(--text-primary))] text-[hsl(var(--text-primary))] bg-[hsl(var(--text-primary)/0.05)] hover:bg-[hsl(var(--text-primary)/0.1)]"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`px-5 py-2 text-sm font-semibold rounded-sm border transition-colors duration-150 ${
        following
          ? "border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:border-rose-400 hover:text-rose-500"
          : "lb-btn-primary"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
