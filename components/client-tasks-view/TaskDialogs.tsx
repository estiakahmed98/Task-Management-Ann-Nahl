//app/components/client-tasks-view/TaskDialogs.tsx

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import type { Task, TimerState } from "../client-tasks-view/client-tasks-view";

export default function TaskDialogs({
  isStatusModalOpen,
  setIsStatusModalOpen,
  selectedTasks,
  isUpdating,
  handleUpdateSelectedTasks,
  isCompletionConfirmOpen,
  setIsCompletionConfirmOpen,
  taskToComplete,
  completionLink,
  setCompletionLink,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  timerState,
  handleTaskCompletion,
  handleCompletionCancel,
  formatTimerDisplay,
}: {
  isStatusModalOpen: boolean;
  setIsStatusModalOpen: (b: boolean) => void;
  selectedTasks: string[];
  isUpdating: boolean;
  handleUpdateSelectedTasks: (
    action: "completed" | "pending" | "reassigned",
    completionLink?: string
  ) => void;
  isCompletionConfirmOpen: boolean;
  setIsCompletionConfirmOpen: (b: boolean) => void;
  taskToComplete: Task | null;
  setTaskToComplete: (t: Task | null) => void;
  completionLink: string;
  setCompletionLink: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  timerState: TimerState | null;
  handleTaskCompletion: () => void;
  handleCompletionCancel: () => void;
  isBulkCompletionOpen: boolean;
  setIsBulkCompletionOpen: (b: boolean) => void;
  bulkCompletionLink: string;
  setBulkCompletionLink: (v: string) => void;
  handleBulkCompletion: () => void;
  handleBulkCompletionCancel: () => void;
  tasks: Task[];
  formatTimerDisplay: (seconds: number) => string;
}) {
  // ✅ Categories where only completion link should be shown (no credentials)
  const ASSETLESS_SET = new Set([
    "social activity",
    "blog posting",
    "graphics design",
  ]);
  const categoryName = (taskToComplete?.category?.name ?? "").toLowerCase();
  const showCredentialFields =
    !!taskToComplete && !ASSETLESS_SET.has(categoryName);

  // extra confirm dialog if actual < 70% of ideal
  const [isShortDurationConfirmOpen, setIsShortDurationConfirmOpen] =
    useState(false);
  const [shortDurationInfo, setShortDurationInfo] = useState<{
    actual: number;
    ideal: number;
  } | null>(null);

  /**
   * Predict actual duration in minutes for the pending submission:
   * - If the timer is for this task, compute from (total - remaining)
   * - Else fallback to taskToComplete.actualDurationMinutes (if any)
   */
  const predictActualMinutes = (): number | null => {
    if (!taskToComplete) return null;
    // prefer live timer measurement when this task is active
    if (
      timerState?.taskId === taskToComplete.id &&
      typeof taskToComplete.idealDurationMinutes === "number"
    ) {
      const totalUsedSeconds =
        timerState.totalSeconds - timerState.remainingSeconds;
      if (totalUsedSeconds <= 0) return 0;
      const mins = Math.ceil(totalUsedSeconds / 60);
      return Math.max(mins, 1);
    }
    // fallback to whatever is already stored on the task (if any)
    return typeof taskToComplete.actualDurationMinutes === "number"
      ? taskToComplete.actualDurationMinutes
      : null;
  };

  // URL validation UI state
  const [linkTouched, setLinkTouched] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [verifyingUrl, setVerifyingUrl] = useState(false);

  // Basic format validation on the client
  const validateUrlFormat = (value: string): string | null => {
    const v = (value || "").trim();
    if (!v) return "Completion link is required.";
    try {
      const u = new URL(v);
      if (!/^https?:$/.test(u.protocol))
        return "URL must start with http:// or https://";
      const host = u.hostname.toLowerCase();
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
        return "Local/loopback URLs are not allowed.";
      }
      return null;
    } catch {
      return "Enter a valid URL (e.g., https://example.com)";
    }
  };

  // Server reachability check
  const checkLinkReachability = async (value: string) => {
    const v = (value || "").trim();
    if (!v) return "Completion link is required.";
    setVerifyingUrl(true);
    try {
      const res = await fetch(
        `/api/utils/validate-url?url=${encodeURIComponent(v)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );
      const data = await res.json().catch(() => ({}));
      setVerifyingUrl(false);
      return res.ok ? null : data?.reason || "URL is not reachable.";
    } catch {
      setVerifyingUrl(false);
      return "URL is not reachable (network error).";
    }
  };

  return (
    <>
      {/* Status Update Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-50">
              Update Task Status
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              You have selected {selectedTasks.length} task
              {selectedTasks.length !== 1 ? "s" : ""}. Choose the status to
              apply to all selected tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isUpdating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdateSelectedTasks("pending")}
              disabled={isUpdating}
              variant="secondary"
              className="flex-1"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              Mark as Pending
            </Button>
            <Button
              onClick={() => handleUpdateSelectedTasks("completed")}
              disabled={isUpdating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Completion Confirmation Modal */}
      <Dialog
        open={isCompletionConfirmOpen}
        onOpenChange={setIsCompletionConfirmOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-50">
              Complete Task
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Mark this task as completed and provide a completion link
              {showCredentialFields ? " and credentials if needed." : "."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> Once marked as completed, you won't be
                able to edit this task anymore.
              </p>
            </div>

            {taskToComplete && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                  Task: {taskToComplete.name}
                </p>
                {timerState?.taskId === taskToComplete.id && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Current timer:{" "}
                    {formatTimerDisplay(Math.abs(timerState.remainingSeconds))}
                    {timerState.remainingSeconds <= 0 && " (Overtime)"}
                  </p>
                )}
              </div>
            )}

            {/* Always show completion link */}
            <div className="space-y-2">
              <label
                htmlFor="completion-link"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Completion Link
              </label>
              <Input
                id="completion-link"
                type="url"
                placeholder="https://example.com/completed-work"
                value={completionLink}
                onChange={(e) => {
                  setCompletionLink(e.target.value);
                  if (linkTouched) {
                    // live format validation
                    setLinkError(validateUrlFormat(e.target.value));
                  }
                }}
                onBlur={async () => {
                  setLinkTouched(true);
                  const formatErr = validateUrlFormat(completionLink);
                  setLinkError(formatErr);
                  if (!formatErr) {
                    const reachErr = await checkLinkReachability(
                      completionLink
                    );
                    setLinkError(reachErr);
                  }
                }}
                aria-invalid={!!linkError}
                className={`w-full ${
                  linkError ? "border-red-400 focus-visible:ring-red-400" : ""
                }`}
              />
              {verifyingUrl && !linkError && (
                <div className="text-xs text-gray-500">Verifying link…</div>
              )}
              {linkError && (
                <div className="text-xs text-red-600">{linkError}</div>
              )}
            </div>

            {/* Show credentials ONLY for categories outside Social/Blog/Graphics */}
            {showCredentialFields && (
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />

                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full"
                />

                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="text"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Provide a link to the completed work, deliverable, or proof of
              completion.
            </p>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCompletionCancel}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>

            <Button
              onClick={async () => {
                // Format check
                const formatErr = validateUrlFormat(completionLink);
                if (formatErr) {
                  setLinkTouched(true);
                  setLinkError(formatErr);
                  return;
                }
                // Reachability check
                const reachErr = await checkLinkReachability(completionLink);
                if (reachErr) {
                  setLinkTouched(true);
                  setLinkError(reachErr);
                  return;
                }
                if (!taskToComplete) {
                  handleTaskCompletion();
                  return;
                }
                const ideal = taskToComplete.idealDurationMinutes;
                const actual = predictActualMinutes();
                if (
                  typeof ideal === "number" &&
                  typeof actual === "number" &&
                  actual < ideal * 0.7
                ) {
                  // ✅ Close the background completion modal
                  setIsCompletionConfirmOpen(false);
                  // Open short-duration confirmation
                  setShortDurationInfo({ actual, ideal });
                  setIsShortDurationConfirmOpen(true);
                } else {
                  handleTaskCompletion();
                }
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={verifyingUrl}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Short-duration confirmation (actual < 70% of ideal) */}

      {/* Short-duration confirmation (actual < 70% of ideal) */}
      <Dialog
        open={isShortDurationConfirmOpen}
        onOpenChange={setIsShortDurationConfirmOpen}
      >
        <DialogContent className="sm:max-w-[520px] rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-b from-white to-amber-50 dark:from-gray-900 dark:to-amber-950/20">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-xl p-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Confirm Early Completion
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                  Your tracked time appears significantly lower than expected
                  for this task. Do you still want to submit it as completed?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Metrics summary */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-amber-900/10 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Ideal</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {shortDurationInfo?.ideal ?? "--"} min
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-white/70 dark:bg-amber-900/10 p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                70% Threshold
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {shortDurationInfo
                  ? Math.ceil(shortDurationInfo.ideal * 0.7)
                  : "--"}{" "}
                min
              </p>
            </div>
            <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Your Actual
              </p>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {shortDurationInfo?.actual ?? "--"} min
              </p>
            </div>
          </div>

          {/* Context copy */}
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {shortDurationInfo
              ? `Actual ${
                  shortDurationInfo.actual
                } min is less than 70% of ideal (${Math.ceil(
                  shortDurationInfo.ideal * 0.7
                )} of ${shortDurationInfo.ideal} min).`
              : "Actual time appears significantly lower than expected."}
          </div>

          <DialogFooter className="mt-5 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                // Close this confirm and re-open the completion modal for review
                setIsShortDurationConfirmOpen(false);
                setTimeout(() => {
                  setIsCompletionConfirmOpen(true);
                }, 50);
              }}
            >
              Review
            </Button>
            <Button
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setIsShortDurationConfirmOpen(false);
                // proceed with the real completion (parent computes & sends actualDurationMinutes)
                handleTaskCompletion();
              }}
            >
              Yes, Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
