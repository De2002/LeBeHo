import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
}

export function mapSupabaseUser(user: SupabaseUser): AuthUser {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email!,
    username: meta.username || user.email!.split("@")[0],
    displayName: meta.full_name || meta.username || user.email!.split("@")[0],
    avatar:
      meta.avatar_url ||
      meta.picture ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        meta.username || user.email!.split("@")[0]
      )}&backgroundColor=0f172a&textColor=ffffff`,
  };
}

export function authUserToAppUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    username: authUser.username,
    displayName: authUser.displayName,
    avatar: authUser.avatar,
    bio: "",
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    trustScore: 60,
    joinedAt: new Date().toISOString(),
    topics: [],
  };
}

export async function sendOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyOtpAndSetPassword(
  email: string,
  token: string,
  password: string,
  username: string
): Promise<SupabaseUser> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  });
  if (error) throw error;

  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    password,
    data: {
      username: username.trim(),
      full_name: username.trim(),
    },
  });
  if (updateError) throw updateError;

  return updateData.user!;
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<SupabaseUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
