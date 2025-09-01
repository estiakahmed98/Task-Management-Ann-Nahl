// app/components/tasks-table.tsx

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  CheckCircle,
  AlertCircle,
  Timer,
  Play, // status badge + timer cell
  Pause, // timer cell
  ShieldCheck,
  XCircle,
  RefreshCw,
  Clock,
  Link2,
} from "lucide-react";

// Types
interface Task {
  id: string;
  name: string;
  priority: "low" | "medium" | "high" | "urgent";
  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "overdue"
    | "cancelled"
    | "reassigned"
    | "qc_approved";
  dueDate: string | null;
  idealDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  performanceRating: "Excellent" | "Good" | "Average" | "Lazy" | null;
  completionLink: string | null;
  email: string | null;
  username: string | null;
  password: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignment: {
    id: string;
    client: {
      id: string;
      name: string;
      avatar: string | null;
    } | null;
    template: {
      id: string;
      name: string;
    } | null;
  } | null;
  templateSiteAsset: {
    id: number;
    name: string;
    type: string;
    url: string | null;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    image: string | null;
  } | null;
  comments: Array<{
    id: string;
    text: string;
    date: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      image: string | null;
    } | null;
  }>;
}

interface TimerState {
  taskId: string;
  remainingSeconds: number;
  isRunning: boolean;
  totalSeconds: number;
  isGloballyLocked: boolean;
  lockedByAgent?: string;
  startedAt?: number;
  pausedAt?: number;
}

interface TaskTableProps {
  filteredTasks: Task[];
  timerState: TimerState | null;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
  onCompleteTask: (task: Task) => void;
}

// Utils
const formatTimerDisplay = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0)
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

