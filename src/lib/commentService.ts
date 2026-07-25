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

export async function fetchComments(postId: string, currentUserId?: string): Promise<CommentData[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id, post_id, user_id, parent_id, content, likes_count, created_at,
      user_profiles (id, username, display_name, avatar_url)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Fetch which ones the current user liked
  let likedIds = new Set<string>();
  if (currentUserId) {
    const { data: likes } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", currentUserId);
    if (likes) likedIds = new Set(likes.map((l) => l.comment_id));
  }

  const rows = (data ?? []) as unknown as CommentRow[];
  const commentMap = new Map<string, CommentData>();
  const roots: CommentData[] = [];

  // Build flat map
  rows.forEach((row) => {
    commentMap.set(row.id, rowToComment(row, likedIds));
  });

  // Nest replies
  rows.forEach((row) => {
    const comment = commentMap.get(row.id)!;
    if (row.parent_id && commentMap.has(row.parent_id)) {
      commentMap.get(row.parent_id)!.replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

export async function addComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<CommentRow> {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
      parent_id: parentId ?? null,
    })
    .select(`id, post_id, user_id, parent_id, content, likes_count, created_at,
      user_profiles (id, username, display_name, avatar_url)`)
    .single();

  if (error) throw error;
  return data as unknown as CommentRow;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function toggleCommentLike(
  commentId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<number> {
  if (currentlyLiked) {
    await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);

    const { data } = await supabase
      .from("comments")
      .update({ likes_count: supabase.rpc ? undefined : undefined })
      .eq("id", commentId)
      .select("likes_count")
      .single();

    // Decrement manually
    const { data: current } = await supabase
      .from("comments")
      .select("likes_count")
      .eq("id", commentId)
      .single();

    const newCount = Math.max(0, (current?.likes_count ?? 1) - 1);
    await supabase.from("comments").update({ likes_count: newCount }).eq("id", commentId);
    return newCount;
  } else {
    await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });

    const { data: current } = await supabase
      .from("comments")
      .select("likes_count")
      .eq("id", commentId)
      .single();

    const newCount = (current?.likes_count ?? 0) + 1;
    await supabase.from("comments").update({ likes_count: newCount }).eq("id", commentId);
    return newCount;
  }
}
