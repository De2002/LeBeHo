import type { User } from "@/types";

const STORAGE_KEY = "lebehо_auth_user";
const FOLLOWING_KEY = "lebehо_following";
const THEME_KEY = "lebehо_theme";
const SIGNED_IN_KEY = "lebehо_signed_in";
const INTRO_DISMISSED_KEY = "lebehо_intro_dismissed";

export const CURRENT_USER: User = {
  id: "me",
  username: "you",
  displayName: "Your Name",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces",
  bio: "Sharing honest thoughts and perspectives.",
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  trustScore: 60,
  joinedAt: new Date().toISOString(),
  topics: [],
};

export function getStoredUser(): User {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as User;
  } catch {}
  return CURRENT_USER;
}

export function saveUser(user: User): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getFollowing(): string[] {
  try {
    const stored = localStorage.getItem(FOLLOWING_KEY);
    if (stored) return JSON.parse(stored) as string[];
  } catch {}
  return ["u2", "u4"];
}

export function toggleFollow(userId: string): string[] {
  const following = getFollowing();
  const idx = following.indexOf(userId);
  if (idx >= 0) {
    following.splice(idx, 1);
  } else {
    following.push(userId);
  }
  localStorage.setItem(FOLLOWING_KEY, JSON.stringify(following));
  return following;
}

export function isSignedIn(): boolean {
  try {
    return localStorage.getItem(SIGNED_IN_KEY) === "true";
  } catch {}
  return false;
}

export function signIn(): void {
  localStorage.setItem(SIGNED_IN_KEY, "true");
}

export function isIntroDismissed(): boolean {
  try {
    return localStorage.getItem(INTRO_DISMISSED_KEY) === "true";
  } catch {}
  return false;
}

export function dismissIntro(): void {
  localStorage.setItem(INTRO_DISMISSED_KEY, "true");
}

export function getTheme(): "light" | "dark" {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return "light";
}

export function saveTheme(theme: "light" | "dark"): void {
  localStorage.setItem(THEME_KEY, theme);
}
