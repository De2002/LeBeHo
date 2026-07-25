import { supabase } from "@/lib/supabase";

export interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  user_profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CommentData {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  likesCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  replies: CommentData[];
  userLiked?: boolean;
}

const COMMENT_SELECT = `
  id, post_id, user_id, parent_id, content, likes_count, created_at,
  user_profiles!comments_user_id_fkey (id, username, display_name, avatar_url)
`;

function rowToComment(row: CommentRow, likedIds: Set<string>): CommentData {
  const p = row.user_profiles;
  const username = p?.username ?? row.user_id.slice(0, 8);
  const displayName = p?.display_name ?? username;
  const avatar =
    p?.avatar_url ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0a0a0a&color=ffffff&size=80`;

  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    parentId: row.parent_id,
    content: row.content,
    likesCount: row.likes_count,
    createdAt: row.created_at,
    author: { id: row.user_id, username, displayName, avatar },
    replies: [],
    userLiked: likedIds.has(row.id),
  };
}

function buildTree(rows: CommentRow[], likedIds: Set<string>): CommentData[] {
  const map = new Map<string, CommentData>();
  const roots: CommentData[] = [];

  rows.forEach((row) => map.set(row.id, rowToComment(row, likedIds)));

  rows.forEach((row) => {
    const comment = map.get(row.id)!;
    if (row.parent_id && map.has(row.parent_id)) {
      map.get(row.parent_id)!.replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

export async function fetchComments(
  postId: string,
  currentUserId?: string
): Promise<CommentData[]> {
  console.log("[fetchComments] postId:", postId, "userId:", currentUserId);

  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[fetchComments] error:", error);
    throw new Error(error.message);
  }

  console.log("[fetchComments] rows:", data?.length ?? 0);

  // Fetch liked comment IDs for the current user
  let likedIds = new Set<string>();
  if (currentUserId && data && data.length > 0) {
    const { data: likes, error: likeErr } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", currentUserId);
    if (likeErr) console.error("[fetchComments] likes error:", likeErr);
    if (likes) likedIds = new Set(likes.map((l) => l.comment_id));
  }

  const rows = (data ?? []) as unknown as CommentRow[];
  return buildTree(rows, likedIds);
}

export async function addComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<CommentData> {
  console.log("[addComment] postId:", postId, "userId:", userId, "parentId:", parentId);

  // Insert the comment
  const { data: inserted, error: insertError } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
      parent_id: parentId ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[addComment] insert error:", insertError);
    throw new Error(insertError.message);
  }

  console.log("[addComment] inserted id:", inserted.id);

  // Re-fetch the comment with profile join
  const { data, error: fetchError } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("id", inserted.id)
    .single();

  if (fetchError) {
    console.error("[addComment] fetch error:", fetchError);
    throw new Error(fetchError.message);
  }

  return rowToComment(data as unknown as CommentRow, new Set());
}

export async function deleteComment(commentId: string): Promise<void> {
  console.log("[deleteComment] id:", commentId);
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) {
    console.error("[deleteComment] error:", error);
    throw new Error(error.message);
  }
}

export async function toggleCommentLike(
  commentId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  console.log("[toggleCommentLike] commentId:", commentId, "liked:", currentlyLiked);

  if (currentlyLiked) {
    // Remove like
    const { error: delErr } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);
    if (delErr) {
      console.error("[toggleCommentLike] delete error:", delErr);
      throw new Error(delErr.message);
    }

    // Decrement likes_count (floor at 0)
    const { data: row, error: readErr } = await supabase
      .from("comments")
      .select("likes_count")
      .eq("id", commentId)
      .single();
    if (readErr) throw new Error(readErr.message);

    const { error: updErr } = await supabase
      .from("comments")
      .update({ likes_count: Math.max(0, (row?.likes_count ?? 1) - 1) })
      .eq("id", commentId);
    if (updErr) throw new Error(updErr.message);
  } else {
    // Add like — use upsert to prevent duplicates
    const { error: insErr } = await supabase
      .from("comment_likes")
      .upsert({ comment_id: commentId, user_id: userId }, { onConflict: "user_id,comment_id" });
    if (insErr) {
      console.error("[toggleCommentLike] upsert error:", insErr);
      throw new Error(insErr.message);
    }

    // Increment likes_count
    const { data: row, error: readErr } = await supabase
      .from("comments")
      .select("likes_count")
      .eq("id", commentId)
      .single();
    if (readErr) throw new Error(readErr.message);

    const { error: updErr } = await supabase
      .from("comments")
      .update({ likes_count: (row?.likes_count ?? 0) + 1 })
      .eq("id", commentId);
    if (updErr) throw new Error(updErr.message);
  }
}
