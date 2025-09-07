// app/qc/tasks/QCReview.tsx

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
} from "lucide-react";
import { toast } from "sonner";
import { useUserSession } from "@/lib/hooks/use-user-session";
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
type ClientLite = { id: string; name: string; company?: string };
type CategoryLite = { id: string; name: string };

// ✅ Optional qc fields added
type QCReviewBlob = {
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
} | null;

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
  assignment?: { template?: { name: string; package?: { name: string } } };
  templateSiteAsset?: { name: string; type: string };

  // ✅ NEW
  qcTotalScore?: number | null;
  qcReview?: QCReviewBlob;
};

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

  // -------- Approve modal (popup before approve) --------
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    task: TaskRow | null;
    loading: boolean;
  }>({ open: false, task: null, loading: false });

  // QC inputs in modal
  const [rating, setRating] = useState<
    "Excellent" | "Good" | "Average" | "Lazy" | undefined
  >(undefined);
  const [scores, setScores] = useState({
    keyword: 0,
    contentQuality: 0,
    image: 0,
    seo: 0,
    grammar: 0,
    humanization: 0,
  });
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
      const r = await fetch("/api/clients", { cache: "no-store" });
      if (r.ok) setClients(await r.json());
    } catch {}
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

  // -------- Helpers for QC scoring preview --------
  const timerScoreFromRating = (
    r?: "Excellent" | "Good" | "Average" | "Lazy"
  ) =>
    r === "Excellent"
      ? 70
      : r === "Good"
      ? 60
      : r === "Average"
      ? 50
      : r === "Lazy"
      ? 40
      : 0;

  const liveTotal = useMemo(() => {
    const t = timerScoreFromRating(rating);
    const m =
      scores.keyword +
      scores.contentQuality +
      scores.image +
      scores.seo +
      scores.grammar +
      scores.humanization;
    return Math.min(100, Math.max(0, t + m));
  }, [rating, scores]);

  // -------- Approve flow (open popup, then submit) --------
  const handleApprove = (task: TaskRow) => {
    setApproveDialog({ open: true, task, loading: false });
    // Prefill rating with agent-side performanceRating if you want; or force QC to choose:
    setRating(undefined); // QC must pick
    setScores({
      keyword: 0,
      contentQuality: 0,
      image: 0,
      seo: 0,
      grammar: 0,
      humanization: 0,
    });
    setQcNotes("");
  };

  const handleApproveTask = async () => {
    if (!approveDialog.task) return;
    if (!rating) {
      toast.error("Please choose a performance rating before approving.");
      return;
    }
    setApproveDialog((p) => ({ ...p, loading: true }));
    try {
      const r = await fetch(`/api/tasks/${approveDialog.task.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          performanceRating: rating,
          keyword: scores.keyword,
          contentQuality: scores.contentQuality,
          image: scores.image,
          seo: scores.seo,
          grammar: scores.grammar,
          humanization: scores.humanization,
          reviewerId: user?.id,
          notes: qcNotes || undefined,
        }),
      });
      if (!r.ok)
        throw new Error((await r.json()).error || "Failed to approve task");
      await r.json();

      toast.success(
        `Task "${approveDialog.task.name}" approved with ${rating}.`
      );
      setApprovedMap((m) => ({ ...m, [approveDialog.task!.id]: true }));
      setApproveDialog({ open: false, task: null, loading: false });
      // Reset local QC inputs
      setRating(undefined);
      setScores({
        keyword: 0,
        contentQuality: 0,
        image: 0,
        seo: 0,
        grammar: 0,
        humanization: 0,
      });
      setQcNotes("");
      fetchTasks();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve task");
      setApproveDialog((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <div className="mx-auto w-full p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">QC Review</h1>
          <p className="text-sm text-gray-600">
            Review completed tasks, approve or reassign
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchTasks}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
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

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-sky-50 to-sky-100 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-gray-700" />
              <CardTitle className="text-base font-medium text-gray-900">
                Task Results
              </CardTitle>
            </div>
            <div className="text-sm text-gray-500">
              {filtered.length} of {tasks.length} tasks
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                <p className="text-gray-500 text-sm">Loading tasks...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((task) => (
                <TaskCard
                  key={task.id}
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
                />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <AlertCircle className="h-10 w-10 text-gray-400" />
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">
                        No completed tasks found
                      </p>
                      <p className="text-gray-500 text-sm">
                        Try adjusting your filters
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal (popup first, then submit) */}
      <Dialog
        open={approveDialog.open}
        onOpenChange={(open) => setApproveDialog((p) => ({ ...p, open }))}
      >
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base">Approve Task</DialogTitle>
          </DialogHeader>

          {approveDialog.task && (
            <div className="space-y-4">
              {/* Task summary */}
              <div className="rounded-md p-3 border bg-gray-50 border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {approveDialog.task.name}
                    </h3>
                    <div className="mt-1 text-sm text-gray-600">
                      <div>
                        Agent:{" "}
                        {approveDialog.task.assignedTo?.name ||
                          approveDialog.task.assignedTo?.email}
                      </div>
                      <div>Client: {approveDialog.task.client?.name}</div>
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
                          className="text-xs h-7"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" /> View
                          Completion
                        </Button>
                      </div>
                    )}
                  </div>
                  {approveDialog.task.performanceRating && (
                    <div className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                      Agent Rating: {approveDialog.task.performanceRating}
                    </div>
                  )}
                </div>
              </div>

              {/* Performance rating (required) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Performance Rating (required)
                </label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={rating ?? ""}
                  onChange={(e) =>
                    setRating(
                      (e.target.value as
                        | "Excellent"
                        | "Good"
                        | "Average"
                        | "Lazy"
                        | "") || undefined
                    )
                  }
                >
                  <option value="" disabled>
                    Choose rating
                  </option>
                  <option value="Excellent">Excellent (≤90%)</option>
                  <option value="Good">Good (≤95%)</option>
                  <option value="Average">Average (≤100%)</option>
                  <option value="Lazy">Lazy (&gt;100%)</option>
                </select>
              </div>

              {/* Manual 6 inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ["keyword", "Keyword (0–5)"],
                  ["contentQuality", "Content Quality (0–5)"],
                  ["image", "Image (0–5)"],
                  ["seo", "SEO (0–5)"],
                  ["grammar", "Grammar (0–5)"],
                  ["humanization", "Humanization (0–5)"],
                ].map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border rounded px-3 py-2"
                  >
                    <label className="text-sm text-gray-700">{label}</label>
                    <select
                      className="text-sm border rounded px-2 py-1"
                      value={scores[key as keyof typeof scores]}
                      onChange={(e) =>
                        setScores((s) => ({
                          ...s,
                          [key]: Math.max(
                            0,
                            Math.min(5, parseInt(e.target.value || "0", 10))
                          ),
                        }))
                      }
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Notes (optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <Textarea
                  rows={3}
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  className="resize-none"
                  placeholder="Add any QC notes…"
                />
              </div>

              {/* Live total & bar */}
              <div className="rounded-md border bg-gray-50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Timer score (auto)</span>
                  <span className="font-medium">
                    {timerScoreFromRating(rating)} / 70
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>Manual (sum)</span>
                  <span className="font-medium">
                    {scores.keyword +
                      scores.contentQuality +
                      scores.image +
                      scores.seo +
                      scores.grammar +
                      scores.humanization}{" "}
                    / 30
                  </span>
                </div>
                <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{ width: `${liveTotal}%` }}
                    aria-label={`QC total score ${liveTotal}%`}
                    title={`QC total score ${liveTotal}%`}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Total: <b>{liveTotal}%</b>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setApproveDialog((p) => ({ ...p, open: false }))}
              disabled={approveDialog.loading}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveTask}
              disabled={approveDialog.loading || !rating}
              size="sm"
            >
              {approveDialog.loading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog
        open={reassignDialog.open}
        onOpenChange={(open) => setReassignDialog((p) => ({ ...p, open }))}
      >
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-base">Reassign Task</DialogTitle>
          </DialogHeader>
          {reassignDialog.task && (
            <div className="rounded-md p-3 mb-4 border bg-gray-50 border-gray-200">
              <div className="space-y-1">
                <h3 className="font-medium text-gray-900">
                  {reassignDialog.task.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Current agent:{" "}
                  {reassignDialog.task.assignedTo?.name ||
                    reassignDialog.task.assignedTo?.email}
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
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
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setReassignDialog((p) => ({ ...p, open: false }))}
              disabled={reassignDialog.loading}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignTask}
              disabled={reassignDialog.loading || !reassignDialog.task}
              size="sm"
            >
              {reassignDialog.loading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
