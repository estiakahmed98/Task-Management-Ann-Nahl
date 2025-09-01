//app/admin/qc-review/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  Download,
  Eye,
  UserX,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { AnalyticsCards } from "@/components/qc-review/analytics-cards";
import { PerformanceDistribution } from "@/components/qc-review/performance-distribution";
import { FilterSection } from "@/components/qc-review/filter-section";
import { TaskCard } from "@/components/qc-review/task-card";

type AgentLite = {
  id: string;
  name: string | null;
  firstName?: string;
  lastName?: string;
  email: string;
  category?: string;
};

type ClientLite = {
  id: string;
  name: string;
  company?: string;
};

type CategoryLite = {
  id: string;
  name: string;
};

type TaskRow = {
  id: string;
  name: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  completionLink: string | null;
  performanceRating: "Excellent" | "Good" | "Average" | "Lazy" | null;
  idealDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  completionPercentage: number;
  assignedTo: AgentLite | null;
  client: ClientLite | null;
  category: CategoryLite | null;
  assignment?: {
    template?: {
      name: string;
      package?: {
        name: string;
      };
    };
  };
  templateSiteAsset?: {
    name: string;
    type: string;
  };
};

const prettyDate = (d?: string | null) =>
  d ? format(new Date(d), "MMM dd, yyyy HH:mm") : "—";

const performanceConfig = {
  Excellent: {
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300",
    icon: "🏆",
    score: 100,
  },
  Good: {
    color:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300",
    icon: "⭐",
    score: 80,
  },
  Average: {
    color:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300",
    icon: "🎯",
    score: 60,
  },
  Lazy: {
    color:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300",
    icon: "⚠️",
    score: 30,
  },
} as const;

type PerfKey = keyof typeof performanceConfig;

const getDurationEfficiency = (ideal: number | null, actual: number | null) => {
  if (!ideal || !actual) return { percentage: 0, status: "N/A" };
  const efficiency = (ideal / actual) * 100;
  const roundedEfficiency = Math.min(efficiency, 150);

  let status = "Efficient";
  if (roundedEfficiency < 70) {
    status = "Inefficient";
  } else if (roundedEfficiency < 90) {
    status = "Acceptable";
  }

  return {
    percentage: Math.round(roundedEfficiency),
    status: status,
  };
};

