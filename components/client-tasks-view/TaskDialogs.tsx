"use client";

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
import { Loader2, Clock, CheckCircle } from "lucide-react";
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
  setTaskToComplete,
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
  isBulkCompletionOpen,
  setIsBulkCompletionOpen,
  bulkCompletionLink,
  setBulkCompletionLink,
  handleBulkCompletion,
  handleBulkCompletionCancel,
  tasks,
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
  // ✅ Check if the current task is a Social Activity
  const isSocialActivity =
    (taskToComplete?.category?.name ?? "").toLowerCase() === "social activity";

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
              Mark this task as completed and {isSocialActivity ? "" : "optionally "}
              provide a completion link{isSocialActivity ? "." : " and credentials if needed."}
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
                onChange={(e) => setCompletionLink(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Show credentials ONLY when NOT Social Activity */}
            {!isSocialActivity && (
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
              onClick={handleTaskCompletion}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Task Completion Dialog (already only asks for a link) */}
      <Dialog
        open={isBulkCompletionOpen}
        onOpenChange={setIsBulkCompletionOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-50">
              Complete Multiple Tasks
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Mark {selectedTasks.length} selected tasks as completed and
              optionally provide a completion link.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> Once marked as completed, you won't be
                able to edit these tasks anymore.
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                Selected Tasks: {selectedTasks.length}
              </p>
              <div className="mt-2 max-h-32 overflow-y-auto">
                {selectedTasks.map((taskId) => {
                  const task = tasks.find((t) => t.id === taskId);
                  return task ? (
                    <p
                      key={taskId}
                      className="text-xs text-gray-600 dark:text-gray-400"
                    >
                      • {task.name}
                    </p>
                  ) : null;
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="bulk-completion-link"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Completion Link (Optional)
              </label>
              <Input
                id="bulk-completion-link"
                type="url"
                placeholder="https://example.com/completed-work"
                value={bulkCompletionLink}
                onChange={(e) => setBulkCompletionLink(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This link will be applied to all selected tasks. Provide a link
                to the completed work or deliverable.
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBulkCompletionCancel}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkCompletion}
              disabled={isUpdating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Complete {selectedTasks.length} Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
