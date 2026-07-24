import { getCategoryMeta } from "@/constants";
import type { Category } from "@/types";

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md";
}

export default function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const meta = getCategoryMeta(category);
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${textSize} font-medium tracking-wide uppercase`}
      style={{ color: meta.color }}
    >
      <span
        className={`${dotSize} rounded-full flex-shrink-0`}
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}
