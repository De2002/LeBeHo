import { supabase } from "@/lib/supabase";
import type { Category } from "@/types";

export interface ProfileData {
  display_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  topics: Category[];
}

/** Fetch the current user's profile from user_profiles */
export async function fetchProfile(userId: string): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("display_name, username, bio, avatar_url, topics")
    .eq("id", userId)
    .single();

  if (error) {
    // Row might not exist yet if the trigger hadn't run
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return {
    display_name: data.display_name ?? "",
    username: data.username ?? "",
    bio: data.bio ?? "",
    avatar_url: data.avatar_url ?? "",
    topics: (data.topics ?? []) as Category[],
  };
}

/** Upsert profile row and update auth metadata */
export async function saveProfile(
  userId: string,
  updates: Partial<ProfileData>
): Promise<void> {
  // 1. Upsert into user_profiles
  const { error: dbError } = await supabase.from("user_profiles").upsert(
    {
      id: userId,
      ...updates,
    },
    { onConflict: "id" }
  );
  if (dbError) throw dbError;

  // 2. Sync to auth user metadata
  const meta: Record<string, unknown> = {};
  if (updates.display_name !== undefined) {
    meta.full_name = updates.display_name;
  }
  if (updates.username !== undefined) {
    meta.username = updates.username;
  }
  if (updates.avatar_url !== undefined) {
    meta.avatar_url = updates.avatar_url;
  }

  if (Object.keys(meta).length > 0) {
    const { error: metaError } = await supabase.auth.updateUser({ data: meta });
    if (metaError) throw metaError;
  }
}

/** Upload avatar to Supabase Storage, return public URL */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  // Fetch as blob for upload
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, blob, {
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Bust cache with a timestamp param
  return `${data.publicUrl}?t=${Date.now()}`;
}
