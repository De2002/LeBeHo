import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { AppNotification } from "@/types/notifications";

async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      id,
      kind,
      read,
      created_at,
      actor:actor_id(id, username, display_name, avatar),
      post:post_id(id, main_point),
      reaction_label,
      comment_snippet
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchNotifications] Error:", error);
    return [];
  }

  return (
    data?.map((n) => ({
      id: n.id,
      kind: n.kind as "reaction" | "comment" | "new_post",
      read: n.read,
      createdAt: n.created_at,
      actor: n.actor,
      post: n.post,
      reactionLabel: n.reaction_label,
      commentSnippet: n.comment_snippet,
    })) || []
  );
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      setLoading(true);
      const notifs = await fetchNotifications(user.id);
      setNotifications(notifs);
      setLoading(false);
    };

    loadNotifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id);

    if (error) {
      console.error("[markAllRead] Error:", error);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user?.id]);

  const markRead = useCallback(
    async (id: string) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("[markRead] Error:", error);
        return;
      }

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [user?.id]
  );

  return { notifications, unreadCount, markAllRead, markRead, loading };
}
