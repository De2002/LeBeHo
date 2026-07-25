import { supabase } from "@/lib/supabase";

export type ReactionType = "positive" | "negative";

/**
 * Fetch the current user's reactions for a list of post IDs.
 * Returns a map of postId → reactionType.
 */
export async function fetchUserReactions(
  userId: string,
  postIds: string[]
): Promise<Record<string, ReactionType>> {
  if (!userId || postIds.length === 0) return {};

  const { data, error } = await supabase
    .from("post_reactions")
    .select("post_id, type")
    .eq("user_id", userId)
    .in("post_id", postIds);

  if (error) {
    console.error("[fetchUserReactions] error:", error);
    return {};
  }

  const map: Record<string, ReactionType> = {};
  for (const row of data ?? []) {
    map[row.post_id] = row.type as ReactionType;
  }
  return map;
}

/**
 * Toggle a reaction for the current user on a post.
 * - If user hasn't reacted → insert the new reaction.
 * - If user reacted with the same type → delete (un-react).
 * - If user reacted with a different type → update to the new type.
 *
 * Returns the resulting reaction state (null = un-reacted).
 */
export async function toggleReaction(
  userId: string,
  postId: string,
  newType: ReactionType,
  currentType: ReactionType | null
): Promise<ReactionType | null> {
  console.log("[toggleReaction] userId:", userId, "postId:", postId, "new:", newType, "current:", currentType);

  if (currentType === newType) {
    // Un-react
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);
    if (error) {
      console.error("[toggleReaction] delete error:", error);
      throw new Error(error.message);
    }
    return null;
  }

  // Upsert — insert or switch type
  const { error } = await supabase
    .from("post_reactions")
    .upsert(
      { user_id: userId, post_id: postId, type: newType },
      { onConflict: "user_id,post_id" }
    );
  if (error) {
    console.error("[toggleReaction] upsert error:", error);
    throw new Error(error.message);
  }
  return newType;
}
