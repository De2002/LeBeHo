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
  // Fetch email from auth session so the NOT NULL constraint is always satisfied
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const email = authUser?.email ?? "";

  // 1. Upsert into user_profiles (include email so INSERT never violates NOT NULL)
  const { error: dbError } = await supabase.from("user_profiles").upsert(
    {
      id: userId,
      email,
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

const PROFILE_SELECT = "id, display_name, username, bio, avatar_url, topics, profession, website, twitter, linkedin, instagram, created_at";

function rowToProfileData(data: Record<string, unknown>): ProfileData & { id: string; created_at?: string } {
  return {
    id: data.id as string,
    display_name: (data.display_name as string) ?? "",
    username: (data.username as string) ?? "",
    bio: (data.bio as string) ?? "",
    avatar_url: (data.avatar_url as string) ?? "",
    topics: ((data.topics as string[]) ?? []) as Category[],
    profession: (data.profession as string) ?? "",
    website: (data.website as string) ?? "",
    twitter: (data.twitter as string) ?? "",
    linkedin: (data.linkedin as string) ?? "",
    instagram: (data.instagram as string) ?? "",
    created_at: (data.created_at as string) ?? undefined,
  };
}

/** Fetch any user's profile by username (public). Falls back to ID lookup. */
export async function fetchProfileByUsername(usernameOrId: string): Promise<(ProfileData & { id: string; created_at?: string }) | null> {
  // Try by username first
  const { data, error } = await supabase
    .from("user_profiles")
    .select(PROFILE_SELECT)
    .eq("username", usernameOrId)
    .maybeSingle();

  if (!error && data) return rowToProfileData(data as Record<string, unknown>);

  // Fall back to lookup by UUID (id)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(usernameOrId)) {
    const { data: dataById } = await supabase
      .from("user_profiles")
      .select(PROFILE_SELECT)
      .eq("id", usernameOrId)
      .maybeSingle();
    if (dataById) return rowToProfileData(dataById as Record<string, unknown>);
  }

  return null;
}

/** Upload avatar to Supabase Storage, return public URL */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  // Verify the session is active before uploading
  const { data: sessionData } = await supabase.auth.getSession();
  console.log("[uploadAvatar] session user:", sessionData?.session?.user?.id ?? "NO SESSION");
  console.log("[uploadAvatar] uploading path:", path, "type:", file.type, "size:", file.size);

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
