import { supabase } from "@/lib/supabase";

/** Check if the current user follows a given user */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

/** Toggle follow/unfollow. Returns the new state (true = now following). */
export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  const already = await isFollowing(followerId, followingId);
  if (already) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) throw new Error(error.message);
    return false;
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: followerId, following_id: followingId });
    if (error) throw new Error(error.message);
    return true;
  }
}

/** Get follower count for a user */
export async function getFollowerCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);
  if (error) return 0;
  return count ?? 0;
}

/** Get following count for a user */
export async function getFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);
  if (error) return 0;
  return count ?? 0;
}
