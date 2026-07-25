import { supabase } from "@/lib/supabase";
import type { Post, PostType, Category, Source } from "@/types";

// ── DB row shape ──────────────────────────────────────────────────────────────
export interface PostRow {
  id: string;
  user_id: string;
  main_point: string;
  explanation: string | null;
  category: string;
  type: string;
  image_url: string | null;
  sources: Source[];
  reactions: { positive: number; negative: number };
  comments_count: number;
  created_at: string;
  user_profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    topics: string[] | null;
  } | null;
}

// ── Convert DB row → app Post ─────────────────────────────────────────────────
export function rowToPost(row: PostRow, userReactions?: Record<string, "positive" | "negative">, followedDiscussions?: string[]): Post {
  const profile = row.user_profiles;
  const userId = row.user_id;
  const username = profile?.username ?? userId.slice(0, 8);
  const displayName = profile?.display_name ?? username;
  const avatar = profile?.avatar_url
    ? profile.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0a0a0a&color=ffffff&size=80`;

  const posCount = (row.reactions?.positive ?? 0);
  const negCount = (row.reactions?.negative ?? 0);

  return {
    id: row.id,
    author: {
      id: userId,
      username,
      displayName,
      avatar,
      bio: profile?.bio ?? "",
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      trustScore: 70,
      joinedAt: row.created_at,
      topics: (profile?.topics ?? []) as Category[],
    },
    type: row.type as PostType,
    category: row.category as Category,
    mainPoint: row.main_point,
    explanation: row.explanation ?? "",
    image: row.image_url ?? undefined,
    sources: Array.isArray(row.sources) ? row.sources : [],
    reactions: {
      positive: {
        type: "positive",
        count: posCount,
        userReacted: userReactions?.[row.id] === "positive",
      },
      negative: {
        type: "negative",
        count: negCount,
        userReacted: userReactions?.[row.id] === "negative",
      },
    },
    commentsCount: row.comments_count ?? 0,
    comments: [],
    createdAt: row.created_at,
    isFollowingDiscussion: followedDiscussions?.includes(row.id) ?? false,
    trending: false,
    truthPick: false,
  };
}

// ── Fetch feed posts ──────────────────────────────────────────────────────────
export async function fetchPosts(opts?: {
  category?: Category | null;
  userId?: string;
  limit?: number;
}): Promise<PostRow[]> {
  let query = supabase
    .from("posts")
    .select(`
      id,
      user_id,
      main_point,
      explanation,
      category,
      type,
      image_url,
      sources,
      reactions,
      comments_count,
      created_at,
      user_profiles (
        id,
        username,
        display_name,
        avatar_url,
        bio,
        topics
      )
    `)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.category) {
    query = query.eq("category", opts.category);
  }
  if (opts?.userId) {
    query = query.eq("user_id", opts.userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as PostRow[];
}

// ── Create post ───────────────────────────────────────────────────────────────
export interface CreatePostInput {
  userId: string;
  mainPoint: string;
  explanation: string;
  category: Category;
  type: PostType;
  imageUrl?: string;
  sources: Source[];
}

export async function createPost(input: CreatePostInput): Promise<string> {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: input.userId,
      main_point: input.mainPoint,
      explanation: input.explanation,
      category: input.category,
      type: input.type,
      image_url: input.imageUrl ?? null,
      sources: input.sources,
      reactions: { positive: 0, negative: 0 },
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// ── Upload post image ─────────────────────────────────────────────────────────
export async function uploadPostImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });

  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, blob, { upsert: false, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return data.publicUrl;
}
