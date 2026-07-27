export type Category =
  | "technology"
  | "science"
  | "business"
  | "culture"
  | "politics"
  | "gaming"
  | "writing"
  | "ai"
  | "health"
  | "society";

export type PostType =
  | "opinion"
  | "analysis"
  | "question"
  | "prediction"
  | "review"
  | "observation";

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  profession?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  trustScore: number;
  joinedAt: string;
  topics: Category[];
  isFollowing?: boolean;
}

export interface Source {
  id: string;
  title: string;
  url: string;
  type: "article" | "research" | "video" | "report" | "website";
  favicon?: string;
}

export interface Reaction {
  type: "positive" | "negative";
  count: number;
  userReacted?: boolean;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  likesCount: number;
  userLiked?: boolean;
  sourcesCount?: number;
}

export interface Post {
  id: string;
  author: User;
  type: PostType;
  category: Category;
  mainPoint: string;
  explanation: string;
  image?: string;
  sources: Source[];
  moreLink?: string;
  moreLinkLabel?: string;
  reactions: {
    positive: Reaction;
    negative: Reaction;
  };
  commentsCount: number;
  comments?: Comment[];
  createdAt: string;
  isFollowingDiscussion?: boolean;
  trending?: boolean;
  truthPick?: boolean;
}

export interface FeedTab {
  id: "discover" | "following" | "truth-picks";
  label: string;
}

export interface CategoryMeta {
  id: Category;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface PostTypeReactionLabels {
  positive: string;
  negative: string;
}
