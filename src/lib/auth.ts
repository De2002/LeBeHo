import type { User } from "@/types";

// Fallback placeholder user (used only when no auth session exists)
export const CURRENT_USER: User = {
  id: "guest",
  username: "guest",
  displayName: "Guest",
  avatar:
    "https://ui-avatars.com/api/?name=Guest&background=0a0a0a&color=ffffff&size=80",
  bio: "",
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  trustScore: 0,
  joinedAt: new Date().toISOString(),
  topics: [],
};

// In-memory following set — no localStorage
const followingSet = new Set<string>();

export function getStoredUser(): User {
  return CURRENT_USER;
}

export function saveUser(_user: User): void {
  // No-op: user data is managed by Supabase auth
}

export function getFollowing(): string[] {
  return Array.from(followingSet);
}

export function toggleFollow(userId: string): string[] {
  if (followingSet.has(userId)) {
    followingSet.delete(userId);
  } else {
    followingSet.add(userId);
  }
  return Array.from(followingSet);
}

export function isSignedIn(): boolean {
  return false; // Real auth state lives in useAuth / Supabase
}

export function signIn(): void {
  // No-op
}

export function isIntroDismissed(): boolean {
  return false;
}

export function dismissIntro(): void {
  // No-op
}

export function getTheme(): "light" | "dark" {
  return "light";
}

export function saveTheme(_theme: "light" | "dark"): void {
  // No-op: theme is managed by useTheme hook
}
