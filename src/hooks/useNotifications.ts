import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { AppNotification, NotificationKind } from "@/types/notifications";

interface NotificationRow {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  post_id: string | null;
  comment_id: string | null;
  actor: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  post: {
    id: string;
    main_point: string;
  } | null;
  comment: {
    id: string;
    content: string;
  } | null;
}

function rowToNotification(row: NotificationRow): AppNotification {
  const actorRaw = row.actor;
  const displayName = actorRaw?.display_name || actorRaw?.username || "Someone";
  const username = actorRaw?.username || "user";
  const avatar = actorRaw?.avatar_url
    ? actorRaw.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0a0a0a&color=ffffff&size=80`;

  const kind: NotificationKind =
    row.type === "reaction" ? "reaction"
    : row.type === "comment" ? "comment"
    : row.type === "reply" ? "reply"
    : row.type === "follow" ? "follow"
    : "new_post";

  const n: AppNotification = {
    id: row.id,
    kind,
    read: row.read,
    createdAt: row.created_at,
    actor: {
      id: actorRaw?.id ?? "",
      username,
      displayName,
      avatar,
    },
  };

  if (row.post) {
    n.post = { id: row.post.id, mainPoint: row.post.main_point };
  }

  if (kind === "reaction") {
    // We don't store the reaction type in notifications directly, so omit label
    n.reactionLabel = undefined;
  }

  if ((kind === "comment" || kind === "reply") && row.comment) {
    // Strip HTML from comment snippet
    n.commentSnippet = row.comment.content.replace(/<[^>]*>/g, "").slice(0, 120);
  }

  return n;
}

async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      type,
      read,
      created_at,
      post_id,
      comment_id,
      actor:actor_id (
        id,
        username,
        display_name,
        avatar_url
      ),
      post:post_id (
        id,
        main_point
      ),
      comment:comment_id (
        id,
        content
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[fetchNotifications] error:", error);
    return [];
  }

  return (data ?? []).map((row) => rowToNotification(row as unknown as NotificationRow));
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const items = await fetchNotifications(user.id);
    setNotifications(items);
  }, [user?.id]);

  // Load on mount and poll every 30s
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.id, load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback(
    async (id: string) => {
      // Optimistic
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
    },
    []
  );

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    // Optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);
  }, [user?.id, notifications]);

  return { notifications, unreadCount, markAllRead, markRead, reload: load };
}
