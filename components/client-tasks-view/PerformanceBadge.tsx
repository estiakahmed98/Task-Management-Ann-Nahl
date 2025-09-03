// components/PerformanceBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";

export type PerformanceRating =
  | "Excellent"
  | "Good"
  | "Average"
  | "Poor"
  | "Lazy";

const tone: Record<PerformanceRating, string> = {
  Excellent:
    "border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-900/20",
  Good: "border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-900/20",
  Average:
    "border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-900/20",
  Poor: "border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:bg-rose-900/20",
  Lazy: "border-slate-300 text-slate-700 bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-800/30",
};

const dot: Record<PerformanceRating, string> = {
  Excellent: "bg-emerald-500",
  Good: "bg-green-500",
  Average: "bg-amber-500",
  Poor: "bg-rose-500",
  Lazy: "bg-slate-400",
};

export function PerformanceBadge({
  rating,
  size = "sm",
  className = "",
}: {
  rating?: PerformanceRating | null;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  if (!rating) return null;

  const sizeCls =
    size === "xs"
      ? "px-2 py-0.5 text-[10px]"
      : size === "md"
      ? "px-3 py-1 text-sm"
      : "px-2.5 py-0.5 text-xs";

  const dotSize = size === "md" ? "h-2 w-2" : "h-1.5 w-1.5";

  return (
    <Badge
      variant="outline"
      className={[
        "inline-flex items-center gap-1.5 rounded-full border-2 font-semibold",
        sizeCls,
        tone[rating],
        className,
      ].join(" ")}
      title={`Performance: ${rating}`}
      aria-label={`Performance: ${rating}`}
    >
      <span className={`rounded-full ${dot[rating]} ${dotSize}`} />
      {rating}
    </Badge>
  );
}
