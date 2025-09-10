// app/components/client-tasks-view/TaskTimer.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer, Play, Pause, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, TimerState } from "../client-tasks-view/client-tasks-view";

const PAUSE_REASONS = [
  { id: "rest", label: "Rest Break" },
  { id: "meal", label: "Meal Break" },
  { id: "health", label: "Health Break" },
  { id: "bathroom", label: "Bathroom Break" },
  { id: "stress", label: "Stress Relief" },
  { id: "personal", label: "Personal Emergency" },
  { id: "productivity", label: "Productivity Break" },
  { id: "others", label: "Others" },
];

export default function TaskTimer({
  task,
  timerState,
  pausedTimer, // 👈 new
  onStartTimer,
  onPauseTimer,
  onRequestComplete,
  formatTimerDisplay,
}: {
  task: Task;
  timerState: TimerState | null;
  pausedTimer: TimerState | null; // 👈 new
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

  // 👇 recognize paused snapshot even when not active
  const isPausedHere =
    !isActive && pausedTimer?.taskId === task.id && !pausedTimer?.isRunning;

  const total = (task.idealDurationMinutes ?? 0) * 60;

  const remainingSeconds = isActive
    ? timerState!.remainingSeconds
    : isPausedHere
    ? pausedTimer!.remainingSeconds
    : total;

  const progress =
    ((isActive
      ? (timerState!.totalSeconds || total) - timerState!.remainingSeconds
      : isPausedHere
      ? (pausedTimer!.totalSeconds || total) - pausedTimer!.remainingSeconds
      : 0) /
      (isActive
        ? timerState!.totalSeconds || total
        : isPausedHere
        ? pausedTimer!.totalSeconds || total
        : total)) *
    100;

  const elapsedSeconds = isActive
    ? Math.max(
        0,
        (timerState!.totalSeconds || total) - timerState!.remainingSeconds
      )
    : isPausedHere
    ? Math.max(
        0,
        (pausedTimer!.totalSeconds || total) - pausedTimer!.remainingSeconds
      )
    : 0;

  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePauseClick = () => {
    setIsPauseModalOpen(true);
  };

  const handlePauseConfirm = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/pause`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason:
            PAUSE_REASONS.find((r) => r.id === selectedReason)?.label ||
            selectedReason,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onPauseTimer(task.id);
        setIsPauseModalOpen(false);
        setSelectedReason("");
      } else {
        console.error("Failed to pause task with reason");
      }
    } catch (error) {
      console.error("Error pausing task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {isPausedHere && !isRunning && (
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            PAUSED
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
              task.status === "completed" ||
              task.status === "cancelled" ||
              // 🚫 another task running
              (timerState?.isRunning && timerState.taskId !== task.id)
            }
            title="Start timer"
          >
            <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePauseClick}
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

      <Dialog open={isPauseModalOpen} onOpenChange={setIsPauseModalOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/60 shadow-2xl">
          {/* Header */}
          <DialogHeader className="px-6 py-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-orange-900/20 dark:to-amber-900/10 border-b border-amber-100/70 dark:border-amber-900/40">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Pause Task
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-300">
              Please select a reason for pausing this task.
            </DialogDescription>
          </DialogHeader>

          {/* Body */}
          <div className="px-6 py-5">
            <div className="grid gap-4">
              <div className="grid grid-cols-12 items-center gap-3">
                <Label
                  htmlFor="pause-reason"
                  className="col-span-4 md:col-span-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Reason
                </Label>

                <div className="col-span-8 md:col-span-9">
                  <Select
                    value={selectedReason}
                    onValueChange={setSelectedReason}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="pause-reason"
                      className="w-full h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50
                           focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0"
                    >
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-lg">
                      {PAUSE_REASONS.map((reason) => (
                        <SelectItem
                          key={reason.id}
                          value={reason.id}
                          className="cursor-pointer"
                        >
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/70 dark:border-slate-800/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPauseModalOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handlePauseConfirm}
              disabled={!selectedReason || isSubmitting}
              className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-600
                   text-white shadow disabled:opacity-60"
            >
              {/* If you imported Loader2, use this block; otherwise keep just the text */}
              {isSubmitting ? (
                <>
                  {/* <Loader2 className="mr-2 h-4 w-4 animate-spin" /> */}
                  Pausing...
                </>
              ) : (
                "Pause Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
