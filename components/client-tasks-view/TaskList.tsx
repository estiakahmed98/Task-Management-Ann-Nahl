//app/components/client-tasks-view/TaskList.tsx

"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { List, Grid3X3, Search, Copy, Check, Eye, EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TaskTimer from "./TaskTimer";
import type { Task, TimerState } from "../client-tasks-view/client-tasks-view";

export default function TaskList({
  clientName,
  tasks,
  filteredTasks,
  overdueCount, // kept
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  selectedTasks,
  setSelectedTasks,
  timerState,
  handleStartTimer,
  handlePauseTimer,
  handleResetTimer,
  isTaskDisabled,
  viewMode,
  setViewMode,
  onOpenStatusModal,
  setTaskToComplete,
  setIsCompletionConfirmOpen,
  getStatusBadge,
  getPriorityBadge,
  formatTimerDisplay,
}: {
  clientName: string;
  tasks: Task[];
  filteredTasks: Task[];
  overdueCount: number;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  selectedTasks: string[];
  setSelectedTasks: (ids: string[]) => void;
  timerState: TimerState | null;
  handleStartTimer: (taskId: string) => void;
  handlePauseTimer: (taskId: string) => void;
  handleResetTimer: (taskId: string) => void;
  isTaskDisabled: (taskId: string) => boolean;
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
  onOpenStatusModal: () => void;
  setTaskToComplete: (t: Task | null) => void;
  setIsCompletionConfirmOpen: (b: boolean) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getPriorityBadge: (priority: string) => JSX.Element;
  formatTimerDisplay: (seconds: number) => string;
}) {
  // 🔒 Lock rule
  const isLocked = (t: Task) =>
    t.status === "completed" || t.status === "qc_approved";

  // Complete modal opener (blocked for locked)
  const onRequestComplete = (task: Task) => {
    if (isLocked(task)) return;
    setTaskToComplete(task);
    setIsCompletionConfirmOpen(true);
  };

  // ✅ Helpers
  const isSocialActivity = (t: Task) =>
    (t.category?.name ?? "").toLowerCase() === "social activity";

  // URL resolve rules (completionLink > socialLink > asset urls)
  const computeUrl = (t: Task): string | null => {
    const cl = (t.completionLink ?? "").trim();
    if (cl) return cl;
    if (isSocialActivity(t)) return cl || null;
    return (
      t.templateSiteAsset?.url ?? (t as any).assetUrl ?? (t as any).url ?? null
    );
  };

  // Hide Asset column if all are social
  const hideAssetColumn = useMemo(
    () =>
      filteredTasks.length > 0 &&
      filteredTasks.every((t) => isSocialActivity(t)),
    [filteredTasks]
  );

  // Copy + Password UI
  const [copied, setCopied] = useState<{
    id: string;
    type: "url" | "password";
  } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );

  const handleCopy = async (
    text: string,
    id: string,
    type: "url" | "password"
  ) => {
    if (!text) return;
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

  // 🧲 Sticky URL cache
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

  // 🔘 Select-all should ignore locked tasks
  const unlockedFiltered = useMemo(
    () => filteredTasks.filter((t) => !isLocked(t)),
    [filteredTasks]
  );

  return (
    <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <List className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                Task Management
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
                Search, filter, and manage tasks for {clientName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </div>
      <CardContent className="p-6">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search tasks by name, category, asset, or completion link..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-12 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
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
              <SelectTrigger className="w-full sm:w-[180px] h-12 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-10 px-4 rounded-lg"
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-10 px-4 rounded-lg"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grid
              </Button>
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                    <Checkbox
                      checked={
                        selectedTasks.length === unlockedFiltered.length &&
                        unlockedFiltered.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTasks(unlockedFiltered.map((t) => t.id));
                        } else {
                          setSelectedTasks([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                    Task
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                    Priority
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                    Category
                  </th>

                  {!hideAssetColumn && (
                    <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                      Asset
                    </th>
                  )}

                  <th className="text-left py-16 px-16 font-semibold text-gray-900 dark:text-gray-50">
                    URL
                  </th>

                  <th className="text-left py-16 px-16 font-semibold text-gray-900 dark:text-gray-50">
                    Email
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                    Username
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                    Password
                  </th>

                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                    Performance
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                    Duration (min)
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                    Timer (min)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const isSelected = selectedTasks.includes(task.id);
                  const isTimerActive =
                    timerState?.taskId === task.id && timerState?.isRunning;

                  const displayUrl = getDisplayUrl(task);
                  const urlCopied =
                    copied?.id === task.id && copied?.type === "url";
                  const pwdVisible = isPasswordVisible(task.id);
                  const locked = isLocked(task);

                  return (
                    <tr
                      key={task.id}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      } ${locked ? "opacity-60" : ""}`}
                    >
                      <td className="py-4 px-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (locked) return;
                            if (checked) {
                              setSelectedTasks([...selectedTasks, task.id]);
                            } else {
                              setSelectedTasks(
                                selectedTasks.filter((id) => id !== task.id)
                              );
                            }
                          }}
                          disabled={locked}
                          className={
                            locked ? "cursor-not-allowed opacity-50" : ""
                          }
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm">
                              {task.name}
                            </h3>
                            {task.comments && task.comments[0]?.text && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate max-w-xs">
                                {task.comments[0].text}
                              </p>
                            )}
                          </div>
                          {isTimerActive && !locked && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                Active
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(task.status)}
                      </td>

                      <td className="py-4 px-4">
                        {getPriorityBadge(task.priority)}
                      </td>

                      <td className="py-4 px-4">
                        <Badge variant="outline" className="text-xs">
                          {task.category?.name || "N/A"}
                        </Badge>
                      </td>

                      {!hideAssetColumn && (
                        <td className="py-4 px-4">
                          {!isSocialActivity(task) ? (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {task.templateSiteAsset?.name || "N/A"}
                            </span>
                          ) : null}
                        </td>
                      )}

                      {/* URL + copy (disabled if locked) */}
                      <td className="py-4 px-4">
                        {displayUrl ? (
                          locked ? (
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              {displayUrl}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <a
                                href={displayUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 font-mono break-all underline underline-offset-2"
                                title={displayUrl}
                              >
                                {displayUrl}
                              </a>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() =>
                                  handleCopy(displayUrl, task.id, "url")
                                }
                                aria-label="Copy URL"
                                title="Copy URL"
                              >
                                {urlCopied ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            N/A
                          </span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4">
                        <span className="text-sm font-mono break-all text-gray-700 dark:text-gray-300">
                          {task.email || "N/A"}
                        </span>
                      </td>

                      {/* Username */}
                      <td className="py-4 px-4">
                        <span className="text-sm font-mono break-all text-gray-700 dark:text-gray-300">
                          {task.username || "N/A"}
                        </span>
                      </td>

                      {/* Password: masked + eye toggle (disabled if locked) */}
                      <td className="py-4 px-4">
                        {task.password ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono break-all text-gray-700 dark:text-gray-300">
                              {locked
                                ? "****"
                                : pwdVisible
                                ? task.password
                                : "****"}
                            </span>
                            {!locked && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() => togglePassword(task.id)}
                                aria-label={
                                  pwdVisible ? "Hide password" : "Show password"
                                }
                                title={
                                  pwdVisible ? "Hide password" : "Show password"
                                }
                              >
                                {pwdVisible ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            N/A
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {task.performanceRating ? (
                          <Badge
                            className={
                              {
                                Excellent:
                                  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                                Good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                                Average:
                                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
                                Lazy: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                              }[task.performanceRating]
                            }
                          >
                            {task.performanceRating}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {typeof task.actualDurationMinutes === "number"
                            ? task.actualDurationMinutes
                            : "-"}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <TaskTimer
                          task={task}
                          timerState={timerState}
                          onStartTimer={locked ? () => {} : handleStartTimer}
                          onPauseTimer={locked ? () => {} : handlePauseTimer}
                          onResetTimer={locked ? () => {} : handleResetTimer}
                          onRequestComplete={onRequestComplete}
                          formatTimerDisplay={formatTimerDisplay}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              const isSelected = selectedTasks.includes(task.id);
              const isTimerActive =
                timerState?.taskId === task.id && timerState?.isRunning;

              const displayUrl = getDisplayUrl(task);
              const urlCopied =
                copied?.id === task.id && copied?.type === "url";
              const pwdVisible = isPasswordVisible(task.id);

              const locked = isLocked(task);
              const isThisTaskDisabled = locked || isTaskDisabled(task.id);

              return (
                <div
                  key={task.id}
                  className={`group relative bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                    isSelected
                      ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  } ${isThisTaskDisabled ? "opacity-60" : ""}`}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 w-full">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (locked) return;
                          if (checked) {
                            setSelectedTasks([...selectedTasks, task.id]);
                          } else {
                            setSelectedTasks(
                              selectedTasks.filter((id) => id !== task.id)
                            );
                          }
                        }}
                        disabled={locked}
                        className={locked ? "cursor-not-allowed" : ""}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-lg truncate">
                            {task.name}
                          </h3>
                          {isTimerActive && !locked && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                Active
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                          <Badge variant="outline" className="text-xs">
                            {task.category?.name}
                          </Badge>
                          {task.performanceRating ? (
                            <Badge
                              variant="outline"
                              className={
                                {
                                  Excellent:
                                    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                                  Good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                                  Average:
                                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
                                  Lazy: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                                }[task.performanceRating!]
                              }
                            >
                              {task.performanceRating}
                            </Badge>
                          ) : null}
                          <Badge variant="outline" className="text-xs">
                            {typeof task.actualDurationMinutes === "number"
                              ? `${task.actualDurationMinutes} min`
                              : "-"}
                          </Badge>
                        </div>

                        {!isSocialActivity(task) &&
                          task.templateSiteAsset?.name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Asset:</span>{" "}
                              {task.templateSiteAsset?.name}
                            </p>
                          )}

                        {/* URL + copy (disabled if locked) */}
                        {displayUrl ? (
                          <div className="mb-2">
                            <div className="text-sm flex items-center gap-2">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                URL:
                              </span>
                              {locked ? (
                                <span className="text-gray-400 dark:text-gray-500">
                                  {displayUrl}
                                </span>
                              ) : (
                                <>
                                  <a
                                    href={displayUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 font-mono break-all underline underline-offset-2"
                                    title={displayUrl}
                                  >
                                    {displayUrl}
                                  </a>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-md"
                                    onClick={() =>
                                      handleCopy(displayUrl, task.id, "url")
                                    }
                                    aria-label="Copy URL"
                                    title="Copy URL"
                                  >
                                    {urlCopied ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : null}

                        {/* Credentials */}
                        <div className="mt-3 space-y-1">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Email:
                            </span>{" "}
                            <span className="font-mono break-all text-gray-700 dark:text-gray-300">
                              {task.email || "N/A"}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Username:
                            </span>{" "}
                            <span className="font-mono break-all text-gray-700 dark:text-gray-300">
                              {task.username || "N/A"}
                            </span>
                          </div>
                          <div className="text-sm flex items-center gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Password:
                            </span>{" "}
                            <span className="font-mono break-all text-gray-700 dark:text-gray-300">
                              {task.password
                                ? locked
                                  ? "****"
                                  : isPasswordVisible(task.id)
                                  ? task.password
                                  : "****"
                                : "N/A"}
                            </span>
                            {task.password && !locked && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md"
                                onClick={() => togglePassword(task.id)}
                                aria-label={
                                  isPasswordVisible(task.id)
                                    ? "Hide password"
                                    : "Show password"
                                }
                                title={
                                  isPasswordVisible(task.id)
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {isPasswordVisible(task.id) ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {task.comments && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                            {task.comments[0]?.text}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="w-full flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <TaskTimer
                        task={task}
                        timerState={timerState}
                        onStartTimer={locked ? () => {} : handleStartTimer}
                        onPauseTimer={locked ? () => {} : handlePauseTimer}
                        onResetTimer={locked ? () => {} : handleResetTimer}
                        onRequestComplete={onRequestComplete}
                        formatTimerDisplay={formatTimerDisplay}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results Summary */}
        {filteredTasks.length > 0 && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-50">
                {filteredTasks.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-50">
                {tasks.length}
              </span>{" "}
              tasks
            </p>
            {selectedTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTasks.length} selected
                </span>
                <Button
                  size="sm"
                  onClick={onOpenStatusModal}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Update Status
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
