//app/components/client-tasks-view.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Timer,
  TrendingUp,
  RefreshCw,
  Activity,
  List,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2,Grid3X3 } from "lucide-react";
import { DriveImageGallery } from "./drive-image-gallery";

// Import all the existing interfaces and components from the original dashboard
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

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  cancelled: number;
  reassigned: number;
  qc_approved: number;
}

interface TimerState {
  taskId: string;
  remainingSeconds: number;
  isRunning: boolean;
  totalSeconds: number;
  isGloballyLocked: boolean;
  lockedByAgent?: string;
  startedAt?: number; // Added timestamp for accurate tracking
}

interface GlobalTimerLock {
  isLocked: boolean;
  taskId: string | null;
  agentId: string | null;
  taskName: string | null;
}

interface ClientTasksViewProps {
  clientId: string;
  clientName: string;
  agentId: string;
  onBack: () => void;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

// Utility Functions
const formatTimerDisplay = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// Badge Components
const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: {
      className:
        "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 border-slate-300 dark:border-slate-700",
      icon: Clock,
      label: "Pending", // Neutral
    },
    in_progress: {
      className:
        "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-800",
      icon: Play,
      label: "In Progress", // Blue = action
    },
    completed: {
      className:
        "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
      icon: CheckCircle,
      label: "Completed", // Emerald = success/done
    },
    qc_approved: {
      className:
        "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-800",
      icon: ShieldCheck,
      label: "QC Approved", // Purple = authority/trust (distinct from green)
    },
    overdue: {
      className:
        "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-800",
      icon: AlertCircle,
      label: "Overdue", // Red = critical
    },
    cancelled: {
      className:
        "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700",
      icon: XCircle,
      label: "Cancelled", // Gray = inactive
    },
    reassigned: {
      className:
        "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-800",
      icon: RefreshCw,
      label: "Reassigned", // Amber = change/attention
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
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
  const config = priorityConfig[priority as keyof typeof priorityConfig];
  if (!config) return <Badge variant="secondary">{priority}</Badge>;
  return <Badge className={config.className}>{config.label}</Badge>;
};



// Added both default and named export for ClientTasksView
export function ClientTasksView({
  clientId,
  clientName,
  agentId,
  onBack,
}: ClientTasksViewProps) {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [globalTimerLock, setGlobalTimerLock] = useState<GlobalTimerLock>({
    isLocked: false,
    taskId: null,
    agentId: null,
    taskName: null,
  });
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    cancelled: 0,
    reassigned: 0,
    qc_approved: 0,
  });

  // Dialog states
  const [isCompletionConfirmOpen, setIsCompletionConfirmOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [completionLink, setCompletionLink] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  // Add these state variables after the existing ones
  const [isBulkCompletionOpen, setIsBulkCompletionOpen] = useState(false);
  const [bulkCompletionLink, setBulkCompletionLink] = useState("");
  const [clientData, setClientData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);

  const [loadingAgents, setLoadingAgents] = useState(false);

  // API Functions
  const fetchClientTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch client data with imageDrivelink from the agent route
      const agentResponse = await fetch(`/api/tasks/clients/agents/${agentId}`);
      if (!agentResponse.ok) {
        throw new Error(`HTTP error! status: ${agentResponse.status}`);
      }
      const agentData = await agentResponse.json();

      // Find the current client in the agent's clients
      const currentClient = agentData.find(
        (client: any) => client.id === clientId
      );
      if (currentClient) {
        setClientData(currentClient);
      }

      // Fetch tasks for this specific client
      const response = await fetch(`/api/tasks/client/${clientId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Task[] = await response.json();

      // Filter tasks for this specific agent
      const agentTasks = data.filter((task) => task.assignedTo?.id === agentId);
      setTasks(agentTasks);

      // Calculate stats with proper overdue detection
      const now = new Date();
      const stats = {
        total: agentTasks.length,
        pending: agentTasks.filter((task) => task.status === "pending").length,
        inProgress: agentTasks.filter((task) => task.status === "in_progress")
          .length,
        completed: agentTasks.filter((task) => task.status === "completed")
          .length,
        overdue: agentTasks.filter(
          (task) =>
            task.status === "overdue" ||
            (task.dueDate &&
              new Date(task.dueDate) < now &&
              task.status !== "completed")
        ).length,
        cancelled: agentTasks.filter((task) => task.status === "cancelled")
          .length,
        reassigned: agentTasks.filter((task) => task.status === "reassigned")
          .length,
        qc_approved: agentTasks.filter((task) => task.status === "qc_approved")
          .length,
      };
      setStats(stats);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch client tasks.";
      setError(errorMessage);
      console.error("Failed to fetch client tasks:", err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clientId, agentId]);

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: any) => {
      try {
        const response = await fetch(`/api/tasks/agents/${agentId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ taskId, ...updates }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const updatedTask = await response.json();

        // Update local state with the response from server
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, ...updatedTask } : task
          )
        );

        return updatedTask;
      } catch (err: any) {
        console.error("Failed to update task:", err);
        throw err;
      }
    },
    [agentId]
  );

  // Add timer management functions after handleUpdateSelectedTasks
  const saveTimerToStorage = useCallback(
    (timer: TimerState | null) => {
      try {
        if (timer) {
          const timerData = {
            ...timer,
            savedAt: Date.now(),
            agentId: agentId,
          };
          localStorage.setItem("taskTimer", JSON.stringify(timerData));
          const lockState: GlobalTimerLock = {
            isLocked: timer.isRunning,
            taskId: timer.isRunning ? timer.taskId : null,
            agentId: timer.isRunning ? agentId : null,
            taskName: timer.isRunning
              ? tasks.find((t) => t.id === timer.taskId)?.name || null
              : null,
          };
          localStorage.setItem("globalTimerLock", JSON.stringify(lockState));
          setGlobalTimerLock(lockState);
        } else {
          localStorage.removeItem("taskTimer");
          localStorage.removeItem("globalTimerLock");
          setGlobalTimerLock({
            isLocked: false,
            taskId: null,
            agentId: null,
            taskName: null,
          });
        }
      } catch (error) {
        console.error("Failed to save timer to storage:", error);
      }
    },
    [agentId, tasks]
  );

  const loadTimerFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem("taskTimer");
      const lockSaved = localStorage.getItem("globalTimerLock");

      if (saved) {
        const timerData = JSON.parse(saved);

        let adjustedRemainingSeconds = timerData.remainingSeconds;
        if (timerData.isRunning) {
          const elapsedSeconds = Math.floor(
            (Date.now() - (timerData.savedAt || Date.now())) / 1000
          );
          adjustedRemainingSeconds = Math.max(
            0,
            timerData.remainingSeconds - elapsedSeconds
          );
        }

        const timer: TimerState = {
          taskId: timerData.taskId,
          remainingSeconds: adjustedRemainingSeconds,
          isRunning: timerData.isRunning,
          totalSeconds: timerData.totalSeconds,
          isGloballyLocked: timerData.isGloballyLocked,
          lockedByAgent: timerData.lockedByAgent,
          startedAt: timerData.startedAt || Date.now(),
        };

        setTimerState(timer);

        if (lockSaved) {
          const lockState = JSON.parse(lockSaved) as GlobalTimerLock;
          setGlobalTimerLock(lockState);
        }

        const task = tasks.find((t) => t.id === timer.taskId);
        if (timer.isRunning) {
          toast.info(
            `Timer restored for "${
              task?.name || "Unknown Task"
            }". Continuing from where you left off.`
          );
        } else {
          toast.info(
            `Paused timer restored for "${
              task?.name || "Unknown Task"
            }". Click play to continue.`
          );
        }

        return timer;
      }
    } catch (error) {
      console.error("Failed to load timer from storage:", error);
    }
    return null;
  }, [tasks]);

  const isTaskDisabled = useCallback(
    (_taskId: string) => {
      return false;
    },
    [globalTimerLock]
  );

  const isAnyTimerRunning = globalTimerLock.isLocked;
  const isBackButtonDisabled = isAnyTimerRunning;

  const handleStartTimer = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task?.idealDurationMinutes) return;

      try {
        // Update task status to in_progress when starting timer
        await handleUpdateTask(taskId, { status: "in_progress" });

        const existingTimer = timerState?.taskId === taskId ? timerState : null;
        // FIX: minutes -> seconds
        const totalSeconds = task.idealDurationMinutes * 60;

        const remainingSeconds =
          existingTimer?.remainingSeconds ?? totalSeconds;

        const newTimer: TimerState = {
          taskId,
          remainingSeconds,
          isRunning: true,
          totalSeconds,
          isGloballyLocked: true,
          lockedByAgent: agentId,
          startedAt: Date.now(),
        };

        setTimerState(newTimer);
        saveTimerToStorage(newTimer);
        toast.success(
          `Timer started for "${task.name}". Back to clients navigation is now disabled.`
        );
      } catch (error) {
        toast.error("Failed to start timer");
      }
    },
    [
      tasks,
      timerState,
      saveTimerToStorage,
      handleUpdateTask,
      globalTimerLock,
      agentId,
    ]
  );

  const handlePauseTimer = useCallback(
    (taskId: string) => {
      if (timerState?.taskId === taskId) {
        const updatedTimer = {
          ...timerState,
          isRunning: false,
          isGloballyLocked: false,
        };
        setTimerState(updatedTimer);
        saveTimerToStorage(updatedTimer);

        const task = tasks.find((t) => t.id === taskId);
        toast.info(
          `Timer paused for "${task?.name}". All tasks are now unlocked.`
        );
      }
    },
    [timerState, tasks, saveTimerToStorage]
  );

  const handleResetTimer = useCallback(
    (taskId: string) => {
      if (timerState?.taskId === taskId) {
        const task = tasks.find((t) => t.id === taskId);
        if (!task?.idealDurationMinutes) return;

        const totalSeconds = task.idealDurationMinutes * 60;
        const updatedTimer: TimerState = {
          taskId,
          remainingSeconds: totalSeconds,
          isRunning: false,
          totalSeconds,
          isGloballyLocked: false,
        };
        setTimerState(updatedTimer);
        saveTimerToStorage(null); // Clear global lock when resetting

        toast.info(
          `Timer reset for "${task?.name}". All tasks are now unlocked.`
        );
      }
    },
    [timerState, tasks, saveTimerToStorage]
  );

  // Update the handleTaskCompletion function to properly calculate overtime duration
  const handleTaskCompletion = useCallback(async () => {
    if (!taskToComplete) return;

    try {
      let actualDurationMinutes = taskToComplete.actualDurationMinutes;

      if (
        timerState?.taskId === taskToComplete.id &&
        taskToComplete.idealDurationMinutes
      ) {
        // Calculate actual time used based on timer state
        const totalTimeUsedSeconds =
          timerState.totalSeconds - timerState.remainingSeconds;
        actualDurationMinutes = Math.ceil(totalTimeUsedSeconds / 60);

        // Ensure minimum of 1 minute if any time was used
        if (actualDurationMinutes < 1 && totalTimeUsedSeconds > 0) {
          actualDurationMinutes = 1;
        }

        // Enhanced completion feedback with precise timing
        const idealMinutes = taskToComplete.idealDurationMinutes;
        const actualMinutes = actualDurationMinutes;

        if (timerState.remainingSeconds <= 0) {
          // Task went overtime
          const overtimeSeconds = Math.abs(timerState.remainingSeconds);
          const overtimeDisplay = formatTimerDisplay(overtimeSeconds);

          toast.success(
            `Task "${taskToComplete.name}" completed with overtime!`,
            {
              description: `Ideal: ${formatDuration(
                idealMinutes
              )}, Actual: ${formatDuration(
                actualMinutes
              )} (+${overtimeDisplay} overtime)`,
              duration: 5000,
            }
          );
        } else {
          // Task completed within time
          const savedTime = formatTimerDisplay(timerState.remainingSeconds);
          toast.success(
            `Task "${taskToComplete.name}" completed ahead of schedule!`,
            {
              description: `Completed in ${formatDuration(
                actualMinutes
              )} (${savedTime} saved)`,
              duration: 5000,
            }
          );
        }
      } else {
        toast.success(`Task "${taskToComplete.name}" marked as completed!`);
      }

      const updates: any = {
        status: "completed",
        completedAt: new Date().toISOString(),
      };

      // Add completion details if provided
      if (completionLink?.trim()) {
        updates.completionLink = completionLink.trim();
      }
      if (username?.trim()) {
        updates.username = username.trim();
      }
      if (email?.trim()) {
        updates.email = email.trim();
      }
      if (password?.trim()) {
        updates.password = password;
      }

      // Update actual duration
      if (typeof actualDurationMinutes === "number") {
        updates.actualDurationMinutes = actualDurationMinutes;
      }

      await handleUpdateTask(taskToComplete.id, updates);

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskToComplete.id
            ? { ...task, ...updates, actualDurationMinutes }
            : task
        )
      );

      // Stop and clear timer
      if (timerState?.taskId === taskToComplete.id) {
        setTimerState(null);
        saveTimerToStorage(null);
        toast.info("Timer stopped. All tasks are now available.");
      }

      setIsCompletionConfirmOpen(false);
      setTaskToComplete(null);
      setCompletionLink("");
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Failed to complete task:", error);
      toast.error("Failed to complete task. Please try again.");
    }
  }, [
    taskToComplete,
    timerState,
    completionLink,
    username,
    email,
    password,
    saveTimerToStorage,
  ]);

  const handleCompletionCancel = useCallback(() => {
    setIsCompletionConfirmOpen(false);
    setTaskToComplete(null);
    setCompletionLink(""); // Reset completion link
  }, []);

  // Replace the existing handleUpdateSelectedTasks function
  const handleUpdateSelectedTasks = useCallback(
    async (
      action: "completed" | "pending" | "reassigned",
      completionLink?: string
    ) => {
      if (action === "completed") {
        // For single task completion, show individual confirmation
        const tasksToComplete = selectedTasks
          .map((id) => tasks.find((t) => t.id === id))
          .filter(
            (task): task is Task =>
              task !== undefined && task.status !== "completed"
          );

        if (tasksToComplete.length === 1) {
          // Single task - use individual completion modal
          setTaskToComplete(tasksToComplete[0]);
          setIsCompletionConfirmOpen(true);
          return;
        } else if (tasksToComplete.length > 1) {
          // Multiple tasks - use bulk completion modal
          setIsBulkCompletionOpen(true);
          return;
        }
      }

      // Continue with the rest of the existing logic for pending status or actual completion
      setIsUpdating(true);
      try {
        let successCount = 0;
        let errorCount = 0;

        for (const taskId of selectedTasks) {
          try {
            const updates: any = { status: action };

            if (action === "completed") {
              updates.completedAt = new Date().toISOString();

              if (completionLink && completionLink.trim()) {
                updates.completionLink = completionLink.trim();
              }

              // Calculate actual duration if timer was running for this task
              const task = tasks.find((t) => t.id === taskId);
              if (timerState?.taskId === taskId && task?.idealDurationMinutes) {
                const totalTimeUsedSeconds =
                  timerState.totalSeconds - timerState.remainingSeconds;
                const actualDurationMinutes = Math.ceil(
                  totalTimeUsedSeconds / 60
                );

                if (actualDurationMinutes > 0) {
                  updates.actualDurationMinutes = actualDurationMinutes;
                }
              }
            }

            await handleUpdateTask(taskId, updates);

            // Update local state immediately
            setTasks((prevTasks) =>
              prevTasks.map((task) =>
                task.id === taskId ? { ...task, ...updates } : task
              )
            );

            successCount++;

            // Stop timer if completing this task
            if (action === "completed" && timerState?.taskId === taskId) {
              setTimerState(null);
              saveTimerToStorage(null);
            }
          } catch (error) {
            errorCount++;
            console.error(`Failed to update task ${taskId}:`, error);
          }
        }

        if (successCount > 0) {
          toast.success(
            `Successfully updated ${successCount} task${
              successCount !== 1 ? "s" : ""
            } to ${action === "completed" ? "completed" : action}`
          );
        }
        if (errorCount > 0) {
          toast.error(
            `Failed to update ${errorCount} task${errorCount !== 1 ? "s" : ""}`
          );
        }
        setSelectedTasks([]);
        setIsStatusModalOpen(false);
        setIsBulkCompletionOpen(false);
        setBulkCompletionLink("");
      } catch (err: any) {
        console.error("Failed to update tasks:", err);
        toast.error("Failed to update tasks. Please try again.");
      } finally {
        setIsUpdating(false);
      }
    },
    [selectedTasks, handleUpdateTask, tasks, timerState, saveTimerToStorage]
  );

  const handleBulkCompletion = useCallback(() => {
    handleUpdateSelectedTasks("completed", bulkCompletionLink);
  }, [handleUpdateSelectedTasks, bulkCompletionLink]);

  const handleBulkCompletionCancel = useCallback(() => {
    setIsBulkCompletionOpen(false);
    setBulkCompletionLink("");
  }, []);

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.templateSiteAsset?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      if (a.status === "reassigned" && b.status !== "reassigned") return -1;
      if (b.status === "reassigned" && a.status !== "reassigned") return 1;
      return 0;
    });

  // Update the overdueCount calculation to be consistent
  const overdueCount = tasks.filter(
    (task) =>
      task.status === "overdue" ||
      (task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "completed")
  ).length;

  // Effects
  useEffect(() => {
    fetchClientTasks();
  }, [fetchClientTasks]);

  useEffect(() => {
    const now = new Date();
    const newStats = {
      total: tasks.length,
      pending: tasks.filter((task) => task.status === "pending").length,
      inProgress: tasks.filter((task) => task.status === "in_progress").length,
      completed: tasks.filter((task) => task.status === "completed").length,
      overdue: tasks.filter(
        (task) =>
          task.status === "overdue" ||
          (task.dueDate &&
            new Date(task.dueDate) < now &&
            task.status !== "completed")
      ).length,
      cancelled: tasks.filter((task) => task.status === "cancelled").length,
      reassigned: tasks.filter((task) => task.status === "reassigned").length,
      qc_approved: tasks.filter((task) => task.status === "qc_approved").length,
    };
    setStats(newStats);
  }, [tasks]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState?.isRunning) {
      interval = setInterval(() => {
        setTimerState((prev) => {
          if (!prev || !prev.isRunning) return prev;

          const newRemainingSeconds = prev.remainingSeconds - 1;
          const updatedTimer = {
            ...prev,
            remainingSeconds: newRemainingSeconds,
          };

          if (newRemainingSeconds === 0) {
            const task = tasks.find((t) => t.id === prev.taskId);
            if (task && task.status === "in_progress") {
              handleUpdateTask(prev.taskId, { status: "overdue" })
                .then(() => {
                  toast.warning(`Task "${task.name}" is now overdue!`, {
                    description: "Timer has exceeded the ideal duration",
                    duration: 4000,
                  });
                })
                .catch(() => {
                  console.error("[v0] Failed to update task status to overdue");
                });
            }
          }

          // Save to storage every 5 seconds or when going into overtime
          if (newRemainingSeconds % 5 === 0 || newRemainingSeconds === 0) {
            saveTimerToStorage(updatedTimer);
          }

          return updatedTimer;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState?.isRunning, saveTimerToStorage, tasks, handleUpdateTask]);

  // Load timer on component mount
  useEffect(() => {
    if (tasks.length > 0) {
      loadTimerFromStorage();
    }
  }, [tasks, loadTimerFromStorage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Loading tasks...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto">
            <Activity className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-red-600 dark:text-red-400">
              Error: {error}
            </p>
            <Button
              onClick={fetchClientTasks}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Add TaskTimer component
  interface TaskTimerProps {
    task: Task;
    timerState: TimerState | null;
    onStartTimer: (taskId: string) => void;
    onPauseTimer: (taskId: string) => void;
    onResetTimer: (taskId: string) => void;
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
              onClick={() => {
                setTaskToComplete(task);
                setIsCompletionConfirmOpen(true);
              }}
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

  const onBackToClients = () => {
    if (isAnyTimerRunning) {
      toast.error(
        "Cannot navigate back while a timer is running. Please pause or complete the task first."
      );
      return;
    }
    onBack();
  };

  // Small helper for performance badge
  const getPerformanceBadge = (rating: Task["performanceRating"]) => {
    if (!rating) return <span className="text-sm text-gray-400">-</span>;
    const map: Record<
      NonNullable<Task["performanceRating"]>,
      { label: string; cls: string }
    > = {
      Excellent:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      Good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      Average:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      Lazy: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    } as any;

    const cls = (map as any)[rating] as string;
    return <Badge className={cls}>{rating}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onBackToClients}
              disabled={isBackButtonDisabled}
              className={`hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl p-3 ${
                isBackButtonDisabled
                  ? "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent"
                  : ""
              }`}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Clients
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                {clientName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Task Management Dashboard
              </p>
            </div>
          </div>
          <Button
            onClick={fetchClientTasks}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Tasks
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {tasks.length}
              </div>
              <p className="text-xs text-blue-100 mt-1">All assigned tasks</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">
                Completed
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {tasks.filter((task) => task.status === "completed").length}
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                {/* {completionRate}% completion rate */}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">
                In Progress
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Play className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {tasks.filter((task) => task.status === "in_progress").length}
              </div>
              <p className="text-xs text-amber-100 mt-1">
                Currently working on
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                Overdue
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {overdueCount}
              </div>
              <p className="text-xs text-red-100 mt-1">
                Need immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {clientData?.imageDrivelink && (
          <DriveImageGallery
            driveLink={clientData.imageDrivelink}
            clientName={clientName}
          />
        )}
        {/* Task Management Card */}
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
                  placeholder="Search tasks by name, category, or asset..."
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
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
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
                            selectedTasks.length === filteredTasks.length &&
                            filteredTasks.length > 0
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTasks(
                                filteredTasks
                                  .filter((task) => task.status !== "completed")
                                  .map((task) => task.id)
                              );
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
                      <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                        Asset
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-gray-50">
                        URL
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

                      return (
                        <tr
                          key={task.id}
                          className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                            isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                        >
                          <td className="py-4 px-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTasks([...selectedTasks, task.id]);
                                } else {
                                  setSelectedTasks(
                                    selectedTasks.filter((id) => id !== task.id)
                                  );
                                }
                              }}
                              disabled={task.status === "completed"}
                              className={
                                task.status === "completed"
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
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
                              {isTimerActive && (
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

                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {task.templateSiteAsset?.name || "N/A"}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            {task.templateSiteAsset?.url ? (
                              <span className="text-sm text-blue-600 dark:text-blue-400 font-mono break-all">
                                {task.templateSiteAsset.url}
                              </span>
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
                              onStartTimer={handleStartTimer}
                              onPauseTimer={handlePauseTimer}
                              onResetTimer={handleResetTimer}
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
                  const isThisTaskDisabled = isTaskDisabled(task.id);

                  return (
                    <div
                      key={task.id}
                      className={`group relative bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 hover:shadow-lg ${
                        isSelected
                          ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      } ${isThisTaskDisabled ? "opacity-50" : ""}`}
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4 w-full">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTasks([...selectedTasks, task.id]);
                              } else {
                                setSelectedTasks(
                                  selectedTasks.filter((id) => id !== task.id)
                                );
                              }
                            }}
                            disabled={
                              isThisTaskDisabled || task.status === "completed"
                            }
                            className={
                              isThisTaskDisabled || task.status === "completed"
                                ? "cursor-not-allowed"
                                : ""
                            }
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-lg truncate">
                                {task.name}
                              </h3>
                              {isTimerActive && (
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
                              {/* Performance */}
                              {getPerformanceBadge(task.performanceRating)}
                              {/* Duration */}
                              <Badge variant="outline" className="text-xs">
                                {typeof task.actualDurationMinutes === "number"
                                  ? `${task.actualDurationMinutes} min`
                                  : "-"}
                              </Badge>
                            </div>
                            {task.templateSiteAsset?.name && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <span className="font-medium">Asset:</span>{" "}
                                {task.templateSiteAsset?.name}
                              </p>
                            )}
                            {task.templateSiteAsset?.url && (
                              <div className="mb-2">
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    URL:
                                  </span>
                                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-mono break-all">
                                    {task.templateSiteAsset.url}
                                  </span>
                                </div>
                              </div>
                            )}
                            {task.comments && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {task.comments[0]?.text}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="w-full flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                          <TaskTimer
                            task={task}
                            timerState={timerState}
                            onStartTimer={handleStartTimer}
                            onPauseTimer={handlePauseTimer}
                            onResetTimer={handleResetTimer}
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
                      onClick={() => setIsStatusModalOpen(true)}
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
                Mark this task as completed and optionally provide a completion
                link.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> Once marked as completed, you won't
                  be able to edit this task anymore.
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
                      {formatTimerDisplay(
                        Math.abs(timerState.remainingSeconds)
                      )}
                      {timerState.remainingSeconds <= 0 && " (Overtime)"}
                    </p>
                  )}
                </div>
              )}

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
                  UserName
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Provide a link to the completed work, deliverable, or proof of
                  completion.
                </p>
              </div>
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
        {/* Bulk Task Completion Dialog */}
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
                  <strong>Warning:</strong> Once marked as completed, you won't
                  be able to edit these tasks anymore.
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
                  This link will be applied to all selected tasks. Provide a
                  link to the completed work or deliverable.
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
 
      </div>
    </div>
  );
}
