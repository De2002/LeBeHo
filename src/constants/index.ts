import type { Category, CategoryMeta, PostType, PostTypeReactionLabels } from "@/types";

export const CATEGORIES: CategoryMeta[] = [
  { id: "technology", label: "Technology", color: "#2563EB", bgColor: "bg-blue-100 dark:bg-blue-950", borderColor: "border-blue-200 dark:border-blue-900" },
  { id: "ai", label: "AI", color: "#7C3AED", bgColor: "bg-violet-100 dark:bg-violet-950", borderColor: "border-violet-200 dark:border-violet-900" },
  { id: "science", label: "Science", color: "#16A34A", bgColor: "bg-green-100 dark:bg-green-950", borderColor: "border-green-200 dark:border-green-900" },
  { id: "business", label: "Business", color: "#EA580C", bgColor: "bg-orange-100 dark:bg-orange-950", borderColor: "border-orange-200 dark:border-orange-900" },
  { id: "culture", label: "Culture", color: "#9333EA", bgColor: "bg-purple-100 dark:bg-purple-950", borderColor: "border-purple-200 dark:border-purple-900" },
  { id: "politics", label: "Politics", color: "#DC2626", bgColor: "bg-red-100 dark:bg-red-950", borderColor: "border-red-200 dark:border-red-900" },
  { id: "gaming", label: "Gaming", color: "#CA8A04", bgColor: "bg-yellow-100 dark:bg-yellow-950", borderColor: "border-yellow-200 dark:border-yellow-900" },
  { id: "writing", label: "Writing", color: "#0891B2", bgColor: "bg-cyan-100 dark:bg-cyan-950", borderColor: "border-cyan-200 dark:border-cyan-900" },
  { id: "health", label: "Health", color: "#059669", bgColor: "bg-emerald-100 dark:bg-emerald-950", borderColor: "border-emerald-200 dark:border-emerald-900" },
  { id: "society", label: "Society", color: "#DB2777", bgColor: "bg-pink-100 dark:bg-pink-950", borderColor: "border-pink-200 dark:border-pink-900" },
];

export const getCategoryMeta = (id: Category): CategoryMeta =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

export const POST_TYPE_LABELS: Record<PostType, string> = {
  opinion: "Opinion",
  analysis: "Analysis",
  question: "Question",
  prediction: "Prediction",
  review: "Review",
  observation: "Observation",
};

export const REACTION_LABELS: Record<PostType, PostTypeReactionLabels> = {
  opinion: { positive: "Agree", negative: "Disagree" },
  analysis: { positive: "Sound", negative: "Flawed" },
  question: { positive: "Good question", negative: "Off topic" },
  prediction: { positive: "Likely", negative: "Unlikely" },
  review: { positive: "Helpful", negative: "Not helpful" },
  observation: { positive: "True", negative: "Inaccurate" },
};

export const FEED_TABS = [
  { id: "discover" as const, label: "Discover" },
  { id: "following" as const, label: "Following" },
  { id: "truth-picks" as const, label: "Truth Picks" },
];
