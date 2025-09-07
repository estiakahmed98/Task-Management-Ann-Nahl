// components/Performance.tsx
"use client";

export type Rating = "Excellent" | "Good" | "Average" | "Lazy";

export type PerformanceResult = {
  rating: Rating;
  percentAwarded: number; // 100 | 75 | 50 | 40
  score: number; // out of `total` (default 70)
  detail: string;
};

/**
 * Evaluate task performance based on ideal vs actual minutes.
 * Rules:
 *  - actual/ideal ≤ 0.90  → 100% (Excellent)
 *  - actual/ideal ≤ 0.95  → 75%  (Good)
 *  - actual/ideal ≤ 1.00  → 50%  (Average)
 *  - otherwise            → 40%  (Lazy)
 */
export function evaluatePerformance(
  ideal: number | null | undefined,
  actual: number | null | undefined,
  total = 70
): PerformanceResult | null {
  if (
    ideal == null ||
    actual == null ||
    !isFinite(ideal) ||
    !isFinite(actual) ||
    ideal <= 0 ||
    actual < 0
  ) {
    return null;
  }

  const ratio = actual / ideal;

  let percentAwarded: number;
  let rating: Rating;

  if (ratio <= 0.9) {
    percentAwarded = 100;
    rating = "Excellent";
  } else if (ratio <= 0.95) {
    percentAwarded = 75;
    rating = "Good";
  } else if (ratio <= 1.0) {
    percentAwarded = 50;
    rating = "Average";
  } else {
    percentAwarded = 40;
    rating = "Lazy";
  }

  const score = Math.round((percentAwarded / 100) * total);
  const toPct = (n: number) => `${Math.round(n * 100)}%`;

  const detail =
    ratio <= 0.9
      ? `Time used: ${toPct(ratio)} of ideal (≥10% faster).`
      : ratio <= 0.95
      ? `Time used: ${toPct(ratio)} of ideal (5–10% faster).`
      : ratio <= 1.0
      ? `Time used: ${toPct(ratio)} of ideal (on time).`
      : `Time used: ${toPct(ratio)} of ideal (over time).`;

  return { rating, percentAwarded, score, detail };
}

/* ---------- Optional UI badge ---------- */

const ratingStyles: Record<Rating, string> = {
  Excellent:
    "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  Good: "bg-green-100 text-green-700 ring-1 ring-inset ring-green-200",
  Average: "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200",
  Lazy: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
};

export function PerformanceBadge({
  ideal,
  actual,
  total = 70,
}: {
  ideal: number | null | undefined;
  actual: number | null | undefined;
  total?: number;
}) {
  const perf = evaluatePerformance(ideal, actual, total);

  if (!perf) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-xs ring-1 ring-inset ring-slate-200">
        No rating
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        ratingStyles[perf.rating]
      }`}
      title={`${perf.detail}  Score: ${perf.score}/${total} (${perf.percentAwarded}%).`}
    >
      {perf.rating}:
      <span className="font-medium opacity-80">
        {perf.score}/{total}
      </span>
    </span>
  );
}
