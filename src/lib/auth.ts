import type { User } from "@/types";
import { supabase } from "./supabase";

// Fetch current user from Supabase auth
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    console.error("[getCurrentUser] Auth error:", error);
    return null;
  }

  // Fetch user profile from database
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profileError) {
    console.error("[getCurrentUser] Profile fetch error:", profileError);
    return null;
  }

  return profile as User;
}

// Save/update user profile in Supabase
export async function saveUser(user: User): Promise<void> {
  const { error } = await supabase
    .from("users")
    .upsert({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      topics: user.topics,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[saveUser] Error:", error);
    throw error;
  }
}

// Get user's following list from Supabase
export async function getFollowing(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("followers")
    .select("following_id")
    .eq("follower_id", userId);

  if (error) {
    console.error("[getFollowing] Error:", error);
    return [];
  }

  return data?.map((row) => row.following_id) || [];
}

// Toggle follow status in Supabase
export async function toggleFollow(userId: string, targetId: string): Promise<string[]> {
  // Check if already following
  const { data: existing, error: checkError } = await supabase
    .from("followers")
    .select("id")
    .eq("follower_id", userId)
    .eq("following_id", targetId)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("[toggleFollow] Check error:", checkError);
    throw checkError;
  }

  if (existing) {
    // Unfollow
    const { error: deleteError } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetId);

    if (deleteError) throw deleteError;
  } else {
    // Follow
    const { error: insertError } = await supabase
      .from("followers")
      .insert({ follower_id: userId, following_id: targetId });

    if (insertError) throw insertError;
  }

  return getFollowing(userId);
}

// Check if intro has been dismissed (stored in Supabase)
export async function isIntroDismissed(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("intro_dismissed")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[isIntroDismissed] Error:", error);
    return false;
  }

  return data?.intro_dismissed || false;
}

// Dismiss intro in Supabase
export async function dismissIntro(userId: string): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, intro_dismissed: true })
    .eq("user_id", userId);

  if (error) {
    console.error("[dismissIntro] Error:", error);
    throw error;
  }
}

// Get theme from Supabase
export async function getTheme(userId: string): Promise<"light" | "dark"> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("theme")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[getTheme] Error:", error);
    return "light";
  }

  const theme = data?.theme;
  if (theme === "dark" || theme === "light") return theme;
  return "light";
}

// Save theme to Supabase
export async function saveTheme(userId: string, theme: "light" | "dark"): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, theme })
    .eq("user_id", userId);

  if (error) {
    console.error("[saveTheme] Error:", error);
    throw error;
  }
}
