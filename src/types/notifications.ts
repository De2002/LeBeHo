export type NotificationKind =
  | "reaction"   // someone reacted to your post
  | "comment"    // someone commented on a discussion you follow
  | "new_post";  // a followed author published a new post

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
  post: {
    id: string;
    mainPoint: string;
  };
  /** reaction label e.g. "Agreed" — only for kind=reaction */
  reactionLabel?: string;
  /** comment snippet — only for kind=comment */
  commentSnippet?: string;
}
