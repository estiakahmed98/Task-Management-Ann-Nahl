// app/agent/agent_tasks/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Link2,
  RefreshCw,
  Download,
  Plus,
  Trash2,
} from "lucide-react";

/* =========================================================
   Types (aligned to your Prisma model)
   ========================================================= */
type TaskStatus =
  | "pending"
  | "in_progress"
  | "overdue"
  | "reassigned"
  | "completed"
  | "qc_approved"
  | "cancelled";

type TaskPriority = "low" | "medium" | "high" | "urgent";
type PerformanceRating = "Excellent" | "Good" | "Average" | "Lazy";

type SCType = "like" | "comment" | "follow" | "share";
type SCEntry = {
  type: SCType;
  url: string;
  notes?: string;
  submittedAt?: string;
};

type Task = {
  id: string;
  name: string;
  priority: TaskPriority;
  dueDate: string | null;
  status: TaskStatus;
  idealDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  performanceRating: PerformanceRating | null;
  completionLink: string | null;
  email: string | null;
  password: string | null;
  username: string | null;
  notes: string | null;
  dataEntryReport: any | null;
  reassignNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;

  qcReview: any | null;
  qcTotalScore: number | null;
  pauseReasons: any | null;
  socialCommunications: any; // will normalize to SCEntry[]

  client?: { id: string; name?: string | null } | null;
  category?: { id: string; name: string } | null;
  templateSiteAsset?: {
    id: number;
    name: string;
    type: string;
    url: string | null;
  } | null;
};

const SC_COOLDOWN_DAYS = 5;

/* =========================================================
   Helpers
   ========================================================= */
const startOfDayISO = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
};
const addDaysISO = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};
const daysUntil = (futureISO?: string | null) => {
  if (!futureISO) return 0;
  const now = new Date();
  const end = new Date(futureISO);
  const ms = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
};
const isHttpUrl = (v: string) => {
  try {
    const u = new URL(v);
    return /^https?:$/.test(u.protocol);
  } catch {
    return false;
  }
};
const fmt = (d?: string | null, fallback = "—") =>
  d ? format(new Date(d), "PPP p") : fallback;

function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    pending: "bg-slate-200 text-slate-700",
    in_progress: "bg-blue-100 text-blue-800",
    overdue: "bg-rose-100 text-rose-800",
    reassigned: "bg-amber-100 text-amber-800",
    completed: "bg-emerald-100 text-emerald-800",
    qc_approved: "bg-purple-100 text-purple-800",
    cancelled: "bg-slate-300 text-slate-700",
  };
  return (
    <Badge className={`${map[status]} border-none`}>
      {status.replace("_", " ")}
    </Badge>
  );
}

/* =========================================================
   Add Links Wizard bits (same UX as list page)
   ========================================================= */
const SC_TYPES = ["like", "comment", "follow", "share"] as const;
type SCRow = { type: (typeof SC_TYPES)[number]; url: string; notes: string };
const makeEmptyRow = (): SCRow => ({ type: "like", url: "", notes: "" });

/* =========================================================
   Page
   ========================================================= */
