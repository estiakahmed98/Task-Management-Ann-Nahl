"use client";

import { useEffect, useMemo, useState } from "react";
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
  Loader2,
  RefreshCw,
  Eye,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { FilterSection } from "@/components/qc-review/filter-section";
import { TaskCard } from "@/components/qc-review/task-card";

/* =========================
   Types
========================= */

type AgentLite = {
  id: string;
  name: string | null;
  firstName?: string;
  lastName?: string;
  email: string;
  category?: string;
};
type ClientLite = { id: string; name: string; company?: string };
type CategoryLite = { id: string; name: string };

type Perf = "Excellent" | "Good" | "Average" | "Lazy";

type QCReviewBlob =
  | {
      timerScore: number; // 40..70
      keyword: number; // 0..5
      contentQuality: number; // 0..5
      image: number; // 0..5
      seo: number; // 0..5
      grammar: number; // 0..5
      humanization: number; // 0..5
      total: number; // 0..100
      reviewerId?: string | null;
      reviewedAt?: string;
      notes?: string | null;
    }
  | null;

export type QCScores = {
  keyword: number;
  contentQuality: number;
  image: number;
  seo: number;
  grammar: number;
  humanization: number;
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
  performanceRating: Perf | null;
  idealDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  completionPercentage: number;
  assignedTo: AgentLite | null;
  client: ClientLite | null;
  category: CategoryLite | null;
  assignment?: { template?: { name: string; package?: { name: string } } };
  templateSiteAsset?: { name: string; type: string };

  // QC fields (optional)
  qcTotalScore?: number | null;
  qcReview?: QCReviewBlob;
};

/* =========================
   Helpers
========================= */

const defaultScores: QCScores = {
  keyword: 0,
  contentQuality: 0,
  image: 0,
  seo: 0,
  grammar: 0,
  humanization: 0,
};

const timerScoreFromRating = (r?: Perf | null) =>
  r === "Excellent"
    ? 70
    : r === "Good"
    ? 60
    : r === "Average"
    ? 50
    : r === "Lazy"
    ? 40
    : 0;

// Fallback derive if server forgot to set performanceRating
function derivePerformanceRating(
  ideal?: number | null,
  actual?: number | null
): Perf | undefined {
  if (!ideal || !actual || ideal <= 0) return undefined;
  if (actual <= ideal * 0.9) return "Excellent";
  if (actual <= ideal * 0.95) return "Good";
  if (actual <= ideal) return "Average";
  return "Lazy";
}

/* =========================
   Component
========================= */

