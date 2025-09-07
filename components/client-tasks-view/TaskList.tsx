"use client";

import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  List,
  Grid3X3,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TaskTimer from "./TaskTimer";
import ReassignNoteModal from "./ReassignNoteModal";
import type { TimerState } from "../client-tasks-view/client-tasks-view";

// Import the base Task type and extend it with additional properties
import type { Task as BaseTask } from "./client-tasks-view";

type Task = BaseTask & {
  // Additional properties specific to TaskList
  reassignNotes?: string;
  username?: string;
  password?: string;
  email?: string;
  // Add any other additional properties needed by TaskList
  timerState?: any;
  assetUrl?: string;
  url?: string;
  actualDurationMinutes?: number; // ✅ NEW
};
import { PerformanceBadge } from "./PerformanceBadge";

export default function TaskList({
  agentId, // ✅ NEW
  clientName,
  tasks,
  filteredTasks,
  selectedTasks = [],
  setSelectedTasks,
  overdueCount,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  timerState,
  handleStartTimer,
  handlePauseTimer,
  handleResetTimer,
  isTaskDisabled,
  viewMode,
  setViewMode,
  onOpenStatusModal,
  taskToComplete,
  setTaskToComplete,
  isCompletionConfirmOpen,
  setIsCompletionConfirmOpen,
  onTaskComplete,
  getStatusBadge,
  getPriorityBadge,
  formatTimerDisplay,
}: {
  agentId: string; // ✅ NEW
  clientName: string;
  tasks: Task[];
  filteredTasks: Task[];
  selectedTasks?: string[]; // Array of task IDs
  setSelectedTasks: React.Dispatch<React.SetStateAction<string[]>>; // Matches useState setter type
  overdueCount: number;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  timerState: TimerState | null;
  handleStartTimer: (taskId: string) => void;
  handlePauseTimer: (taskId: string) => void;
  handleResetTimer: (taskId: string) => void;
  isTaskDisabled: (taskId: string) => boolean;
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
  onOpenStatusModal: () => void;
  taskToComplete: Task | null;
  setTaskToComplete: (t: Task | null) => void;
  isCompletionConfirmOpen: boolean;
  setIsCompletionConfirmOpen: (b: boolean) => void;
  onTaskComplete: (task: Task) => void;
  getStatusBadge: (status: string) => React.ReactElement;
  getPriorityBadge: (priority: string) => React.ReactElement;
  formatTimerDisplay: (seconds: number) => string;
}) {
  // 🔒 completed / qc_approved = read-only
  const isLocked = (t: Task) =>
    t.status === "completed" || t.status === "qc_approved";

  // State for reassign note modal
  const [isReassignNoteModalOpen, setIsReassignNoteModalOpen] = useState(false);
  const [selectedReassignNote, setSelectedReassignNote] = useState("");

  // ✅ Complete only if timer is running for this task
  const onRequestComplete = (task: Task) => {
    if (isLocked(task)) return;
    const isTimerActive =
      timerState?.taskId === task.id && timerState?.isRunning;
    if (!isTimerActive) {
      // Optional: gentle UX nudge; keep silent if you prefer
      // You can integrate your toast here if available:
      // toast.error("Start the timer for this task to submit.");
      return;
    }
    setTaskToComplete(task);
    setIsCompletionConfirmOpen(true);
  };

  const showReassignNote = (note: string) => {
    setSelectedReassignNote(note);
    setIsReassignNoteModalOpen(true);
  };

  // ✅ Assetless ক্যাটাগরি
  const ASSETLESS_SET = new Set([
    "social activity",
    "blog posting",
    "graphics design",
  ]);
  const isAssetlessCategory = (t: Task) =>
    ASSETLESS_SET.has((t.category?.name ?? "").toLowerCase());
  const isSocialActivity = (t: Task) =>
    (t.category?.name ?? "").toLowerCase() === "social activity";

  /**
   * ✅ URL resolve:
   * 1) completionLink > 2) (social হলে completionLink) > 3) templateSiteAsset.url > assetUrl/url
   */
  const computeUrl = (t: Task): string | null => {
    const cl = (t.completionLink ?? "").trim();
    if (cl) return cl;
    if (isSocialActivity(t)) return cl || null;
    return (
      t.templateSiteAsset?.url ?? (t as any).assetUrl ?? (t as any).url ?? null
    );
  };

  // ✅ সবগুলো assetless হলে Asset সেকশন hide
  const hideAssetSection = useMemo(
    () =>
      filteredTasks.length > 0 &&
      filteredTasks.every((t) => isAssetlessCategory(t)),
    [filteredTasks]
  );

  // ✅ Copy + Password visibility
  const [copied, setCopied] = useState<{
    id: string;
    type: "url" | "password" | "email" | "username";
  } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );

  const handleCopy = async (
    text: string,
    id: string,
    type: "url" | "password" | "email" | "username",
    revealAllowed?: boolean // ✅ নতুন প্যারাম
  ) => {
    if (!text || revealAllowed === false) return; // ⛔ hidden হলে কপি নয়
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ id, type });
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  };

  const isPasswordVisible = (id: string) => visiblePasswords.has(id);
  const togglePassword = (id: string) =>
    setVisiblePasswords((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  /**
   * 🧲 Sticky URL cache — timer action-এ nested relation হারালেও URL যেন না হারায়
   */
  const [lastKnownUrl, setLastKnownUrl] = useState<Map<string, string>>(
    new Map()
  );

  useEffect(() => {
    if (!filteredTasks?.length) return;
    setLastKnownUrl((prev) => {
      const next = new Map(prev);
      for (const t of filteredTasks) {
        const u = computeUrl(t);
        if (u) next.set(t.id, u);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTasks]);

  const getDisplayUrl = (t: Task) =>
    computeUrl(t) ?? lastKnownUrl.get(t.id) ?? null;

  // 🧩 helper: কোন টাস্কে data দেখা যাবে?
  const canReveal = (t: Task, timer: TimerState | null) => {
    const isActive = timer?.taskId === t.id && timer?.isRunning;
    // pending হলে কেবল timer চালু থাকলে দেখাবে; অন্য status আগের মতই দেখাবে
    return t.status !== "pending" || isActive;
  };

  // 🧩 helper: mask করা টেক্সট (তুমি চাইলে সবসময় "****" ফিরিয়েও দিতে পার)
  const mask = (s?: string | null) => (s ? "*********" : "N/A");

  // ListView Component (no multi-select, no checkbox)
  const renderListView = () => (
    <div className="space-y-4">
      {filteredTasks.map((task) => {
        const isTimerActive =
          timerState?.taskId === task.id && timerState?.isRunning;
        const displayUrl = getDisplayUrl(task);
        const urlCopied = copied?.id === task.id && copied?.type === "url";
        const emailCopied = copied?.id === task.id && copied?.type === "email";
        const usernameCopied =
          copied?.id === task.id && copied?.type === "username";
        const passwordCopied =
          copied?.id === task.id && copied?.type === "password";
        const locked = isLocked(task);
        const isThisTaskDisabled = locked || isTaskDisabled(task.id);

        const reveal = canReveal(task, timerState);

        return (
          <div
            key={task.id}
            className={`group relative bg-gradient-to-br from-white via-violet-50/30 to-purple-50/30 dark:from-gray-800 dark:via-violet-900/10 dark:to-purple-900/10 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${"border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 shadow-lg"} ${
              isThisTaskDisabled ? "opacity-70" : ""
            }`}
          >
            <div className="p-6 w-full">
              <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center w-full">
                {/* Left: Basic Info */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex-1 min-w-0 space-y-4">
                    <PerformanceBadge rating={task.performanceRating as any} />

                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-gray-50 text-lg truncate">
                        {task.name}
                      </h3>
                      {isTimerActive && !locked && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-100 via-cyan-100 to-teal-100 dark:from-blue-900/40 dark:via-cyan-900/40 dark:to-teal-900/40 rounded-full border-2 border-blue-200 dark:border-blue-700">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                            ACTIVE
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {getStatusBadge(task.status)}
                      </div>
                      {getPriorityBadge(task.priority)}
                      <Badge
                        variant="outline"
                        className="text-xs font-semibold border-2 border-gray-300 dark:border-gray-600"
                      >
                        {task.category?.name || "N/A"}
                      </Badge>
                    </div>
                    {task.status === "reassigned" && (
                      <div className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <p>Reassign Note:</p>
                        {task.reassignNotes && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-violet-100 dark:hover:bg-violet-800/50 transition-colors"
                            onClick={() =>
                              showReassignNote(task.reassignNotes || "")
                            }
                            title="View reassign note"
                          >
                            <Eye className="h-3 w-3 text-violet-600" />
                          </Button>
                        )}
                      </div>
                    )}

                    {!hideAssetSection && task.templateSiteAsset?.name && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
                        <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 break-words">
                          <span className="text-gray-700 dark:text-gray-300">
                            Asset:
                          </span>{" "}
                          {task.templateSiteAsset?.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Credentials & URL */}
                <div className="flex-1 min-w-0 w-full lg:w-auto">
                  <div className="space-y-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                    <div className="text-sm flex items-center gap-2">
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        Email:
                      </span>{" "}
                      <span className="font-mono text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                        {reveal ? task.email || "N/A" : mask(task.email)}
                      </span>
                      {!!task.email && !locked && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 rounded-xl transition-colors ${
                            reveal
                              ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() =>
                            handleCopy(task.email!, task.id, "email", reveal)
                          }
                          disabled={!reveal}
                          aria-label="Copy email"
                          title={reveal ? "Copy email" : "Start timer to view"}
                        >
                          {emailCopied ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-600" />
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        Username:
                      </span>{" "}
                      <span className="font-mono text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                        {reveal ? task.username || "N/A" : mask(task.username)}
                      </span>
                      {!!task.username && !locked && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 rounded-xl transition-colors ${
                            reveal
                              ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() =>
                            handleCopy(
                              task.username!,
                              task.id,
                              "username",
                              reveal
                            )
                          }
                          disabled={!reveal}
                          aria-label="Copy username"
                          title={
                            reveal ? "Copy username" : "Start timer to view"
                          }
                        >
                          {usernameCopied ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-600" />
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        Password:
                      </span>{" "}
                      <span className="font-mono text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                        {task.password
                          ? isLocked(task)
                            ? "••••••••"
                            : reveal
                            ? isPasswordVisible(task.id)
                              ? task.password
                              : "••••••••"
                            : mask(task.password)
                          : "N/A"}
                      </span>
                      {task.password && !isLocked(task) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 rounded-xl transition-colors ${
                            reveal
                              ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => reveal && togglePassword(task.id)}
                          disabled={!reveal}
                          aria-label={
                            isPasswordVisible(task.id)
                              ? "Hide password"
                              : "Show password"
                          }
                          title={
                            reveal
                              ? isPasswordVisible(task.id)
                                ? "Hide password"
                                : "Show password"
                              : "Start timer to view"
                          }
                        >
                          {isPasswordVisible(task.id) ? (
                            <EyeOff className="h-3 w-3 text-gray-600" />
                          ) : (
                            <Eye className="h-3 w-3 text-gray-600" />
                          )}
                        </Button>
                      )}
                      {task.password && !locked && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 rounded-xl transition-colors ${
                            reveal
                              ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() =>
                            handleCopy(
                              task.password!,
                              task.id,
                              "password",
                              reveal
                            )
                          }
                          disabled={!reveal}
                          aria-label="Copy password"
                          title={
                            reveal ? "Copy password" : "Start timer to view"
                          }
                        >
                          {passwordCopied ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-600" />
                          )}
                        </Button>
                      )}
                    </div>

                    {displayUrl && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                        <div className="text-sm flex items-start gap-2">
                          <span className="font-bold text-blue-800 dark:text-blue-300 flex-shrink-0">
                            URL:
                          </span>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {reveal ? (
                              <a
                                href={displayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 truncate underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                title={displayUrl}
                              >
                                <span className="truncate break-all inline-block max-w-full">
                                  {displayUrl}
                                </span>
                              </a>
                            ) : (
                              <span className="font-mono text-gray-700 dark:text-gray-300 break-all bg-white/70 dark:bg-gray-800/70 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                                {mask(displayUrl)}
                              </span>
                            )}
                            {!locked && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 rounded-xl transition-colors flex-shrink-0 ${
                                  reveal
                                    ? "hover:bg-blue-100 dark:hover:bg-blue-800/50"
                                    : "opacity-50 cursor-not-allowed"
                                }`}
                                onClick={() =>
                                  handleCopy(displayUrl, task.id, "url", reveal)
                                }
                                disabled={!reveal}
                                aria-label="Copy URL"
                                title={
                                  reveal ? "Copy URL" : "Start timer to view"
                                }
                              >
                                {urlCopied ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-blue-600" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Timer (Complete button triggers onRequestComplete; gate keeps by timer running) */}
                <div className="w-full lg:w-auto lg:min-w-[120px]">
                  <TaskTimer
                    task={task}
                    timerState={timerState}
                    onStartTimer={isLocked(task) ? () => {} : handleStartTimer}
                    onPauseTimer={isLocked(task) ? () => {} : handlePauseTimer}
                    onResetTimer={isLocked(task) ? () => {} : handleResetTimer}
                    onRequestComplete={onRequestComplete}
                    formatTimerDisplay={formatTimerDisplay}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // GridView Component (no multi-select, no checkbox)
  // ⬇️ Replace your existing renderGridView with this one
  const renderGridView = () => (
    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {filteredTasks.map((task) => {
        const isTimerActive =
          timerState?.taskId === task.id && timerState?.isRunning;

        const displayUrl = getDisplayUrl(task);
        const urlCopied = copied?.id === task.id && copied?.type === "url";
        const emailCopied = copied?.id === task.id && copied?.type === "email";
        const usernameCopied =
          copied?.id === task.id && copied?.type === "username";
        const passwordCopied =
          copied?.id === task.id && copied?.type === "password";
        const locked = isLocked(task);
        const isThisTaskDisabled = locked || isTaskDisabled(task.id);
        const performanceRating = task.performanceRating;

        // ✅ reveal only if NOT pending OR (pending + timer is active)
        const reveal = task.status !== "pending" || isTimerActive;

        return (
          <div
            key={task.id}
            className={`group relative bg-gradient-to-br from-white via-violet-50/30 to-purple-50/30 dark:from-gray-800 dark:via-violet-900/10 dark:to-purple-900/10 rounded-3xl border-2 transition-all duration-500 hover:shadow-2xl hover:-translate-y-0.5 ${"border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 shadow-xl"} ${
              isThisTaskDisabled ? "opacity-70" : ""
            }`}
          >
            {/* Card content wrapper */}
            <div className="p-6 h-full flex flex-col">
              {/* ===== Top/Main content ===== */}
              <div className="flex-1 flex flex-col space-y-6">
                {/* Title + Active badge */}
                <div className="flex items-start gap-4 w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h3 className="font-bold text-gray-900 dark:text-gray-50 text-xl truncate">
                        {task.name}
                      </h3>
                      {isTimerActive && !locked && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 via-cyan-100 to-teal-100 dark:from-blue-900/40 dark:via-cyan-900/40 dark:to-teal-900/40 rounded-full border-2 border-blue-200 dark:border-blue-700">
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            ACTIVE
                          </span>
                        </div>
                      )}

                      <PerformanceBadge rating={performanceRating as any} />
                    </div>

                    {/* Status / Priority / Category */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getStatusBadge(task.status)}
                        {task.status === "reassigned" && task.reassignNotes && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-violet-100 dark:hover:bg-violet-800/50 transition-colors"
                            onClick={() =>
                              showReassignNote(task.reassignNotes || "")
                            }
                            title="View reassign note"
                          >
                            <Eye className="h-4 w-4 text-violet-600" />
                          </Button>
                        )}
                      </div>
                      {getPriorityBadge(task.priority)}
                      <Badge
                        variant="outline"
                        className="text-sm font-semibold border-2 border-gray-300 dark:border-gray-600"
                      >
                        {task.category?.name || "N/A"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Asset */}
                {!hideAssetSection && task.templateSiteAsset?.name && (
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700">
                    <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
                      <span className="text-gray-700 dark:text-gray-300">
                        Asset:
                      </span>{" "}
                      {task.templateSiteAsset?.name}
                    </p>
                  </div>
                )}

                {/* URL */}
                {displayUrl && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl border-2 border-blue-200 dark:border-blue-700">
                    <div className="text-sm flex items-start gap-3">
                      <span className="font-bold text-blue-800 dark:text-blue-300 flex-shrink-0">
                        URL:
                      </span>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {reveal ? (
                          <a
                            href={displayUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 truncate underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                            title={displayUrl}
                          >
                            <span className="truncate break-all inline-block max-w-full">
                              {displayUrl}
                            </span>
                          </a>
                        ) : (
                          // keep visual weight similar (no design change)
                          <span
                            className="text-blue-600 dark:text-blue-400 truncate underline underline-offset-2 font-medium"
                            title="Start timer to view"
                          >
                            <span className="truncate break-all inline-block max-w-full">
                              {mask(displayUrl)}
                            </span>
                          </span>
                        )}

                        {!locked && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors flex-shrink-0"
                            onClick={() =>
                              reveal && handleCopy(displayUrl, task.id, "url")
                            }
                            aria-label="Copy URL"
                            title={reveal ? "Copy URL" : "Start timer to view"}
                          >
                            {urlCopied ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-blue-600" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Credentials */}
                <div className="space-y-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-2xl p-4 border-2 border-gray-200 dark:border-gray-700">
                  <div className="text-sm flex items-center gap-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      Email:
                    </span>{" "}
                    <span className="font-mono text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600">
                      {reveal ? task.email || "N/A" : mask(task.email)}
                    </span>
                    {!!task.email && !locked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() =>
                          reveal && handleCopy(task.email!, task.id, "email")
                        }
                        aria-label="Copy email"
                        title={reveal ? "Copy email" : "Start timer to view"}
                      >
                        {emailCopied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      Username:
                    </span>{" "}
                    <span className="font-mono text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600">
                      {reveal ? task.username || "N/A" : mask(task.username)}
                    </span>
                    {!!task.username && !locked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() =>
                          reveal &&
                          handleCopy(task.username!, task.id, "username")
                        }
                        aria-label="Copy username"
                        title={reveal ? "Copy username" : "Start timer to view"}
                      >
                        {usernameCopied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      Password:
                    </span>{" "}
                    <span className="font-mono text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600">
                      {task.password
                        ? isLocked(task)
                          ? "••••••••"
                          : reveal
                          ? isPasswordVisible(task.id)
                            ? task.password
                            : "••••••••"
                          : mask(task.password)
                        : "N/A"}
                    </span>
                    {task.password && !isLocked(task) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => reveal && togglePassword(task.id)}
                        aria-label={
                          isPasswordVisible(task.id)
                            ? "Hide password"
                            : "Show password"
                        }
                        title={
                          reveal
                            ? isPasswordVisible(task.id)
                              ? "Hide password"
                              : "Show password"
                            : "Start timer to view"
                        }
                      >
                        {isPasswordVisible(task.id) ? (
                          <EyeOff className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-600" />
                        )}
                      </Button>
                    )}
                    {task.password && !locked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() =>
                          reveal &&
                          handleCopy(task.password!, task.id, "password")
                        }
                        aria-label="Copy password"
                        title={reveal ? "Copy password" : "Start timer to view"}
                      >
                        {passwordCopied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== Bottom Action Section (separate) ===== */}
              <div className="mt-6 -mx-6 -mb-8 px-8 py-5 bg-gradient-to-r from-violet-50/70 to-purple-50/70 dark:from-violet-900/20 dark:to-purple-900/20 border-t-2 border-violet-200/70 dark:border-violet-700/70 backdrop-blur-sm">
                <div className="mt-3">
                  <TaskTimer
                    task={task}
                    timerState={timerState}
                    onStartTimer={isLocked(task) ? () => {} : handleStartTimer}
                    onPauseTimer={isLocked(task) ? () => {} : handlePauseTimer}
                    onResetTimer={isLocked(task) ? () => {} : handleResetTimer}
                    onRequestComplete={onRequestComplete}
                    formatTimerDisplay={formatTimerDisplay}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full overflow-x-hidden">
      <Card className="border-0 shadow-2xl bg-white dark:bg-gray-900 overflow-hidden">
        <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-b border-violet-100 dark:border-violet-800/50">
          <CardHeader className="pb-8">
            {/* Header */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center w-full">
              <div className="col-span-2 flex items-center space-x-4 min-w-0">
                <div className="p-4 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl">
                  {viewMode === "list" ? (
                    <List className="h-8 w-8 text-white" />
                  ) : (
                    <Grid3X3 className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-900 via-purple-900 to-pink-900 dark:from-violet-100 dark:via-purple-100 dark:to-pink-100 bg-clip-text text-transparent break-words">
                    Task Management
                  </CardTitle>
                  <CardDescription className="text-gray-700 dark:text-gray-300 text-lg mt-1 font-medium">
                    Managing tasks for{" "}
                    <span className="font-bold text-violet-700 dark:text-violet-400">
                      {clientName}
                    </span>
                  </CardDescription>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="col-span-3 flex justify-end">
                <div className="flex items-center bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border-2 border-violet-200 dark:border-violet-700 rounded-2xl p-2 shadow-lg">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={`rounded-xl h-12 w-12 transition-all duration-300 ${
                      viewMode === "list"
                        ? "bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white shadow-lg"
                        : "text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-800/50"
                    }`}
                  >
                    <List className="h-5 w-5" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-xl h-12 w-12 transition-all duration-300 ${
                      viewMode === "grid"
                        ? "bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white shadow-lg"
                        : "text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-800/50"
                    }`}
                  >
                    <Grid3X3 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </div>

        <CardContent className="p-8 max-w-full overflow-x-hidden">
          {/* Filters */}
          <div className="flex flex-col xl:flex-row gap-6 mb-8 items-start">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400 h-5 w-5" />
              <Input
                placeholder="Search tasks by name, category, asset, or completion link..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 border-2 border-violet-200 dark:border-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 text-gray-900 dark:text-gray-50 rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 text-base shadow-lg transition-all duration-300 placeholder:text-violet-400"
              />
            </div>
            <div className="flex flex-col lg:flex-row gap-4 w-full xl:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-[200px] h-14 border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl text-base shadow-lg font-medium">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-blue-200 dark:border-blue-700 shadow-2xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="reassigned">Reassigned</SelectItem>
                  <SelectItem value="qc_approved">QC Approved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full lg:w-[200px] h-14 border-2 border-emerald-200 dark:border-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl text-base shadow-lg font-medium">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-700 shadow-2xl">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task Content */}
          <div className="w-full">
            {filteredTasks.length > 0 ? (
              viewMode === "list" ? (
                renderListView()
              ) : (
                renderGridView()
              )
            ) : (
              <div className="py-24 text-center">
                <div className="mx-auto w-40 h-40 bg-gradient-to-br from-violet-100 via-purple-100 to-pink-100 dark:from-violet-800/30 dark:via-purple-800/30 dark:to-pink-800/30 rounded-3xl flex items-center justify-center mb-8 shadow-2xl border-2 border-violet-200 dark:border-violet-700">
                  {viewMode === "list" ? (
                    <List className="h-16 w-16 text-violet-500" />
                  ) : (
                    <Grid3X3 className="h-16 w-16 text-violet-500" />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-2xl font-bold mb-3">
                  No tasks found
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>

          {/* Summary (no selection UI) */}
          {filteredTasks.length > 0 && (
            <div className="max-w-full flex flex-col lg:flex-row items-start lg:items-center justify-between pt-8 mt-8 border-t-2 border-gradient-to-r from-violet-200 to-purple-200 dark:from-violet-800 dark:to-purple-800 gap-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 px-4 py-3 rounded-2xl border-2 border-violet-200 dark:border-violet-700 shadow-lg">
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    Showing{" "}
                    <span className="text-violet-700 dark:text-violet-400 text-xl">
                      {filteredTasks.length}
                    </span>{" "}
                    of{" "}
                    <span className="text-gray-900 dark:text-gray-50 text-xl">
                      {tasks.length}
                    </span>{" "}
                    tasks
                  </p>
                </div>
                {overdueCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-base font-bold px-4 py-2 rounded-xl shadow-lg border-2 border-red-300"
                  >
                    {overdueCount} overdue
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ReassignNoteModal
        isOpen={isReassignNoteModalOpen}
        onClose={() => setIsReassignNoteModalOpen(false)}
        note={selectedReassignNote}
      />
    </div>
  );
}
