import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, MessageSquare, UserPlus, CheckCheck, Reply, Loader2 } from "lucide-react";
import type { AppNotification, NotificationKind } from "@/types/notifications";
import { useNotifications } from "@/hooks/useNotifications";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const KIND_META: Record<
  NotificationKind,
  { icon: typeof ThumbsUp; label: string; color: string }
> = {
  reaction: {
    icon: ThumbsUp,
    label: "Reactions",
    color: "hsl(var(--accent))",
  },
  comment: {
    icon: MessageSquare,
    label: "Comments",
    color: "hsl(142 60% 40%)",
  },
  reply: {
    icon: Reply,
    label: "Replies",
    color: "hsl(28 90% 52%)",
  },
  follow: {
    icon: UserPlus,
    label: "New Followers",
    color: "hsl(262 60% 55%)",
  },
  new_post: {
    icon: MessageSquare,
    label: "New Posts",
    color: "hsl(28 90% 52%)",
  },
};

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
}

function NotificationItem({ notification: n, onRead }: NotificationItemProps) {
  const meta = KIND_META[n.kind];
  const Icon = meta.icon;

  const buildMessage = () => {
    const actor = (
      <span className="font-semibold text-[hsl(var(--text-primary))]">
        {n.actor.displayName}
      </span>
    );

    if (n.kind === "reaction") {
      return <>{actor} reacted to your post</>;
    }
    if (n.kind === "comment") {
      return <>{actor} commented on your post</>;
    }
    if (n.kind === "reply") {
      return <>{actor} replied to your comment</>;
    }
    if (n.kind === "follow") {
      return <>{actor} started following you</>;
    }
    return <>{actor} published a new post</>;
  };

  // Follow notifications navigate to profile, others to post
  const href = n.kind === "follow"
    ? `/profile/${n.actor.username}`
    : n.post
    ? `/post/${n.post.id}`
    : "/";

  return (
    <Link
      to={href}
      onClick={() => onRead(n.id)}
      className={`flex gap-3 px-4 py-3 hover:bg-[hsl(var(--surface))] transition-colors duration-100 relative group ${
        !n.read ? "bg-[hsl(var(--surface)/0.5)]" : ""
      }`}
    >
      {/* Unread indicator */}
      {!n.read && (
        <span
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
          style={{ backgroundColor: meta.color }}
        />
      )}

      {/* Avatar + kind icon */}
      <div className="relative flex-shrink-0 mt-0.5">
        <img
          src={n.actor.avatar}
          alt={n.actor.displayName}
          className="w-8 h-8 rounded-full object-cover border border-[hsl(var(--border))]"
        />
        <span
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border border-[hsl(var(--background))]"
          style={{ backgroundColor: meta.color }}
          aria-hidden
        >
          <Icon size={9} color="white" />
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug text-[hsl(var(--text-secondary))]">
          {buildMessage()}
        </p>
        {/* Post snippet */}
        {n.post && (
          <p className="text-[11px] text-[hsl(var(--text-muted))] mt-0.5 truncate max-w-[200px]">
            "{n.post.mainPoint}"
          </p>
        )}
        {/* Comment snippet */}
        {(n.kind === "comment" || n.kind === "reply") && n.commentSnippet && (
          <p className="text-[11px] text-[hsl(var(--text-muted))] mt-1 line-clamp-2 leading-snug border-l border-[hsl(var(--border))] pl-2 italic">
            {n.commentSnippet}
          </p>
        )}
        {/* Follow: show username */}
        {n.kind === "follow" && (
          <p className="text-[11px] text-[hsl(var(--text-muted))] mt-0.5">
            @{n.actor.username}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-[hsl(var(--text-muted))] flex-shrink-0 mt-0.5 tabular-nums">
        {timeAgo(n.createdAt)}
      </span>
    </Link>
  );
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export default function NotificationPanel({
  open,
  onClose,
  anchorRef,
}: NotificationPanelProps) {
  const { notifications, unreadCount, markAllRead, markRead } =
    useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Group notifications by kind
  const kindOrder: NotificationKind[] = ["reaction", "comment", "reply", "follow"];
  const grouped = kindOrder
    .map((kind) => ({
      kind,
      items: notifications.filter((n) => n.kind === kind),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className={`
        fixed inset-x-2 top-[60px]
        sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px]
        bg-[hsl(var(--background))] border border-[hsl(var(--border))]
        rounded-sm shadow-lg overflow-hidden
        transition-all duration-200 origin-top-right z-50
        ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
      `}
      style={{ boxShadow: "0 8px 32px hsl(0 0% 0% / 0.12)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[hsl(var(--text-primary))]">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[hsl(var(--accent))] text-[hsl(var(--accent-fg))] tabular-nums leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-[11px] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[440px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-[hsl(var(--text-muted))]">
              No notifications yet.
            </p>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">
              You'll be notified when someone reacts to your posts, comments, or follows you.
            </p>
          </div>
        ) : (
          grouped.map(({ kind, items }, gi) => {
            const meta = KIND_META[kind];
            return (
              <div key={kind}>
                <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                  <meta.icon size={10} style={{ color: meta.color }} aria-hidden />
                  <span
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>
                {items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={(id) => {
                      markRead(id);
                      onClose();
                    }}
                  />
                ))}
                {gi < grouped.length - 1 && (
                  <div className="border-b border-[hsl(var(--border-subtle))] mx-4 mt-1" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[hsl(var(--border))] px-4 py-2 flex items-center justify-center gap-1.5">
        <Loader2 size={9} className="text-[hsl(var(--text-muted))] opacity-50" />
        <p className="text-[10px] text-[hsl(var(--text-muted))]">
          Refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}
