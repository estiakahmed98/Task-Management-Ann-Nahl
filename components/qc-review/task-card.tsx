"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  User,
  Clock,
  ExternalLink,
  CheckCircle,
  RotateCcw,
  Star,
} from "lucide-react";
import { QCScores } from "@/app/qc/tasks/QCReview";

interface TaskCardProps {
  task: any; // your TaskRow type is complex; keep as any for now
  approvedMap: Record<string, boolean>;
  onApprove: (task: any) => void;
  onReject: (task: any) => void;

  // ⭐ New controlled scores from parent (per-task)
  scores: QCScores;
  onChangeScores: (next: QCScores) => void;
}

/* =========================
   Small helpers / UI
========================= */

const priorityConfig = {
  low: {
    color:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700",
    icon: "🟢",
  },
  medium: {
    color:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
    icon: "🔵",
  },
  high: {
    color:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700",
    icon: "🟡",
  },
  urgent: {
    color:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
    icon: "🔴",
  },
} as const;

const performanceGradients = {
  Excellent: "from-emerald-400 via-green-500 to-teal-600",
  Good: "from-blue-400 via-indigo-500 to-purple-600",
  Average: "from-amber-400 via-orange-500 to-red-500",
  Lazy: "from-red-400 via-pink-500 to-rose-600",
} as const;

const performanceConfig = {
  Excellent: {
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300",
    icon: "🏆",
    score: 100,
  },
  Good: {
    color:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300",
    icon: "⭐",
    score: 80,
  },
  Average: {
    color:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300",
    icon: "🎯",
    score: 60,
  },
  Lazy: {
    color:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300",
    icon: "⚠️",
    score: 30,
  },
} as const;

const getDurationEfficiency = (ideal: number | null, actual: number | null) => {
  if (!ideal || !actual) return { percentage: 0, status: "N/A" };
  const efficiency = (ideal / actual) * 100;
  const roundedEfficiency = Math.min(efficiency, 150);

  let status = "Efficient";
  if (roundedEfficiency < 70) {
    status = "Inefficient";
  } else if (roundedEfficiency < 90) {
    status = "Acceptable";
  }

  return {
    percentage: Math.round(roundedEfficiency),
    status,
  };
};

const priorityBadge = (p: string) => {
  const config = priorityConfig[p as keyof typeof priorityConfig];
  return (
    <Badge variant="outline" className={`${config.color} font-medium`}>
      <span className="mr-1">{config.icon}</span>
      {p.charAt(0).toUpperCase() + p.slice(1)}
    </Badge>
  );
};

/* =========================
   StarRating (local copy)
========================= */

