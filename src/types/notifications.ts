export type NotificationKind =
  | "reaction"  // someone reacted to your post
  | "comment"   // someone commented on your post
  | "reply"     // someone replied to your comment
  | "follow"    // someone followed you
  | "new_post"; // a followed author published a new post (reserved)

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  read: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  post?: {
    id: string;
    mainPoint: string;
  };
  /** reaction type — only for kind=reaction */
  reactionLabel?: string;
  /** comment snippet — only for kind=comment or reply */
  commentSnippet?: string;
}