export function QCReview() {
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

  // Map of taskId -> current QC star scores (edited in TaskCard)
  const [qcScoresByTask, setQcScoresByTask] = useState<
    Record<string, QCScores>
  >({});

  // -------- Approve modal --------
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    task: TaskRow | null;
    loading: boolean;
  }>({ open: false, task: null, loading: false });

  // Only notes remain in modal
  const [qcNotes, setQcNotes] = useState<string>("");

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
      const r = await fetch("/api/tasks/agents", { cache: "no-store" });
      if (r.ok) setAgents(await r.json());
    } catch {}
  };
  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();

      setClients(Array.isArray(data.clients) ? data.clients : []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients data.");
      setLoading(false);
    }
  };
  const fetchCategories = async () => {
    try {
      const r = await fetch("/api/teams", { cache: "no-store" });
      if (r.ok) setCategories(await r.json());
    } catch {}
  };

  useEffect(() => {
    fetchAgents();
    fetchClients();
    fetchCategories();
  }, []);
  useEffect(() => {
    fetchTasks(); /* eslint-disable-next-line */
  }, [agentId, clientId, categoryId, startDate, endDate]);

  const filtered = useMemo(() => {
    if (!q.trim()) return tasks;
    const needle = q.toLowerCase();
    return tasks.filter((t) =>
      [
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
        .toLowerCase()
        .includes(needle)
    );
  }, [q, tasks]);

  const clearFilters = () => {
    setAgentId("all");
    setClientId("all");
    setCategoryId("all");
    setStartDate("");
    setEndDate("");
    setQ("");
  };

  // -------- Reassign modal --------
  const [reassignDialog, setReassignDialog] = useState<{
    open: boolean;
    task: TaskRow | null;
    reassignNotes: string;
    loading: boolean;
  }>({ open: false, task: null, reassignNotes: "", loading: false });

  const handleReassignTask = async () => {
    if (!reassignDialog.task)
      return toast.error("No task selected to reassign.");
    setReassignDialog((p) => ({ ...p, loading: true }));
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
      if (!res.ok)
        throw new Error(
          (await res.json()).message ?? "Failed to reassign task"
        );
      await res.json();

      // ✅ Activity Log: QC Reassigned (add action)
      try {
        await fetch(`/api/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "task",
            entityId: taskId,
            action: "qc_reassigned", // <<<<<<<<<<<<<<<<<<<<<<<<
            qcReassigned: true, // optional for servers with mapping
            reason: reassignDialog.reassignNotes || undefined,
            userId: user?.id,
            details: {
              taskName: reassignDialog.task.name,
              previousAgentId: reassignDialog.task.assignedTo?.id ?? null,
              previousAgentName:
                reassignDialog.task.assignedTo?.name ||
                reassignDialog.task.assignedTo?.email ||
                null,
              reassignNotes: reassignDialog.reassignNotes || null,
            },
          }),
        });
      } catch (logErr) {
        console.warn("Activity log (qc_reassigned) failed:", logErr);
      }

      toast.success(
        `Task "${reassignDialog.task.name}" re-assigned successfully.`
      );
      setReassignDialog({
        open: false,
        task: null,
        reassignNotes: "",
        loading: false,
      });
      fetchTasks();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reassign task");
      setReassignDialog((p) => ({ ...p, loading: false }));
    }
  };

  // -------- Approve flow --------
  const handleApprove = (task: TaskRow) => {
    setApproveDialog({ open: true, task, loading: false });
    setQcNotes("");
  };

  const handleApproveTask = async () => {
    if (!approveDialog.task) return;

    // System performance rating (auto)
    const sysRating =
      approveDialog.task.performanceRating ??
      derivePerformanceRating(
        approveDialog.task.idealDurationMinutes,
        approveDialog.task.actualDurationMinutes
      );

    if (!sysRating) {
      toast.error(
        "System rating not available (ideal/actual missing). Cannot approve."
      );
      return;
    }

    setApproveDialog((p) => ({ ...p, loading: true }));
    try {
      const scores =
        qcScoresByTask[approveDialog.task.id] ?? { ...defaultScores };

      const total =
        Math.min(
          100,
          timerScoreFromRating(sysRating) +
            scores.keyword +
            scores.contentQuality +
            scores.image +
            scores.seo +
            scores.grammar +
            scores.humanization
        ) || 0;

      const r = await fetch(`/api/tasks/${approveDialog.task.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          performanceRating: sysRating,
          keyword: scores.keyword,
          contentQuality: scores.contentQuality,
          image: scores.image,
          seo: scores.seo,
          grammar: scores.grammar,
          humanization: scores.humanization,
          total,
          reviewerId: user?.id,
          notes: qcNotes || undefined,
        }),
      });
      if (!r.ok)
        throw new Error((await r.json()).error || "Failed to approve task");
      await r.json();

      // ✅ Activity Log: QC Approved (add action)
      try {
        await fetch(`/api/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "task",
            entityId: approveDialog.task.id,
            action: "qc_approved", // <<<<<<<<<<<<<<<<<<<<<<<<
            qcApproved: true, // optional for servers with mapping
            qcNotes: qcNotes || undefined,
            userId: user?.id,
            details: {
              taskName: approveDialog.task.name,
              agentId: approveDialog.task.assignedTo?.id ?? null,
              agentName:
                approveDialog.task.assignedTo?.name ||
                approveDialog.task.assignedTo?.email ||
                null,
              clientId: approveDialog.task.client?.id ?? null,
              clientName: approveDialog.task.client?.name ?? null,
              scores,
              total,
              performanceRating: sysRating,
            },
          }),
        });
      } catch (logErr) {
        console.warn("Activity log (qc_approved) failed:", logErr);
      }

      toast.success(
        `Task "${approveDialog.task.name}" approved. Rating: ${sysRating}.`
      );
      setApprovedMap((m) => ({ ...m, [approveDialog.task!.id]: true }));
      setQcScoresByTask((m) => {
        const next = { ...m };
        delete next[approveDialog.task!.id];
        return next;
      });

      setApproveDialog({ open: false, task: null, loading: false });
      setQcNotes("");
      fetchTasks();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve task");
      setApproveDialog((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <div className="mx-auto w-full p-6 space-y-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                QC Review
              </h1>
              <p className="text-slate-600 font-medium">
                Review completed tasks, approve or reassign with precision
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchTasks}
            disabled={loading}
            variant="outline"
            size="default"
            className="bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Data
          </Button>
        </div>
      </div>

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

      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Task Results
                </CardTitle>
                <CardDescription className="text-slate-600 font-medium">
                  Quality control dashboard for completed tasks
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <Award className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">
                {filtered.length} of {tasks.length} tasks
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-200 rounded-full animate-pulse"></div>
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 absolute top-4 left-4" />
                </div>
                <div className="space-y-2">
                  <p className="text-slate-700 font-medium">Loading tasks...</p>
                  <p className="text-slate-500 text-sm">
                    Please wait while we fetch the latest data
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((task, index) => (
                <div
                  key={task.id}
                  className="animate-in fade-in-0 slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TaskCard
                    task={task}
                    approvedMap={approvedMap}
                    onApprove={handleApprove}
                    onReject={(t) =>
                      setReassignDialog({
                        open: true,
                        task: t,
                        reassignNotes: "",
                        loading: false,
                      })
                    }
                    // ⭐ pass/edit QC star scores here (lives per task)
                    scores={qcScoresByTask[task.id] ?? { ...defaultScores }}
                    onChangeScores={(next) =>
                      setQcScoresByTask((m) => ({ ...m, [task.id]: next }))
                    }
                  />
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <div className="flex flex-col items-center gap-6">
                    <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl">
                      <AlertCircle className="h-12 w-12 text-slate-400" />
                    </div>
                    <div className="space-y-2 max-w-md">
                      <h3 className="text-xl font-semibold text-slate-900">
                        No completed tasks found
                      </h3>
                      <p className="text-slate-600">
                        Try adjusting your filters or check back later for new
                        completed tasks
                      </p>
                    </div>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="mt-2 bg-transparent"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== Approve Dialog (Only notes) ====== */}
      <Dialog
        open={approveDialog.open}
        onOpenChange={(open) => setApproveDialog((p) => ({ ...p, open }))}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-slate-200 shadow-2xl rounded-2xl">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-sm">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Approve Task
              </DialogTitle>
            </div>
          </DialogHeader>

          {approveDialog.task && (
            <div className="space-y-4 py-1">
              {/* Basic task block */}
              <div className="rounded-2xl p-3 border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {approveDialog.task.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-slate-600">Agent:</span>
                        <span className="font-medium text-slate-900">
                          {approveDialog.task.assignedTo?.name ||
                            approveDialog.task.assignedTo?.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-slate-600">Client:</span>
                        <span className="font-medium text-slate-900">
                          {approveDialog.task.client?.name}
                        </span>
                      </div>
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
                          className="bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 transition-all duration-200"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Completion
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes only */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  Additional Notes (Optional)
                </label>
                <Textarea
                  rows={3}
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  className="resize-none border-slate-200 focus:border-blue-300 focus:ring-blue-200 rounded-xl"
                  placeholder="Add any specific feedback or observations about this task..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setApproveDialog((p) => ({ ...p, open: false }))}
              disabled={approveDialog.loading}
              className="bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveTask}
              disabled={approveDialog.loading || !approveDialog.task}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {approveDialog.loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign dialog */}
      <Dialog
        open={reassignDialog.open}
        onOpenChange={(open) => setReassignDialog((p) => ({ ...p, open }))}
      >
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-slate-200 shadow-2xl rounded-2xl">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-sm">
                <RotateCcw className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Reassign Task
              </DialogTitle>
            </div>
          </DialogHeader>
          {reassignDialog.task && (
            <div className="space-y-3">
              <div className="rounded-xl p-3 border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">
                    {reassignDialog.task.name}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Current agent:{" "}
                    <span className="font-medium text-slate-900">
                      {reassignDialog.task.assignedTo?.name ||
                        reassignDialog.task.assignedTo?.email}
                    </span>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Reassignment Notes
                </label>
                <Textarea
                  rows={3}
                  value={reassignDialog.reassignNotes}
                  onChange={(e) =>
                    setReassignDialog((p) => ({
                      ...p,
                      reassignNotes: e.target.value,
                    }))
                  }
                  className="resize-none border-slate-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                  placeholder="Explain why this task needs to be reassigned..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-3 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setReassignDialog((p) => ({ ...p, open: false }))}
              disabled={reassignDialog.loading}
              className="bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignTask}
              disabled={reassignDialog.loading || !reassignDialog.task}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {reassignDialog.loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