function StarRating({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between bg-slate-50/50 border border-slate-100 rounded-md px-2 py-1 hover:bg-slate-50 transition-colors">
      <label
        htmlFor={id}
        className="text-xs font-medium text-slate-600 select-none truncate"
      >
        {label}
      </label>
      <div
        id={id}
        className="flex items-center gap-0.5 ml-2"
        role="radiogroup"
        aria-label={label}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const active = i <= value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i === value ? i - 1 : i)}
              className="p-0.5 outline-none focus:ring-1 focus:ring-amber-400 rounded transition-all duration-100 hover:scale-105"
              role="radio"
              aria-checked={active}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-3 w-3 transition-colors ${
                  active
                    ? "text-amber-400"
                    : "text-slate-300 hover:text-amber-300"
                }`}
                fill={active ? "currentColor" : "none"}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   Component
========================= */

export function TaskCard({
  task,
  approvedMap,
  onApprove,
  onReject,
  scores,
  onChangeScores,
}: TaskCardProps) {
  const efficiency = getDurationEfficiency(
    task.idealDurationMinutes,
    task.actualDurationMinutes
  );
  const isApproved = approvedMap[task.id];
  const cardGradient =
    performanceGradients[
      task.performanceRating as keyof typeof performanceGradients
    ] || "from-slate-400 via-slate-500 to-slate-600";

  const manualTotal = useMemo(
    () =>
      scores.keyword +
      scores.contentQuality +
      scores.image +
      scores.seo +
      scores.grammar +
      scores.humanization,
    [scores]
  );

  const setScore = (k: keyof QCScores, v: number) =>
    onChangeScores({ ...scores, [k]: Math.max(0, Math.min(5, v)) });

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.005] bg-white dark:bg-slate-900 border-0 shadow-md group">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cardGradient}`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-br ${cardGradient} opacity-2 group-hover:opacity-4 transition-opacity duration-300`}
      />

      <CardContent className="relative p-5">
        <div className="flex flex-col xl:flex-row xl:items-start gap-5">
          <div className="flex-1">
            {/* ===== Header row ===== */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
              {/* Left: title + badges */}
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  {task.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {priorityBadge(task.priority)}
                  {task.category && (
                    <Badge
                      variant="outline"
                      className={`text-xs border bg-gradient-to-r ${cardGradient} text-white border-transparent font-medium px-2 py-1 shadow-sm`}
                    >
                      {task.category.name}
                    </Badge>
                  )}
                  {task.templateSiteAsset && (
                    <Badge
                      variant="outline"
                      className="text-xs border bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent font-medium px-2 py-1 shadow-sm"
                    >
                      {task.templateSiteAsset.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* ⭐ Middle: QC star ratings (minimal design) */}
              <div className="w-full bg-slate-25 rounded-lg p-2 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                  <StarRating
                    label="Keyword Optimization"
                    value={scores.keyword}
                    onChange={(v) => setScore("keyword", v)}
                    id={`qc-keyword-${task.id}`}
                  />
                  <StarRating
                    label="Content Optimization"
                    value={scores.contentQuality}
                    onChange={(v) => setScore("contentQuality", v)}
                    id={`qc-content-${task.id}`}
                  />
                  <StarRating
                    label="Image Using"
                    value={scores.image}
                    onChange={(v) => setScore("image", v)}
                    id={`qc-image-${task.id}`}
                  />
                  <StarRating
                    label="SEO"
                    value={scores.seo}
                    onChange={(v) => setScore("seo", v)}
                    id={`qc-seo-${task.id}`}
                  />
                  <StarRating
                    label="Grammar "
                    value={scores.grammar}
                    onChange={(v) => setScore("grammar", v)}
                    id={`qc-grammar-${task.id}`}
                  />
                  <StarRating
                    label="Humanization"
                    value={scores.humanization}
                    onChange={(v) => setScore("humanization", v)}
                    id={`qc-human-${task.id}`}
                  />
                </div>
                <div className="mt-1 text-right text-xs text-slate-500 font-medium">
                  QC: {manualTotal}/30
                </div>
              </div>
            </div>

            {/* ===== Body grid ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`p-1.5 bg-gradient-to-r ${cardGradient} rounded-md`}
                  >
                    <Building2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Client
                  </span>
                </div>
                {task.client ? (
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {task.client.name}
                    </div>
                    {task.client.company && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {task.client.company}
                      </div>
                    )}
                    {task.assignment?.template && (
                      <Badge
                        variant="secondary"
                        className="text-xs mt-1 bg-white dark:bg-slate-800 shadow-sm"
                      >
                        {task.assignment.template.name}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-xs">
                    Not assigned
                  </span>
                )}
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`p-1.5 bg-gradient-to-r ${cardGradient} rounded-md`}
                  >
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Agent
                  </span>
                </div>
                {task.assignedTo ? (
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {task.assignedTo.name ||
                        `${task.assignedTo.firstName ?? ""} ${
                          task.assignedTo.lastName ?? ""
                        }`.trim() ||
                        "Unnamed"}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {task.assignedTo.email}
                    </div>
                    {task.assignedTo.category && (
                      <Badge
                        variant="outline"
                        className="text-xs mt-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                      >
                        {task.assignedTo.category}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-xs">
                    Unassigned
                  </span>
                )}
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`p-1.5 bg-gradient-to-r ${cardGradient} rounded-md`}
                  >
                    <Clock className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Timeline
                  </span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Created
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {task.completedAt && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Completed
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                        {new Date(task.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                {task.completionLink && (
                  <Button
                    onClick={() => window.open(task.completionLink, "_blank")}
                    className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-600 hover:via-teal-600 hover:to-emerald-600 text-white font-bold text-xs border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 px-3 py-2"
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View Completion
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right column: efficiency + actions */}
          <div className="flex flex-col items-end justify-between gap-3">
            {/* Right: Admin Rating (system) */}
            {task.performanceRating && (
              <div className="flex gap-2">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                    Admin Rating
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                      performanceConfig[
                        task.performanceRating as keyof typeof performanceConfig
                      ]?.color
                    } flex items-center gap-2`}
                  >
                    <Star className="h-3 w-3" />
                    <span>
                      {
                        performanceConfig[
                          task.performanceRating as keyof typeof performanceConfig
                        ]?.icon
                      }
                    </span>
                    <span>{task.performanceRating}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="xl:w-72 space-y-3">
              <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-md">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center flex gap-2">
                    <div
                      className={`text-xl font-black bg-gradient-to-r ${cardGradient} bg-clip-text text-transparent`}
                    >
                      {efficiency.percentage}%
                    </div>
                    <div
                      className={`text-xs font-bold mt-1 ${
                        efficiency.status === "Efficient"
                          ? "text-green-600"
                          : efficiency.status === "Acceptable"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {efficiency.status}
                    </div>
                  </div>

                  <div
                    className={`text-xl font-black bg-gradient-to-r ${cardGradient} bg-clip-text text-transparent`}
                  >
                    {Math.round((task.actualDurationMinutes / 60) * 10) / 10}h
                    ideal
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span>Progress</span>
                    <span className="font-bold">
                      {task.completionPercentage}%
                    </span>
                  </div>
                  <div className="relative">
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${cardGradient} rounded-full transition-all duration-1000 shadow-sm`}
                        style={{ width: `${task.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onApprove(task)}
                  disabled={isApproved}
                  size="sm"
                  className={`flex-1 font-bold text-xs py-2 ${
                    isApproved
                      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 shadow-md"
                      : `bg-gradient-to-r ${cardGradient} hover:opacity-90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`
                  }`}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {isApproved ? "Approved" : "Approve"}
                </Button>

                <Button
                  onClick={() => onReject(task)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30 font-bold text-xs py-2 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reassign
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