// Icon action component
function IconAction({
  onClick,
  title,
  icon: Icon,
  disabled,
  className = "",
}: {
  onClick: () => void;
  title: string;
  icon: React.ElementType;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={title}
            title={title}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Badges
const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: {
      className:
        "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 border-slate-300 dark:border-slate-700",
      icon: Clock,
      label: "Pending",
    },
    in_progress: {
      className:
        "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-800",
      icon: Play,
      label: "In Progress",
    },
    completed: {
      className:
        "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
      icon: CheckCircle,
      label: "Completed",
    },
    qc_approved: {
      className:
        "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-800",
      icon: ShieldCheck,
      label: "QC Approved",
    },
    overdue: {
      className:
        "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-800",
      icon: AlertCircle,
      label: "Overdue",
    },
    cancelled: {
      className:
        "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700",
      icon: XCircle,
      label: "Cancelled",
    },
    reassigned: {
      className:
        "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-800",
      icon: RefreshCw,
      label: "Reassigned",
    },
  };
  const config = (statusConfig as any)[status];
  if (!config) return <Badge variant="secondary">{status}</Badge>;
  const IconComponent = config.icon;
  return (
    <Badge className={config.className}>
      <IconComponent className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

const getPriorityBadge = (priority: string) => {
  const priorityConfig = {
    low: {
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      label: "Low",
    },
    medium: {
      className:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      label: "Medium",
    },
    high: {
      className:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      label: "High",
    },
    urgent: {
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      label: "Urgent",
    },
  };
  const config = (priorityConfig as any)[priority];
  if (!config) return <Badge variant="secondary">{priority}</Badge>;
  return <Badge className={config.className}>{config.label}</Badge>;
};

const getPerformanceBadge = (rating: Task["performanceRating"]) => {
  if (!rating) return <span className="text-sm text-gray-400">-</span>;
  const map: Record<NonNullable<Task["performanceRating"]>, string> = {
    Excellent:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    Good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Average:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    Lazy: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };
  const cls = map[rating];
  return <Badge className={cls}>{rating}</Badge>;
};

// Timer cell (Start/Pause শুধুই এখানে থাকবে)
interface TaskTimerProps {
  task: Task;
  timerState: TimerState | null;
  onStartTimer: (taskId: string) => void;
  onPauseTimer: (taskId: string) => void;
}

function TaskTimer({
  task,
  timerState,
  onStartTimer,
  onPauseTimer,
}: TaskTimerProps) {
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
  const isOvertime = remainingSeconds <= 0;
  const displayTime = Math.abs(remainingSeconds);

  // NEW: Disallow starting timer for completed / qc_approved / cancelled
  const disallowStart =
    task.status === "completed" ||
    task.status === "qc_approved" ||
    task.status === "cancelled";

  const startTitle =
    task.status === "completed"
      ? "Completed tasks cannot start timer"
      : task.status === "qc_approved"
      ? "QC approved tasks cannot start timer"
      : task.status === "cancelled"
      ? "Cancelled tasks cannot start timer"
      : "Start timer";

  return (
    <div className="flex items-center space-x-3">
      <div className="flex flex-col items-center space-y-2">
        <div
          className={`text-sm font-mono font-bold px-2 py-1 rounded-md ${
            isOvertime
              ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
              : isRunning
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
              : isActive && timerState?.pausedAt
              ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
              : "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800"
          }`}
        >
          {isOvertime && "+"}
          {formatTimerDisplay(displayTime)}
          {isActive && !isRunning && timerState?.pausedAt && (
            <span className="ml-1 text-xs opacity-75">(Paused)</span>
          )}
        </div>
        {isActive && (
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
        )}
      </div>
      <div className="flex space-x-1">
        {!isRunning ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStartTimer(task.id)}
            className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
            disabled={disallowStart}
            title={startTitle}
          >
            <Play className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPauseTimer(task.id)}
            className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/30"
            title="Pause timer"
          >
            <Pause className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Main TaskTable component
export function TaskTable({
  filteredTasks,
  timerState,
  onStartTimer,
  onPauseTimer,
  onCompleteTask,
}: TaskTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
              Task
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
              Status
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
              Priority
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
              Category
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
              Asset
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
              URL
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
              Performance
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
              Duration
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
              Timer
            </th>
            <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider w-[140px]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredTasks.map((task) => {
            const timerStartedForThisTask = timerState?.taskId === task.id; // running or paused
            const isTimerActive =
              timerStartedForThisTask && timerState?.isRunning;

            return (
              <tr
                key={task.id}
                className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors duration-150"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-50 text-sm truncate">
                        {task.name}
                      </h3>
                      {task.comments && task.comments[0]?.text && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                          {task.comments[0].text}
                        </p>
                      )}
                    </div>
                    {isTimerActive && (
                      <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                <td className="py-4 px-4">{getStatusBadge(task.status)}</td>
                <td className="py-4 px-4">{getPriorityBadge(task.priority)}</td>
                <td className="py-4 px-4">
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-50 dark:bg-gray-800"
                  >
                    {task.category?.name || "N/A"}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {task.templateSiteAsset?.name || "N/A"}
                  </span>
                </td>

                <td className="py-4 px-4">
                  {task.templateSiteAsset?.url ? (
                    <div className="max-w-[180px]">
                      <a
                        href={task.templateSiteAsset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate block font-mono"
                        title={task.templateSiteAsset.url}
                      >
                        {task.templateSiteAsset.url}
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      N/A
                    </span>
                  )}
                </td>

                <td className="py-4 px-4">
                  {getPerformanceBadge(task.performanceRating)}
                </td>

                <td className="py-4 px-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {typeof task.actualDurationMinutes === "number"
                      ? `${task.actualDurationMinutes}m`
                      : "-"}
                  </span>
                </td>

                <td className="py-4 px-4">
                  <TaskTimer
                    task={task}
                    timerState={timerState}
                    onStartTimer={onStartTimer}
                    onPauseTimer={onPauseTimer}
                  />
                </td>

                {/* ACTIONS COLUMN (No timer actions here) */}
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {/* Complete: disabled until timer started; also block when qc_approved */}
                    <IconAction
                      title={
                        task.status === "completed"
                          ? "Completed"
                          : task.status === "qc_approved"
                          ? "QC approved tasks cannot be completed again"
                          : timerStartedForThisTask
                          ? "Mark as Completed"
                          : "Start timer to complete"
                      }
                      icon={CheckCircle}
                      disabled={
                        task.status === "completed" ||
                        task.status === "qc_approved" ||
                        !timerStartedForThisTask
                      }
                      onClick={() => onCompleteTask(task)}
                      className={
                        task.status === "completed" ||
                        task.status === "qc_approved"
                          ? "text-emerald-500"
                          : timerStartedForThisTask
                          ? "text-gray-400 hover:text-emerald-500"
                          : "text-gray-300"
                      }
                    />

                    {/* Copy asset URL */}
                    {task.templateSiteAsset?.url ? (
                      <IconAction
                        title="Copy asset URL"
                        icon={Link2}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            task.templateSiteAsset!.url!
                          );
                          toast.success("URL copied to clipboard");
                        }}
                        className="text-gray-400 hover:text-blue-500"
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