export default function TaskDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const taskId = params?.id;

  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [sc, setSC] = useState<SCEntry[]>([]);

  // creds UI bits
  const [showPw, setShowPw] = useState<boolean>(false);

  // modal
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<SCRow[]>(
    Array.from({ length: 5 }, makeEmptyRow)
  );
  const [submitting, setSubmitting] = useState(false);

  const nextEligibleAt = useMemo(() => {
    if (!task?.completedAt) return null;
    return addDaysISO(
      startOfDayISO(new Date(task.completedAt)),
      SC_COOLDOWN_DAYS
    );
  }, [task?.completedAt]);
  const coolingDown = !!nextEligibleAt && new Date(nextEligibleAt) > new Date();
  const daysLeft = daysUntil(nextEligibleAt);

  const primaryUrl =
    task?.completionLink?.trim() ||
    task?.templateSiteAsset?.url?.trim() ||
    null;

  /* ---------------- Load task (tries /api/tasks/[id], falls back to agent list) ---------------- */
  const loadTask = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      // session
      const sessRes = await fetch("/api/auth/get-session", {
        cache: "no-store",
      });
      const sess = await sessRes.json();
      const aid = sess?.user?.id as string | undefined;
      if (!aid) throw new Error("No active session");
      setAgentId(aid);

      // try direct endpoint first
      const tryOne = await fetch(`/api/tasks/${taskId}?t=${Date.now()}`, {
        cache: "no-store",
      });
      let t: Task | null = null;
      if (tryOne.ok) {
        t = (await tryOne.json()) as Task;
      } else {
        // fallback: agent tasks → find by id
        const res = await fetch(`/api/tasks/agents/${aid}?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load tasks");
        const payload = await res.json();
        const list: Task[] = (payload?.tasks ?? payload ?? []) as Task[];
        t = list.find((x) => x.id === taskId) ?? null;
      }
      if (!t) throw new Error("Task not found");

      // normalize social comms
      const arr: SCEntry[] = Array.isArray(t.socialCommunications)
        ? (t.socialCommunications as any[])
            .filter((x) => x && typeof x === "object")
            .map((x) => ({
              type: String(x.type || "").toLowerCase() as SCType,
              url: String(x.url || ""),
              notes: typeof x.notes === "string" ? x.notes : "",
              submittedAt: x.submittedAt ? String(x.submittedAt) : undefined,
            }))
            .filter(
              (x) =>
                ["like", "comment", "follow", "share"].includes(x.type) &&
                isHttpUrl(x.url)
            )
        : [];

      // sort newest first
      arr.sort((a, b) => {
        const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return tb - ta;
      });

      setTask(t);
      setSC(arr);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  /* ---------------- Add Links modal logic ---------------- */
  const setRow = (i: number, patch: Partial<SCRow>) =>
    setRows((r) =>
      r.map((row, idx) => (idx === i ? { ...row, ...patch } : row))
    );
  const addRow = () => setRows((r) => [...r, makeEmptyRow()]);
  const removeRow = (i: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));

  const entries = rows
    .filter((r) => r.url.trim() && isHttpUrl(r.url))
    .map((r) => ({
      type: r.type,
      url: r.url.trim(),
      notes: r.notes.trim(),
      submittedAt: new Date().toISOString(),
    }));
  const canNextFrom2 = entries.length > 0;

  const submitAndComplete = async () => {
    if (!task || !taskId) return;
    if (!entries.length) {
      toast.error("Please add at least one valid URL");
      return;
    }
    try {
      setSubmitting(true);

      // Save entries
      const save = await fetch(`/api/tasks/${taskId}/social-communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const saveJson = await save.json().catch(() => ({}));
      if (!save.ok)
        throw new Error(saveJson?.message || "Failed to save links");

      // Mark completed via agent PATCH
      if (!agentId) throw new Error("No agent id");
      const firstUrl = entries[0]?.url ?? null;
      const nowISO = new Date().toISOString();
      const patch = await fetch(`/api/tasks/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status: "completed",
          completedAt: nowISO,
          completionLink: firstUrl,
        }),
      });
      const patchJson = await patch.json().catch(() => ({}));
      if (!patch.ok)
        throw new Error(patchJson?.message || "Failed to complete task");

      toast.success("Saved & task completed");
      setOpen(false);

      // Update local view
      const nextISO = addDaysISO(
        startOfDayISO(new Date(nowISO)),
        SC_COOLDOWN_DAYS
      );
      setTask((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              completedAt: nowISO,
              completionLink: firstUrl,
            }
          : prev
      );
      setSC((prev) => [
        ...entries.map((e) => ({ ...e })),
        ...prev, // prepend newly added
      ]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- CSV export ---------------- */
  const exportCsv = () => {
    if (!sc.length) {
      toast.error("No submissions to export");
      return;
    }
    const header = ["type", "url", "notes", "submittedAt"];
    const lines = [
      header.join(","),
      ...sc.map((r) =>
        [
          r.type,
          `"${(r.url || "").replaceAll('"', '""')}"`,
          `"${(r.notes || "").replaceAll('"', '""')}"`,
          r.submittedAt ? new Date(r.submittedAt).toISOString() : "",
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const fileURL = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = fileURL;
    a.download = `task-${taskId}-social-communications.csv`;
    a.click();
    URL.revokeObjectURL(fileURL);
  };

  /* ---------------- Copy helpers ---------------- */
  const copy = async (label: string, value?: string | null) => {
    if (!value) {
      toast.error(`No ${label} to copy`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  /* ---------------- Render ---------------- */
  if (loading && !task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading task…</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Card>
            <CardContent className="p-6 text-slate-600">
              Task not found.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 lg:p-8">
      <div className="space-y-6 w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{task.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={task.status} />
                <Badge variant="secondary" className="capitalize">
                  Priority: {task.priority}
                </Badge>
                {coolingDown && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-none">
                    Cooling down ({daysLeft}d)
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={loadTask}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Client</CardTitle>
              <CardDescription>Association</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {task.client?.name || "—"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Category</CardTitle>
              <CardDescription>Task Category</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {task.category?.name || "—"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Template Asset</CardTitle>
              <CardDescription>Name & Link</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <div className="truncate">
                  {task.templateSiteAsset?.name || "—"}
                </div>
                {task.templateSiteAsset?.url ? (
                  <Link href={task.templateSiteAsset.url} target="_blank">
                    <Button size="sm" variant="outline">
                      <Link2 className="w-4 h-4 mr-1" />
                      Open
                    </Button>
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timing + metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Timing & Metrics</CardTitle>
            <CardDescription>Due dates and durations</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Due</div>
              <div className="font-medium">{fmt(task.dueDate)}</div>
            </div>
            <div>
              <div className="text-slate-500">Ideal Duration</div>
              <div className="font-medium">
                {task.idealDurationMinutes
                  ? `${task.idealDurationMinutes}m`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Actual Duration</div>
              <div className="font-medium">
                {typeof task.actualDurationMinutes === "number"
                  ? `${task.actualDurationMinutes}m`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Completed At</div>
              <div className="font-medium">{fmt(task.completedAt)}</div>
            </div>
            <div>
              <div className="text-slate-500">Created</div>
              <div className="font-medium">{fmt(task.createdAt)}</div>
            </div>
            <div>
              <div className="text-slate-500">Updated</div>
              <div className="font-medium">{fmt(task.updatedAt)}</div>
            </div>
            <div>
              <div className="text-slate-500">Performance</div>
              <div className="font-medium">{task.performanceRating || "—"}</div>
            </div>
            <div>
              <div className="text-slate-500">QC Score</div>
              <div className="font-medium">{task.qcTotalScore ?? 0}</div>
            </div>
          </CardContent>
        </Card>

        {/* Credentials + completion link */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Agent Access</CardTitle>
            <CardDescription>Credentials and target URL</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-12 gap-2">
              {/* Username */}
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs text-slate-600">Username</label>
                <div className="flex gap-2">
                  <Input readOnly value={task.username ?? ""} placeholder="—" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy("Username", task.username)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs text-slate-600">Email</label>
                <div className="flex gap-2">
                  <Input readOnly value={task.email ?? ""} placeholder="—" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy("Email", task.email)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Password */}
              <div className="col-span-12 md:col-span-4">
                <label className="text-xs text-slate-600">Password</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    type={showPw ? "text" : "password"}
                    value={task.password ?? ""}
                    placeholder="—"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPw((s) => !s)}
                    title={showPw ? "Hide" : "Show"}
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy("Password", task.password)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Completion / Primary URL */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-12 md:col-span-9">
                <label className="text-xs text-slate-600">
                  Primary URL (completionLink / template)
                </label>
                <Input readOnly value={primaryUrl ?? ""} placeholder="—" />
              </div>
              <div className="col-span-12 md:col-span-3 flex gap-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => copy("URL", primaryUrl)}
                  disabled={!primaryUrl}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
                {primaryUrl ? (
                  <Link href={primaryUrl} target="_blank" className="w-full">
                    <Button className="w-full" variant="secondary">
                      <Link2 className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Communications Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Social Communication Submissions
            </CardTitle>
            <CardDescription>
              All links stored in task.socialCommunications
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-slate-600">
                Total: <span className="font-semibold">{sc.length}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(true)}
                  disabled={coolingDown}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Links
                </Button>
                <Button
                  variant="outline"
                  onClick={exportCsv}
                  disabled={!sc.length}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {sc.length === 0 ? (
              <div className="p-6 text-center text-slate-500 border rounded-lg bg-white">
                No submissions yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="text-left px-4 py-2">#</th>
                      <th className="text-left px-4 py-2">Type</th>
                      <th className="text-left px-4 py-2">URL</th>
                      <th className="text-left px-4 py-2">Notes</th>
                      <th className="text-left px-4 py-2">Submitted At</th>
                      <th className="text-left px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sc.map((row, i) => (
                      <tr
                        key={`${row.type}-${row.url}-${i}`}
                        className="border-t"
                      >
                        <td className="px-4 py-2">{i + 1}</td>
                        <td className="px-4 py-2 capitalize">{row.type}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[360px] inline-block align-middle">
                              {row.url}
                            </span>
                            <Link href={row.url} target="_blank">
                              <Button size="sm" variant="outline">
                                <Link2 className="w-4 h-4 mr-1" />
                                Open
                              </Button>
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="whitespace-pre-wrap">
                            {row.notes || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {row.submittedAt
                            ? format(new Date(row.submittedAt), "PPP p")
                            : "—"}
                        </td>
                        <td className="px-4 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copy("URL", row.url)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Links Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[720px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Add Social Links
              </DialogTitle>
              <DialogDescription>
                Like / Comment / Follow / Share links for this task.
              </DialogDescription>
            </DialogHeader>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={step === 1 ? "default" : "secondary"}>
                1. Overview
              </Badge>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <Badge variant={step === 2 ? "default" : "secondary"}>
                2. Add Links
              </Badge>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <Badge variant={step === 3 ? "default" : "secondary"}>
                3. Review
              </Badge>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {step === 1 && (
                <div className="space-y-3">
                  <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-4 text-sm text-blue-900">
                      Default <strong>5 rows</strong> are pre-filled in the next
                      step. You can add or remove rows. Each submission is
                      timestamped.
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-slate-500">Client</div>
                        <div className="font-medium">
                          {task.client?.name || "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Due</div>
                        <div className="font-medium">{fmt(task.dueDate)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Ideal</div>
                        <div className="font-medium">
                          {task.idealDurationMinutes
                            ? `${task.idealDurationMinutes}m`
                            : "—"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  {rows.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 items-start gap-2 rounded-xl border p-3 bg-white"
                    >
                      <div className="col-span-12 md:col-span-3">
                        <label className="text-xs font-medium text-slate-600">
                          Type
                        </label>
                        <Select
                          value={row.type}
                          onValueChange={(v) =>
                            setRow(i, { type: v as SCRow["type"] })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {SC_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t[0].toUpperCase() + t.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <label className="text-xs font-medium text-slate-600">
                          URL
                        </label>
                        <Input
                          placeholder="https://..."
                          value={row.url}
                          onChange={(e) => setRow(i, { url: e.target.value })}
                          className={
                            !row.url || isHttpUrl(row.url)
                              ? ""
                              : "border-red-400"
                          }
                        />
                        {!!row.url && !isHttpUrl(row.url) && (
                          <div className="text-[11px] text-red-600 mt-1">
                            Enter a valid http(s) URL
                          </div>
                        )}
                      </div>

                      <div className="col-span-12 md:col-span-3">
                        <label className="text-xs font-medium text-slate-600">
                          Notes (optional)
                        </label>
                        <Textarea
                          rows={1}
                          value={row.notes}
                          onChange={(e) => setRow(i, { notes: e.target.value })}
                          placeholder="Any note…"
                        />
                      </div>

                      <div className="col-span-12 flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRow(i)}
                          className="h-8"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={addRow}>
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </Button>
                    <div className="text-xs text-slate-500">
                      At least one valid URL is required.
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="p-4 text-sm text-emerald-900">
                      <strong>{entries.length}</strong> valid link
                      {entries.length !== 1 ? "s" : ""} ready to submit.
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-0 divide-y">
                      {entries.map((e, idx) => (
                        <div key={idx} className="p-3 text-sm">
                          <div className="font-medium capitalize">{e.type}</div>
                          <div className="truncate text-slate-700">{e.url}</div>
                          {e.notes && (
                            <div className="text-slate-500 text-xs mt-1">
                              {e.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3)))
                }
                disabled={step === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>

              {step < 3 ? (
                <Button
                  onClick={() =>
                    setStep((s) => (s === 3 ? s : ((s + 1) as 1 | 2 | 3)))
                  }
                  disabled={step === 2 && !canNextFrom2}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={submitAndComplete}
                  disabled={submitting || entries.length === 0 || coolingDown}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  title={
                    coolingDown ? `Available in ${daysLeft} day(s)` : undefined
                  }
                >
                  {submitting ? "Submitting…" : "Save & Complete"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
