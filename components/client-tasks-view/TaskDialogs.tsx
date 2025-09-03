//app/components/client-tasks-view/TaskDialogs.tsx

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
import {
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  User,
  Mail,
  Lock,
} from "lucide-react";
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
  // ✅ Categories where only completion link should be shown (no credentials)
  const ASSETLESS_SET = new Set([
    "social activity",
    "blog posting",
    "graphics design",
  ]);
  const categoryName = (taskToComplete?.category?.name ?? "").toLowerCase();
  const showCredentialFields =
    !!taskToComplete && !ASSETLESS_SET.has(categoryName);

  return (
    <>
      {/* Status Update Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Update Task Status
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-1">
              You have selected{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {selectedTasks.length}
              </span>{" "}
              task
              {selectedTasks.length !== 1 ? "s" : ""}. Choose the status to
              apply to all selected tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700 dark:text-blue-300">
                This action will update all selected tasks simultaneously.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
              disabled={isUpdating}
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdateSelectedTasks("pending")}
              disabled={isUpdating}
              variant="secondary"
              className="flex-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/40 border border-amber-200 dark:border-amber-800 py-2"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 mr-1" />
              )}
              Mark as Pending
            </Button>
            <Button
              onClick={() => handleUpdateSelectedTasks("completed")}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
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
        <DialogContent className="sm:max-w-3xl p-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Complete Task
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-1">
              Mark this task as completed and provide a completion link
              {showCredentialFields ? " and credentials if needed." : "."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-3">
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Warning:</strong> Once marked as completed, you
                    won't be able to edit this task anymore.
                  </p>
                </div>
              </div>

              {taskToComplete && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Task: {taskToComplete.name}
                  </p>
                  {timerState?.taskId === taskToComplete.id && (
                    <div
                      className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        timerState.remainingSeconds <= 0
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimerDisplay(
                        Math.abs(timerState.remainingSeconds)
                      )}
                      {timerState.remainingSeconds <= 0 && " (Overtime)"}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Always show completion link */}
              <div className="space-y-1.5">
                <label
                  htmlFor="completion-link"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
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

              {/* Show credentials ONLY for categories outside Social/Blog/Graphics */}
              {showCredentialFields && (
                <div className="space-y-2 pt-1">
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Credentials
                  </h4>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
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
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="username"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
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
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
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
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Provide a link to the completed work, deliverable, or proof of
                completion.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-3">
            <Button
              variant="outline"
              onClick={handleCompletionCancel}
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTaskCompletion}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Task Completion Dialog */}
      <Dialog
        open={isBulkCompletionOpen}
        onOpenChange={setIsBulkCompletionOpen}
      >
        <DialogContent className="sm:max-w-[650px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Complete Multiple Tasks
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-1">
              Mark{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {selectedTasks.length}
              </span>{" "}
              selected tasks as completed and optionally provide a completion
              link.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Warning:</strong> Once marked as completed, you
                    won't be able to edit these tasks anymore.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Selected Tasks: {selectedTasks.length}
                </p>
                <div className="mt-1 max-h-40 overflow-y-auto space-y-0.5">
                  {selectedTasks.map((taskId) => {
                    const task = tasks.find((t) => t.id === taskId);
                    return task ? (
                      <p
                        key={taskId}
                        className="text-xs text-gray-600 dark:text-gray-300 pl-2 border-l border-blue-300 dark:border-blue-700"
                      >
                        • {task.name}
                      </p>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="bulk-completion-link"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
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
                  This link will be applied to all selected tasks. Provide a
                  link to the completed work or deliverable.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-3">
            <Button
              variant="outline"
              onClick={handleBulkCompletionCancel}
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkCompletion}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              Complete {selectedTasks.length} Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
