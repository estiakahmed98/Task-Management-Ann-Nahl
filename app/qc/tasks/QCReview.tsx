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
  Star,
  TrendingUp,
  Clock,
  Award,
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

type Perf = "Excellent" | "Good" | "Average" | "Lazy";

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

/* ----------------------------
   Small helper components
----------------------------- */

function StarRating({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  id?: string;
}) {
  const [hoverValue, setHoverValue] = useState<number>(0);

  return (
    <div className="group flex items-center justify-between bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl px-3 py-2 transition-all duration-200 hover:shadow-md hover:border-slate-300">
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 select-none"
      >
        {label}
      </label>
      <div
        id={id}
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label={label}
        onMouseLeave={() => setHoverValue(0)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const active = i <= (hoverValue || value);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i === value ? i - 1 : i)}
              onMouseEnter={() => setHoverValue(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                  e.preventDefault();
                  onChange(Math.min(5, value + 1));
                } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                  e.preventDefault();
                  onChange(Math.max(0, value - 1));
                }
              }}
              className="p-1 outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95"
              role="radio"
              aria-checked={active}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-4 w-4 transition-all duration-200 ${
                  active
                    ? "text-amber-400 drop-shadow-sm"
                    : "text-slate-300 hover:text-amber-200"
                }`}
                fill={active ? "currentColor" : "none"}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------
   Utility scoring helpers
----------------------------- */

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

  // -------- Approve modal --------
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    task: TaskRow | null;
    loading: boolean;
  }>({ open: false, task: null, loading: false });

  // Auto-picked system rating (read-only in UI)
  const [rating, setRating] = useState<Perf | undefined>(undefined);

  // 6 manual dimensions via stars
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

  // -------- Live QC total --------
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

  // -------- Approve flow --------
  const handleApprove = (task: TaskRow) => {
    setApproveDialog({ open: true, task, loading: false });

    // Pick system-provided rating automatically (read-only)
    const sysRating =
      task.performanceRating ??
      derivePerformanceRating(
        task.idealDurationMinutes,
        task.actualDurationMinutes
      );

    setRating(sysRating);
    if (!sysRating) {
      toast.warning(
        "No performance rating found from system. Please ensure the task has ideal & actual durations."
      );
    }

    // reset stars & notes
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
      toast.error("System rating not available. Cannot approve.");
      return;
    }
    setApproveDialog((p) => ({ ...p, loading: true }));
    try {
      const r = await fetch(`/api/tasks/${approveDialog.task.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ✅ auto performance rating (system)
          performanceRating: rating,
          // ✅ star ratings (0..5)
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
        `Task "${approveDialog.task.name}" approved. Rating: ${rating}.`
      );
      setApprovedMap((m) => ({ ...m, [approveDialog.task!.id]: true }));
      setApproveDialog({ open: false, task: null, loading: false });
      // reset local state
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

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div className="text-center">
                      <div className="text-xs font-medium text-blue-600">
                        System Rating
                      </div>
                      <div className="text-sm font-bold text-blue-700">
                        {rating ?? "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-slate-700">
                      Timer Score (Auto-calculated)
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-700">
                      {timerScoreFromRating(rating)}
                    </div>
                    <div className="text-xs text-amber-600">out of 70</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Quality Assessment
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <StarRating
                    label="Keyword Optimization"
                    value={scores.keyword}
                    onChange={(v) => setScores((s) => ({ ...s, keyword: v }))}
                    id="qc-keyword"
                  />
                  <StarRating
                    label="Content Quality"
                    value={scores.contentQuality}
                    onChange={(v) =>
                      setScores((s) => ({ ...s, contentQuality: v }))
                    }
                    id="qc-content"
                  />
                  <StarRating
                    label="Image Quality"
                    value={scores.image}
                    onChange={(v) => setScores((s) => ({ ...s, image: v }))}
                    id="qc-image"
                  />
                  <StarRating
                    label="SEO Optimization"
                    value={scores.seo}
                    onChange={(v) => setScores((s) => ({ ...s, seo: v }))}
                    id="qc-seo"
                  />
                  <StarRating
                    label="Grammar & Style"
                    value={scores.grammar}
                    onChange={(v) => setScores((s) => ({ ...s, grammar: v }))}
                    id="qc-grammar"
                  />
                  <StarRating
                    label="Humanization"
                    value={scores.humanization}
                    onChange={(v) =>
                      setScores((s) => ({ ...s, humanization: v }))
                    }
                    id="qc-human"
                  />
                </div>
              </div>

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

              <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-emerald-50 to-green-50 p-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">
                      Manual Assessment Score
                    </span>
                    <span className="text-lg font-bold text-emerald-700">
                      {scores.keyword +
                        scores.contentQuality +
                        scores.image +
                        scores.seo +
                        scores.grammar +
                        scores.humanization}{" "}
                      / 30
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${liveTotal}%` }}
                        aria-label={`QC total score ${liveTotal}%`}
                        title={`QC total score ${liveTotal}%`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Total QC Score</span>
                      <span className="font-bold text-emerald-700 text-lg">
                        {liveTotal}%
                      </span>
                    </div>
                  </div>
                </div>
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
              disabled={approveDialog.loading || !rating}
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
              Reassign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