export default function QCReview() {
  // -------- Filters --------
  const [agentId, setAgentId] = useState<string>("all");
  const [clientId, setClientId] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [q, setQ] = useState<string>("");

  // -------- Data --------
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [agents, setAgents] = useState<AgentLite[]>([]);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { user } = useUserSession();

  // -------- Approve state --------
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    task: TaskRow | null;
    loading: boolean;
  }>({
    open: false,
    task: null,
    loading: false,
  });

  const [approvedMap, setApprovedMap] = useState<Record<string, boolean>>({});

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", "completed");
      if (agentId !== "all") params.set("assignedToId", agentId);
      if (clientId !== "all") params.set("clientId", clientId);
      if (categoryId !== "all") params.set("categoryId", categoryId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/tasks?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load tasks");
      setTasks(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/tasks/agents", { cache: "no-store" });
      if (res.ok) setAgents(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients", { cache: "no-store" });
      if (res.ok) setClients(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/teams", { cache: "no-store" });
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchClients();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, clientId, categoryId, startDate, endDate]);

  const filtered = useMemo(() => {
    if (!q.trim()) return tasks;
    const needle = q.toLowerCase();
    return tasks.filter((t) => {
      const hay = [
        t.name,
        t.notes ?? "",
        t.completionLink ?? "",
        t.assignedTo?.name ?? "",
        t.assignedTo?.email ?? "",
        t.client?.name ?? "",
        t.category?.name ?? "",
        t.assignment?.template?.name ?? "",
        t.templateSiteAsset?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [q, tasks]);

  const clearFilters = () => {
    setAgentId("all");
    setClientId("all");
    setCategoryId("all");
    setStartDate("");
    setEndDate("");
    setQ("");
  };

  // -------- Analytics (unchanged) --------
  const analytics = useMemo(() => {
    const total = filtered.length;
    const withRatings = filtered.filter((t) => t.performanceRating);
    const withDuration = filtered.filter((t) => t.actualDurationMinutes);

    const avgDuration = withDuration.length
      ? Math.round(
          withDuration.reduce(
            (sum, t) => sum + (t.actualDurationMinutes || 0),
            0
          ) / withDuration.length
        )
      : 0;

    const performanceBreakdown = {
      Excellent: filtered.filter((t) => t.performanceRating === "Excellent")
        .length,
      Good: filtered.filter((t) => t.performanceRating === "Good").length,
      Average: filtered.filter((t) => t.performanceRating === "Average").length,
      Lazy: filtered.filter((t) => t.performanceRating === "Lazy").length,
    };

    const avgPerformanceScore = withRatings.length
      ? Math.round(
          withRatings.reduce(
            (sum, t) =>
              sum +
              (performanceConfig[t.performanceRating as PerfKey]?.score || 0),
            0
          ) / withRatings.length
        )
      : 0;

    const efficiencyTasks = filtered.filter(
      (t) => t.idealDurationMinutes && t.actualDurationMinutes
    );
    const avgEfficiency = efficiencyTasks.length
      ? Math.round(
          efficiencyTasks.reduce(
            (sum, t) =>
              sum +
              (getDurationEfficiency(
                t.idealDurationMinutes,
                t.actualDurationMinutes
              ).percentage || 0),
            0
          ) / efficiencyTasks.length
        )
      : 0;

    return {
      total,
      avgDuration,
      performanceBreakdown,
      avgPerformanceScore,
      avgEfficiency,
      ratedTasks: withRatings.length,
    };
  }, [filtered]);

  const [reassignDialog, setReassignDialog] = useState<{
    open: boolean;
    task: TaskRow | null;
    selectedAgent: string;
    reassignNotes: string;
    loading: boolean;
  }>({
    open: false,
    task: null,
    selectedAgent: "",
    reassignNotes: "",
    loading: false,
  });

  const handleReassignTask = async () => {
    if (!reassignDialog.task) {
      toast.error("No task selected to reassign.");
      return;
    }

    setReassignDialog((prev) => ({ ...prev, loading: true }));

    try {
      const taskId = reassignDialog.task.id;

      const res = await fetch(`/api/tasks/${taskId}/reassign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toAgentId: reassignDialog.task.assignedTo?.id ?? undefined,
          reassignNotes: reassignDialog.reassignNotes || "",
          reassignedById: user?.id,
        }),
      });

      if (!res.ok) {
        let msg = "Failed to reassign task";
        try {
          const data = await res.json();
          msg = data?.message || data?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      await res.json();

      toast.success(
        `Task "${reassignDialog.task.name}" re-assigned to current agent successfully.`
      );

      setReassignDialog({
        open: false,
        task: null,
        selectedAgent: "",
        reassignNotes: "",
        loading: false,
      });

      fetchTasks();
    } catch (error) {
      console.error("Error reassigning task:", error);
      toast.error(
        `Failed to reassign task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setReassignDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const openReassignDialog = (task: TaskRow) => {
    setReassignDialog({
      open: true,
      task,
      selectedAgent: task.assignedTo?.id || "",
      reassignNotes: "",
      loading: false,
    });
  };

  const handleApproveTask = async () => {
    if (!approveDialog.task) return;

    const rating = approveDialog.task.performanceRating; // use existing rating only

    setApproveDialog((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch(
        `/api/tasks/${approveDialog.task.id}/approve`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // send the existing rating (or null) – backend should respect/ignore if null
            performanceRating: rating ?? null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve task");
      }

      await response.json();
      toast.success(
        `Task "${approveDialog.task.name}" approved successfully${
          rating ? ` with ${rating} rating.` : "."
        }`
      );

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === approveDialog.task!.id
            ? { ...task, status: "qc_approved" }
            : task
        )
      );

      setApproveDialog({ open: false, task: null, loading: false });
      setApprovedMap((m) => ({ ...m, [approveDialog.task!.id]: true }));

      fetchTasks();
    } catch (error) {
      console.error("Error approving task:", error);
      toast.error(
        `Failed to approve task: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setApproveDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleReject = (taskId: string) => {
    toast.error(`Task ${taskId} rejected!`);
  };

  const handleApprove = (task: TaskRow) => {
    setApproveDialog({ open: true, task, loading: false });
  };

  return (
    <div className="mx-auto w-full p-6 space-y-8 bg-slate-50/30 dark:bg-slate-950/30 min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            QC Review Dashboard
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Comprehensive quality control review with task reassignment &
            approvals
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={fetchTasks}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <AnalyticsCards analytics={analytics} />

      <PerformanceDistribution analytics={analytics} />

      <FilterSection
        agentId={agentId}
        setAgentId={setAgentId}
        clientId={clientId}
        setClientId={setClientId}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        q={q}
        setQ={setQ}
        agents={agents}
        clients={clients}
        categories={categories}
        filtered={filtered}
        tasks={tasks}
        clearFilters={clearFilters}
      />

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">
                Task Results & Quality Control
              </CardTitle>
              <CardDescription className="text-slate-200 mt-1">
                Review completed tasks, approve or reassign as needed
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Loading tasks...
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="space-y-6">
                {filtered.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    approvedMap={approvedMap}
                    onApprove={handleApprove}
                    onReject={openReassignDialog}
                  />
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <div className="flex flex-col items-center gap-6">
                    <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl">
                      <AlertCircle className="h-16 w-16 text-slate-400 mx-auto" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        No completed tasks found
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Try adjusting your filters to see more results.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal – shows existing rating only */}
      <Dialog
        open={approveDialog.open}
        onOpenChange={(open) => setApproveDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 border-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-6 -m-6 mb-6">
            <DialogHeader className="text-white">
              <DialogTitle className="flex items-center gap-4 text-2xl font-bold">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="text-white">Approve Task</div>
                  <div className="text-emerald-100 text-sm font-normal mt-1">
                    Quality Control Approval
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>

          {approveDialog.task && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 mb-6 border border-emerald-200 dark:border-slate-600">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                    {approveDialog.task.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>
                        Assigned to:{" "}
                        <strong>
                          {approveDialog.task.assignedTo?.name ||
                            approveDialog.task.assignedTo?.email}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>
                      Client: <strong>{approveDialog.task.client?.name}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Category:{" "}
                      <strong>{approveDialog.task.category?.name}</strong>
                    </span>
                  </div>
                  {approveDialog.task.completionLink && (
                    <div className="mt-2">
                      <Button
                        onClick={() =>
                          window.open(
                            approveDialog.task!.completionLink!,
                            "_blank"
                          )
                        }
                        variant="outline"
                        size="sm"
                        className="text-xs bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-0 hover:from-cyan-600 hover:to-teal-600"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Completion
                      </Button>
                    </div>
                  )}
                </div>
                {/* Existing Rating Badge */}
                <div className="flex items-center gap-2">
                  {approveDialog.task.performanceRating ? (
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        performanceConfig[
                          approveDialog.task.performanceRating as PerfKey
                        ].color
                      }`}
                    >
                      {
                        performanceConfig[
                          approveDialog.task.performanceRating as PerfKey
                        ].icon
                      }{" "}
                      {approveDialog.task.performanceRating}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      No performance rating set on this task.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No selector – we only display the existing rating */}

          <DialogFooter className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() =>
                  setApproveDialog((prev) => ({ ...prev, open: false }))
                }
                disabled={approveDialog.loading}
                className="flex-1 sm:flex-none h-11 hover:bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveTask}
                disabled={approveDialog.loading}
                className="flex-1 sm:flex-none h-11 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approveDialog.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving Task...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Task
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog
        open={reassignDialog.open}
        onOpenChange={(open) =>
          setReassignDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 border-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 p-6 -m-6 mb-6">
            <DialogHeader className="text-white">
              <DialogTitle className="flex items-center gap-4 text-2xl font-bold">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <UserX className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="text-white">Reassign Task</div>
                  <div className="text-cyan-100 text-sm font-normal mt-1">
                    Quality Control Management
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>

          {reassignDialog.task && (
            <div className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 mb-6 border border-cyan-200 dark:border-slate-600">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                    {reassignDialog.task.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                      <span>
                        Currently assigned to:{" "}
                        <strong>
                          {reassignDialog.task.assignedTo?.name ||
                            reassignDialog.task.assignedTo?.email}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>
                      Client:{" "}
                      <strong>{reassignDialog.task.client?.name}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Category:{" "}
                      <strong>{reassignDialog.task.category?.name}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {reassignDialog.task.performanceRating && (
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        performanceConfig[
                          reassignDialog.task.performanceRating as PerfKey
                        ]?.color
                      }`}
                    >
                      {
                        performanceConfig[
                          reassignDialog.task.performanceRating as PerfKey
                        ]?.icon
                      }{" "}
                      {reassignDialog.task.performanceRating}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full"></div>
                Assigned Agent (Current)
              </label>
              <Select
                value={reassignDialog.selectedAgent}
                onValueChange={(value) =>
                  setReassignDialog((prev) => ({
                    ...prev,
                    selectedAgent: value,
                  }))
                }
              >
                <SelectTrigger className="h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-500 transition-colors duration-200 rounded-xl">
                  <SelectValue placeholder="Current agent assigned to this task..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                  {reassignDialog.task?.assignedTo && (
                    <SelectItem
                      key={reassignDialog.task.assignedTo.id}
                      value={reassignDialog.task.assignedTo.id}
                      className="hover:bg-cyan-50 dark:hover:bg-cyan-900/20 cursor-pointer py-3 px-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {(
                            reassignDialog.task.assignedTo.name ||
                            reassignDialog.task.assignedTo.firstName ||
                            reassignDialog.task.assignedTo.email
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {reassignDialog.task.assignedTo.name ||
                                `${reassignDialog.task.assignedTo.firstName} ${reassignDialog.task.assignedTo.lastName}`.trim() ||
                                reassignDialog.task.assignedTo.email}
                            </div>
                            <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 text-xs font-medium rounded-full border border-cyan-200 dark:border-cyan-800">
                              Current
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {reassignDialog.task.assignedTo.email}{" "}
                            {reassignDialog.task.assignedTo.category &&
                              `• ${reassignDialog.task.assignedTo.category}`}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                💡 Task will be reassigned to the current agent with updated
                instructions and reset status.
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full"></div>
                Reassignment Notes
              </label>
              <Textarea
                placeholder="Please provide detailed notes for the reassignment. Include any quality issues, additional requirements, or specific instructions for the agent..."
                value={reassignDialog.reassignNotes}
                onChange={(e) =>
                  setReassignDialog((prev) => ({
                    ...prev,
                    reassignNotes: e.target.value,
                  }))
                }
                rows={4}
                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-500 transition-colors duration-200 rounded-xl resize-none"
              />
              <div className="text-xs text-slate-500 dark:text-slate-400">
                These notes will be saved with the task and shared with the
                agent to provide context for the reassignment.
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() =>
                  setReassignDialog((prev) => ({ ...prev, open: false }))
                }
                disabled={reassignDialog.loading}
                className="flex-1 sm:flex-none h-11 hover:bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassignTask}
                disabled={
                  !reassignDialog.selectedAgent || reassignDialog.loading
                }
                className="flex-1 sm:flex-none h-11 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reassignDialog.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reassigning Task...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reassign Task
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
