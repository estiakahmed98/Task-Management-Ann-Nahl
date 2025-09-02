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
import { List, Grid3X3, Search, Copy, Check, Eye, EyeOff, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TaskTimer from "./TaskTimer";
import ReassignNoteModal from "./ReassignNoteModal";
import type { Task, TimerState } from "../client-tasks-view/client-tasks-view";

export default function TaskList({
  clientName,
  tasks,
  filteredTasks,
  overdueCount,
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
  // 🔒 completed / qc_approved = read-only
  const isLocked = (t: Task) => t.status === "completed" || t.status === "qc_approved";

  // State for reassign note modal
  const [isReassignNoteModalOpen, setIsReassignNoteModalOpen] = useState(false);
  const [selectedReassignNote, setSelectedReassignNote] = useState("");

  const onRequestComplete = (task: Task) => {
    if (isLocked(task)) return;
    setTaskToComplete(task);
    setIsCompletionConfirmOpen(true);
  };

  // Show reassign note in modal
  const showReassignNote = (note: string) => {
    setSelectedReassignNote(note);
    setIsReassignNoteModalOpen(true);
  };

  // ✅ Assetless ক্যাটাগরি
  const ASSETLESS_SET = new Set(["social activity", "blog posting", "graphics design"]);
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
    return t.templateSiteAsset?.url ?? (t as any).assetUrl ?? (t as any).url ?? null;
  };

  // ✅ সবগুলো assetless হলে Asset কলাম hide
  const hideAssetColumn = useMemo(
    () => filteredTasks.length > 0 && filteredTasks.every((t) => isAssetlessCategory(t)),
    [filteredTasks]
  );

  // ✅ Copy + Password visibility
  const [copied, setCopied] = useState<{ id: string; type: "url" | "password" } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

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

  /**
   * 🧲 Sticky URL cache — timer action-এ nested relation হারালেও URL যেন না হারায়
   */
  const [lastKnownUrl, setLastKnownUrl] = useState<Map<string, string>>(new Map());

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

  // 🔘 Select-all: locked বাদ
  const unlockedFiltered = useMemo(
    () => filteredTasks.filter((t) => !isLocked(t)),
    [filteredTasks]
  );

  return (
    <div className="w-full overflow-x-hidden">
      <ReassignNoteModal 
        isOpen={isReassignNoteModalOpen}
        onClose={() => setIsReassignNoteModalOpen(false)}
        note={selectedReassignNote}
      />
      
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-900 overflow-hidden max-w-full">
        <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-800/20 dark:to-indigo-800/20">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
                  <List className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-50">
                    Task Management
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                    Manage tasks for {clientName}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="px-2 py-1">
                    {overdueCount} Overdue
                  </Badge>
                )}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 px-3 rounded-md text-xs"
                  >
                    <List className="h-3 w-3 mr-1" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 px-3 rounded-md text-xs"
                  >
                    <Grid3X3 className="h-3 w-3 mr-1" />
                    Grid
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </div>

        <CardContent className="p-4 md:p-6 overflow-x-hidden">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6 items-start">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks by name, category, asset, or completion link..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
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
                <SelectTrigger className="w-full sm:w-[160px] h-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md text-sm">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {viewMode === "list" ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="max-h-[65vh] overflow-y-auto overscroll-contain scroll-smooth">
                <div className="w-full overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="w-12 py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>

                        {!hideAssetColumn && (
                          <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Asset
                          </th>
                        )}

                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          URL
                        </th>

                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Password
                        </th>

                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Timer
                        </th>
                        <th className="w-12 py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {filteredTasks.map((task) => {
                        const isSelected = selectedTasks.includes(task.id);
                        const isTimerActive =
                          timerState?.taskId === task.id && timerState?.isRunning;

                        const displayUrl = getDisplayUrl(task);
                        const urlCopied = copied?.id === task.id && copied?.type === "url";
                        const pwdVisible = isPasswordVisible(task.id);
                        const locked = isLocked(task);

                        return (
                          <tr
                            key={task.id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                              isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                            } ${locked ? "opacity-70" : ""}`}
                          >
                            <td className="py-3 px-3">
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
                                className={locked ? "cursor-not-allowed opacity-50" : ""}
                              />
                            </td>

                            <td className="py-3 px-3 max-w-xs">
                              <div className="flex items-center gap-2">
                                <div className="min-w-0">
                                  <h3 className="font-medium text-gray-900 dark:text-gray-50 text-sm truncate">
                                    {task.name}
                                  </h3>
                                  {task.comments && task.comments[0]?.text && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                      {task.comments[0].text}
                                    </p>
                                  )}
                                </div>
                                {isTimerActive && !locked && (
                                  <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                      Active
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1">
                                {getStatusBadge(task.status)}
                                {task.status === "reassigned" && task.reassignNote && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full"
                                    onClick={() => showReassignNote(task.reassignNote || "")}
                                    title="View reassign note"
                                  >
                                    <Info className="h-3 w-3 text-gray-500" />
                                  </Button>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3">{getPriorityBadge(task.priority)}</td>

                            <td className="py-3 px-3">
                              <Badge variant="outline" className="text-xs">
                                {task.category?.name || "N/A"}
                              </Badge>
                            </td>

                            {/* Asset cell: শুধুই নন-assetless ক্যাটাগরির জন্য */}
                            {!hideAssetColumn && (
                              <td className="py-3 px-3">
                                {!isAssetlessCategory(task) ? (
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {task.templateSiteAsset?.name || "N/A"}
                                  </span>
                                ) : null}
                              </td>
                            )}

                            {/* URL: locked হলেও নীল লিঙ্ক; copy button কেবল unlocked-এ */}
                            <td className="py-3 px-3 max-w-xs">
                              {displayUrl ? (
                                <div className="flex items-center gap-1">
                                  <a
                                    href={displayUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 truncate underline underline-offset-2"
                                    title={displayUrl}
                                  >
                                    {displayUrl}
                                  </a>
                                  {!locked && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-md"
                                      onClick={() => handleCopy(displayUrl, task.id, "url")}
                                      aria-label="Copy URL"
                                      title="Copy URL"
                                    >
                                      {urlCopied ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
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

                            {/* Email */}
                            <td className="py-3 px-3 max-w-xs">
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">
                                {task.email || "N/A"}
                              </span>
                            </td>

                            {/* Username */}
                            <td className="py-3 px-3 max-w-xs">
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">
                                {task.username || "N/A"}
                              </span>
                            </td>

                            {/* Password */}
                            <td className="py-3 px-3 max-w-xs">
                              {task.password ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                    {locked ? "****" : pwdVisible ? task.password : "****"}
                                  </span>
                                  {!locked && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-md"
                                      onClick={() => togglePassword(task.id)}
                                      aria-label={pwdVisible ? "Hide password" : "Show password"}
                                      title={pwdVisible ? "Hide password" : "Show password"}
                                    >
                                      {pwdVisible ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              {task.performanceRating ? (
                                <Badge
                                  className={
                                    {
                                      Excellent:
                                        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                                      Good:
                                        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                                      Average:
                                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
                                      Lazy:
                                        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                                    }[task.performanceRating]
                                  }
                                >
                                  {task.performanceRating}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {typeof task.actualDurationMinutes === "number"
                                  ? `${task.actualDurationMinutes}m`
                                  : "-"}
                              </span>
                            </td>

                            <td className="py-3 px-3">
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
                            
                            <td className="py-3 px-3">
                              {task.status === "reassigned" && task.reassignNote && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-md"
                                  onClick={() => showReassignNote(task.reassignNote || "")}
                                  title="View reassign note"
                                >
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {filteredTasks.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
                </div>
              )}
            </div>
          ) : (
            // Grid view
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => {
                const isSelected = selectedTasks.includes(task.id);
                const isTimerActive =
                  timerState?.taskId === task.id && timerState?.isRunning;

                const displayUrl = getDisplayUrl(task);
                const urlCopied = copied?.id === task.id && copied?.type === "url";
                const pwdVisible = isPasswordVisible(task.id);
                const locked = isLocked(task);
                const isThisTaskDisabled = locked || isTaskDisabled(task.id);

                return (
                  <div
                    key={task.id}
                    className={`group relative bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? "border-blue-500 shadow-md ring-1 ring-blue-500/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    } ${isThisTaskDisabled ? "opacity-70" : ""}`}
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3 w-full">
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
                          className={locked ? "cursor-not-allowed mt-0.5" : "mt-0.5"}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-base truncate">
                              {task.name}
                            </h3>
                            {isTimerActive && !locked && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                  Active
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <div className="flex items-center gap-0.5">
                              {getStatusBadge(task.status)}
                              {task.status === "reassigned" && task.reassignNote && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 rounded-full"
                                  onClick={() => showReassignNote(task.reassignNote || "")}
                                  title="View reassign note"
                                >
                                  <Info className="h-3 w-3 text-gray-500" />
                                </Button>
                              )}
                            </div>
                            {getPriorityBadge(task.priority)}
                            <Badge variant="outline" className="text-xs">
                              {task.category?.name}
                            </Badge>
                          </div>

                          {!isAssetlessCategory(task) && task.templateSiteAsset?.name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span className="font-medium">Asset:</span>{" "}
                              {task.templateSiteAsset?.name}
                            </p>
                          )}

                          {displayUrl ? (
                            <div className="mb-2">
                              <div className="text-sm flex items-center gap-1">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  URL:
                                </span>
                                <a
                                  href={displayUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 truncate underline underline-offset-2"
                                  title={displayUrl}
                                >
                                  {displayUrl}
                                </a>
                                {!locked && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-md"
                                    onClick={() =>
                                      handleCopy(displayUrl, task.id, "url")
                                    }
                                    aria-label="Copy URL"
                                    title="Copy URL"
                                  >
                                    {urlCopied ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : null}

                          <div className="mt-2 space-y-1">
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
                            <div className="text-sm flex items-center gap-1">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Password:
                              </span>{" "}
                              <span className="font-mono break-all text-gray-700 dark:text-gray-300">
                                {task.password
                                  ? isLocked(task)
                                    ? "****"
                                    : isPasswordVisible(task.id)
                                    ? task.password
                                    : "****"
                                  : "N/A"}
                              </span>
                              {task.password && !isLocked(task) && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md"
                                  onClick={() => togglePassword(task.id)}
                                  aria-label={
                                    isPasswordVisible(task.id) ? "Hide password" : "Show password"
                                  }
                                  title={
                                    isPasswordVisible(task.id) ? "Hide password" : "Show password"
                                  }
                                >
                                  {isPasswordVisible(task.id) ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
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
                );
              })}
            </div>
          )}

          {/* Results Summary */}
          {filteredTasks.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-800 gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing{" "}
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {filteredTasks.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900 dark:text-gray-50">
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
                    className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                  >
                    Update Status
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}