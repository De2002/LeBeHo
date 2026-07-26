import { useState, useCallback } from "react";
import type { AppNotification } from "@/types/notifications";

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    kind: "reaction",
    read: false,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    actor: {
      id: "u2",
      username: "naomi_k",
      displayName: "Naomi Kessler",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=80&h=80&fit=crop&crop=faces",
    },
    post: {
      id: "p1",
      mainPoint: "AI won't replace developers. It will replace repetitive work.",
    },
    reactionLabel: "Agreed",
  },
  {
    id: "n2",
    kind: "reaction",
    read: false,
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    actor: {
      id: "u5",
      username: "marcus_thinks",
      displayName: "Marcus Bell",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces",
    },
    post: {
      id: "p1",
      mainPoint: "AI won't replace developers. It will replace repetitive work.",
    },
    reactionLabel: "Disagreed",
  },
  {
    id: "n3",
    kind: "comment",
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    actor: {
      id: "u3",
      username: "carlosdev",
      displayName: "Carlos Mendoza",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
    },
    post: {
      id: "p2",
      mainPoint: "Games are becoming too focused on monetization and less focused on fun.",
    },
    commentSnippet:
      "The shift started when publishers realized engagement metrics were easier to optimize than review scores…",
  },
  {
    id: "n4",
    kind: "comment",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actor: {
      id: "u1",
      username: "sethwright",
      displayName: "Seth Wright",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces",
    },
    post: {
      id: "p2",
      mainPoint: "Games are becoming too focused on monetization and less focused on fun.",
    },
    commentSnippet:
      "Worth noting that indie games have been the counter-movement here. Look at Hades, Celeste, Stardew…",
  },
  {
    id: "n5",
    kind: "new_post",
    read: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    actor: {
      id: "u4",
      username: "dr_fiona_ash",
      displayName: "Dr. Fiona Ash",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
    },
    post: {
      id: "p4",
      mainPoint:
        "We will see the first commercially viable carbon capture operation at industrial scale before 2030.",
    },
  },
  {
    id: "n6",
    kind: "new_post",
    read: true,
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    actor: {
      id: "u2",
      username: "naomi_k",
      displayName: "Naomi Kessler",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=80&h=80&fit=crop&crop=faces",
    },
    post: {
      id: "p3",
      mainPoint: "Small communities are more valuable than large audiences.",
    },
  },
];

// In-memory read IDs — no localStorage
export function useNotifications() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set<string>());

  const notifications: AppNotification[] = MOCK_NOTIFICATIONS.map((n) => ({
    ...n,
    read: readIds.has(n.id) || n.read,
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setReadIds(new Set(MOCK_NOTIFICATIONS.map((n) => n.id)));
  }, []);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  }, []);

  return { notifications, unreadCount, markAllRead, markRead };
}
