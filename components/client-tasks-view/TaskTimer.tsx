// app/components/client-tasks-view/TaskTimer.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Timer, Play, Pause, CheckCircle } from "lucide-react";
import type { Task, TimerState } from "../client-tasks-view/client-tasks-view";

export default function TaskTimer({
  task,
  timerState,
  onStartTimer,
  onPauseTimer,
  onRequestComplete,
  formatTimerDisplay,
}: {
  task: Task;
  timerState: TimerState | null;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onRequestComplete: (task: Task) => void;
  formatTimerDisplay: (seconds: number) => string;
}) {
  if (!task.idealDurationMinutes) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
        <Timer className="h-3 w-3" />
        No timer set
      </div>
    );
  }

  const isActive = timerState?.taskId === task.id;
  const isRunning = isActive && timerState?.isRunning;

  const remainingSeconds = isActive
    ? timerState.remainingSeconds
    : task.idealDurationMinutes * 60;

  const progress = isActive
    ? ((timerState.totalSeconds - timerState.remainingSeconds) /
        timerState.totalSeconds) *
      100
    : 0;

  const elapsedSeconds = isActive
    ? Math.max(0, timerState.totalSeconds - timerState.remainingSeconds)
    : 0;

  const isOvertime = remainingSeconds <= 0;
  const displayTime = Math.abs(remainingSeconds);

  const isCompleted =
    task.status === "completed" || task.status === "qc_approved";

  const getActualColor = () => {
    if (!task.idealDurationMinutes || task.actualDurationMinutes == null)
      return "";
    const actual = task.actualDurationMinutes;
    const ideal = task.idealDurationMinutes;
    if (actual <= ideal * 0.67) return "text-teal-700 dark:text-emerald-400";
    if (actual <= ideal) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex flex-col items-center space-y-2">
        <div
          className={`text-sm font-mono font-bold px-2 py-1 rounded-md ${
            isOvertime
              ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
              : isRunning
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
              : "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800"
          }`}
        >
          {isOvertime && "+"}
          {formatTimerDisplay(displayTime)}
        </div>

        {isActive && (
          <>
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isOvertime
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : "bg-gradient-to-r from-blue-500 to-blue-600"
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="text-[13px] font-semibold text-teal-600 dark:text-gray-400 mt-1">
              Elapsed: {formatTimerDisplay(elapsedSeconds)}
            </div>
          </>
        )}

        {isCompleted && typeof task.actualDurationMinutes === "number" && (
          <div className={`text-[13px] font-medium mt-1 ${getActualColor()}`}>
            Duration: {task.actualDurationMinutes} min
          </div>
        )}
      </div>

      <div className="flex space-x-1">
        {!isRunning ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStartTimer(task.id)}
            className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
            disabled={
              task.status === "completed" || task.status === "cancelled"
            }
            title="Start timer"
          >
            <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPauseTimer(task.id)}
            className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/30"
            title="Pause timer"
          >
            <Pause className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </Button>
        )}

        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRequestComplete(task)}
            className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
            title="Complete task"
          >
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </Button>
        )}
      </div>
    </div>
  );
}
