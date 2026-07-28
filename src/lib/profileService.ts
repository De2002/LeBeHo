import { supabase } from "@/lib/supabase";
import type { Category } from "@/types";

export interface ProfileData {
  display_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  topics: Category[];
  profession: string;
  website: string;
  twitter: string;
  linkedin: string;
  instagram: string;
}

/** Fetch the current user's profile from user_profiles */
export async function fetchProfile(userId: string): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("display_name, username, bio, avatar_url, topics, profession, website, twitter, linkedin, instagram")
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
    profession: data.profession ?? "",
    website: data.website ?? "",
    twitter: data.twitter ?? "",
    linkedin: data.linkedin ?? "",
    instagram: data.instagram ?? "",
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

/** Fetch any user's profile by username (public) */
export async function fetchProfileByUsername(username: string): Promise<(ProfileData & { id: string; created_at?: string }) | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, display_name, username, bio, avatar_url, topics, profession, website, twitter, linkedin, instagram, created_at")
    .eq("username", username)
    .single();

  if (error) return null;

  return {
    id: data.id,
    display_name: data.display_name ?? "",
    username: data.username ?? "",
    bio: data.bio ?? "",
    avatar_url: data.avatar_url ?? "",
    topics: (data.topics ?? []) as Category[],
    profession: data.profession ?? "",
    website: data.website ?? "",
    twitter: data.twitter ?? "",
    linkedin: data.linkedin ?? "",
    instagram: data.instagram ?? "",
    created_at: data.created_at ?? undefined,
  };
}

/** Upload avatar to Supabase Storage, return public URL */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  console.log("[uploadAvatar] uploading:", path, file.type, file.size);

  // Pass File directly — avoids arrayBuffer memory issues on mobile
  const { data: uploadData, error } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    console.error("[uploadAvatar] storage error:", error);
    throw new Error(error.message);
  }

  console.log("[uploadAvatar] success:", uploadData?.path);
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Bust cache with a timestamp param
  return `${data.publicUrl}?t=${Date.now()}`;
}
