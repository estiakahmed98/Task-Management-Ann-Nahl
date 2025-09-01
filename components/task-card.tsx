"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "./tasks-table";
import { TaskTable as _Ignore } from "./tasks-table"; // type reuse only

type TaskCardProps = {
  task: Task;
  url?: string | null;
  timer: React.ReactNode; // pass <TaskTimer .../> from parent
  performanceBadge: React.ReactNode; // getPerformanceBadge(...)
  durationText: string; // e.g. "15m" or "-"
  onComplete: () => void;
  completeDisabled: boolean;
};

export function TaskCard({
  task,
  url,
  timer,
  performanceBadge,
  durationText,
  onComplete,
  completeDisabled,
}: TaskCardProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-900 dark:text-slate-50">
          {task.name}
        </CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
            {task.category?.name ?? "N/A"}
          </Badge>
          <Badge className="bg-slate-50 text-slate-700 border border-slate-200">
            {task.templateSiteAsset?.name ?? "N/A"}
          </Badge>
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
            {task.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Performance</span>
            {performanceBadge}
          </div>
          <div className="text-sm font-medium text-slate-800 dark:text-slate-300">
            {durationText}
          </div>
        </div>

        {/* Timer inside body — no duplicate actions in header/footer */}
        <div className="pt-1">{timer}</div>

        <div className="flex items-center justify-between pt-2">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-[70%]"
              title={url}
            >
              {url}
            </a>
          ) : (
            <span className="text-sm text-slate-400">N/A</span>
          )}

          {/* Single action group only */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
              onClick={onComplete}
              disabled={completeDisabled}
              title="Mark as Completed"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>

            {url ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  navigator.clipboard.writeText(url!);
                  toast.success("URL copied to clipboard");
                }}
                title="Copy asset URL"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
