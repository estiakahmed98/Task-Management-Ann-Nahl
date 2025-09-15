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
  Calendar,
  Clock,
  User,
  Building,
  Tag,
  Globe,
  Activity,
  Star,
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
  const map: Record<
    TaskStatus,
    { bg: string; text: string; icon?: React.ReactNode }
  > = {
    pending: { bg: "bg-gradient-to-r from-gray-100 to-gray-200", text: "text-gray-800" },
    in_progress: { bg: "bg-gradient-to-r from-blue-100 to-blue-200", text: "text-blue-800" },
    overdue: { bg: "bg-gradient-to-r from-red-100 to-red-200", text: "text-red-800" },
    reassigned: { bg: "bg-gradient-to-r from-orange-100 to-orange-200", text: "text-orange-800" },
    completed: {
      bg: "bg-gradient-to-r from-emerald-100 to-emerald-200",
      text: "text-emerald-800",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    qc_approved: {
      bg: "bg-gradient-to-r from-purple-100 to-purple-200",
      text: "text-purple-800",
      icon: <Star className="w-4 h-4" />,
    },
    cancelled: { bg: "bg-gradient-to-r from-gray-200 to-gray-300", text: "text-gray-700" },
  };

  const config = map[status];
  return (
    <Badge
      className={`${config.bg} ${config.text} border-none font-semibold px-4 py-2 text-sm shadow-sm`}
    >
      <div className="flex items-center gap-2">
        {config.icon}
        {status.replace("_", " ").toUpperCase()}
      </div>
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, { bg: string; text: string }> = {
    low: { bg: "bg-gradient-to-r from-green-100 to-green-200", text: "text-green-800" },
    medium: { bg: "bg-gradient-to-r from-yellow-100 to-yellow-200", text: "text-yellow-800" },
    high: { bg: "bg-gradient-to-r from-orange-100 to-orange-200", text: "text-orange-800" },
    urgent: { bg: "bg-gradient-to-r from-red-100 to-red-200", text: "text-red-800" },
  };

  const config = map[priority];
  return (
    <Badge
      className={`${config.bg} ${config.text} border-none font-semibold px-4 py-2 text-sm shadow-sm`}
    >
      {priority.toUpperCase()}
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
          <div className="text-slate-700 font-semibold text-lg">
            Loading task details...
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-8 bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-slate-200 text-base px-6 py-3"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-slate-50">
            <CardContent className="p-16 text-center">
              <div className="text-slate-500 mb-4">
                <Building className="w-16 h-16 mx-auto mb-6 text-slate-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Task Not Found
              </h2>
              <p className="text-slate-600 text-lg">
                The requested task could not be located.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 lg:p-10">
      <div className="w-full mx-auto space-y-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-slate-200 text-base px-6 py-3"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Tasks
            </Button>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                {task.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {coolingDown && (
                  <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300 font-semibold px-4 py-2 text-sm shadow-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    Cooldown: {daysLeft}d remaining
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={loadTask}
              className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-slate-200 text-base px-6 py-3"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={exportCsv}
              className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-slate-200 text-base px-6 py-3"
              disabled={!sc.length}
            >
              <Download className="w-5 h-5 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-white to-blue-50 shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-md">
                  <Building className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-700">
                    CLIENT
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    Associated Organization
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xl font-bold text-slate-900">
                {task.client?.name || "No Client Assigned"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-green-50 shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-md">
                  <Tag className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-700">
                    CATEGORY
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    Task Classification
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xl font-bold text-slate-900">
                {task.category?.name || "Uncategorized"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-purple-50 shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-md">
                  <Globe className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-700">
                    TEMPLATE ASSET
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    Resource Link
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-semibold text-slate-900 truncate">
                  {task.templateSiteAsset?.name || "No Asset"}
                </p>
                {task.templateSiteAsset?.url && (
                  <Link href={task.templateSiteAsset.url} target="_blank">
                    <Button size="sm" variant="outline" className="shrink-0 shadow-md hover:shadow-lg transition-shadow">
                      <Link2 className="w-4 h-4 mr-1" />
                      Open
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Metrics */}
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl shadow-md">
                <Activity className="w-6 h-6 text-orange-700" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Task Metrics & Timeline
                </CardTitle>
                <CardDescription className="text-base">
                  Performance data and scheduling information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-base font-semibold text-slate-700">
                  <Calendar className="w-5 h-5" />
                  Due Date
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {fmt(task.dueDate)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-base font-semibold text-slate-700">
                  <Clock className="w-5 h-5" />
                  Ideal Duration
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {task.idealDurationMinutes
                    ? `${task.idealDurationMinutes}m`
                    : "—"}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-base font-semibold text-slate-700">
                  <Clock className="w-5 h-5" />
                  Actual Duration
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {typeof task.actualDurationMinutes === "number"
                    ? `${task.actualDurationMinutes}m`
                    : "—"}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-base font-semibold text-slate-700">
                  <Star className="w-5 h-5" />
                  Performance Rating
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {task.performanceRating || "Not Rated"}
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-base font-semibold text-slate-700">
                  Completed At
                </div>
                <p className="text-base text-slate-800">
                  {fmt(task.completedAt)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-base font-semibold text-slate-700">
                  Created
                </div>
                <p className="text-base text-slate-800">{fmt(task.createdAt)}</p>
              </div>

              <div className="space-y-3">
                <div className="text-base font-semibold text-slate-700">
                  Last Updated
                </div>
                <p className="text-base text-slate-800">{fmt(task.updatedAt)}</p>
              </div>

              <div className="space-y-3">
                <div className="text-base font-semibold text-slate-700">
                  QC Score
                </div>
                <p className="text-base text-slate-800">
                  {task.qcTotalScore ?? "Not Scored"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credentials Section */}
        <Card className="bg-gradient-to-br from-white to-indigo-50 shadow-xl border-0">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl shadow-md">
                <User className="w-6 h-6 text-indigo-700" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Agent Access Credentials
                </CardTitle>
                <CardDescription className="text-base">
                  Login information and target resources
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            {/* Credentials Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-base font-semibold text-slate-800 flex items-center gap-3">
                  <User className="w-5 h-5" />
                  Username
                </label>
                <div className="flex gap-3">
                  <Input
                    readOnly
                    value={task.username ?? ""}
                    placeholder="Not provided"
                    className="bg-slate-50 border-slate-300 text-base py-3"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy("Username", task.username)}
                    className="shrink-0 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-base font-semibold text-slate-800">
                  Email
                </label>
                <div className="flex gap-3">
                  <Input
                    readOnly
                    value={task.email ?? ""}
                    placeholder="Not provided"
                    className="bg-slate-50 border-slate-300 text-base py-3"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy("Email", task.email)}
                    className="shrink-0 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-base font-semibold text-slate-800">
                  Password
                </label>
                <div className="flex gap-3">
                  <Input
                    readOnly
                    type={showPw ? "text" : "password"}
                    value={task.password ?? ""}
                    placeholder="Not provided"
                    className="bg-slate-50 border-slate-300 text-base py-3"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPw((s) => !s)}
                    title={showPw ? "Hide" : "Show"}
                    className="shrink-0 shadow-md hover:shadow-lg transition-shadow"
                  >
                    {showPw ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copy("Password", task.password)}
                    className="shrink-0 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Primary URL Section */}
            <div className="space-y-4 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-inner">
              <label className="text-base font-bold text-slate-800 flex items-center gap-3">
                <Globe className="w-5 h-5" />
                Primary Target URL
              </label>
              <div className="flex gap-4">
                <Input
                  readOnly
                  value={primaryUrl ?? ""}
                  placeholder="No URL provided"
                  className="bg-white border-slate-300 text-base py-3"
                />
                <Button
                  variant="outline"
                  onClick={() => copy("URL", primaryUrl)}
                  disabled={!primaryUrl}
                  className="shrink-0 shadow-md hover:shadow-lg transition-shadow text-base px-6"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Copy
                </Button>
                {primaryUrl && (
                  <Link href={primaryUrl} target="_blank">
                    <Button
                      variant="default"
                      className="shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all text-base px-6"
                    >
                      <Link2 className="w-5 h-5 mr-2" />
                      Open Site
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Communications */}
        <Card className="bg-gradient-to-br from-white to-emerald-50 shadow-xl border-0">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl shadow-md">
                  <Activity className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    Social Communication Submissions
                  </CardTitle>
                  <CardDescription className="text-base">
                    All submitted social media interactions and links
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-base font-semibold px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 shadow-sm"
              >
                {sc.length} total submissions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
              <div className="text-base text-slate-700">
                Track all social media interactions including likes, comments,
                follows, and shares.
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => setOpen(true)}
                  disabled={coolingDown}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all text-base px-6 py-3"
                  title={
                    coolingDown ? `Available in ${daysLeft} day(s)` : undefined
                  }
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Links
                </Button>
                <Button
                  variant="outline"
                  onClick={exportCsv}
                  disabled={!sc.length}
                  className="shadow-lg hover:shadow-xl transition-shadow text-base px-6 py-3"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>

            {sc.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-dashed border-slate-300">
                <Activity className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-700 mb-3">
                  No Submissions Yet
                </h3>
                <p className="text-base text-slate-600 mb-8">
                  Start by adding your social media interaction links.
                </p>
                <Button
                  onClick={() => setOpen(true)}
                  disabled={coolingDown}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all text-base px-6 py-3"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Links
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-base">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-8 py-5 font-bold text-slate-800">
                          #
                        </th>
                        <th className="text-left px-8 py-5 font-bold text-slate-800">
                          Type
                        </th>
                        <th className="text-left px-8 py-5 font-bold text-slate-800">
                          URL
                        </th>
                        <th className="text-left px-8 py-5 font-bold text-slate-800">
                          Notes
                        </th>
                        <th className="text-left px-8 py-5 font-bold text-slate-800">
                          Submitted
                        </th>
                        <th className="text-left px-8 py-5 font-bold text-slate-800">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sc.map((row, i) => (
                        <tr
                          key={`${row.type}-${row.url}-${i}`}
                          className="hover:bg-slate-50 transition-colors duration-200"
                        >
                          <td className="px-8 py-5 text-slate-700 font-semibold">
                            {i + 1}
                          </td>
                          <td className="px-8 py-5">
                            <Badge
                              variant="secondary"
                              className="capitalize font-semibold text-sm px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800"
                            >
                              {row.type}
                            </Badge>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <span className="text-slate-800 font-mono text-sm bg-slate-100 px-3 py-2 rounded-lg truncate max-w-xs">
                                {row.url}
                              </span>
                              <Link href={row.url} target="_blank">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0 shadow-md hover:shadow-lg transition-shadow"
                                >
                                  <Link2 className="w-4 h-4 mr-1" />
                                  Visit
                                </Button>
                              </Link>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-slate-700 text-sm bg-slate-50 px-3 py-2 rounded-lg">
                              {row.notes || "No notes"}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-slate-700">
                            {row.submittedAt
                              ? format(
                                  new Date(row.submittedAt),
                                  "MMM dd, yyyy 'at' h:mm a"
                                )
                              : "—"}
                          </td>
                          <td className="px-8 py-5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copy("URL", row.url)}
                              className="hover:bg-slate-100 shadow-md hover:shadow-lg transition-shadow"
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Links Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50">
            <DialogHeader className="border-b border-slate-100 pb-6">
              <DialogTitle className="text-3xl font-bold text-slate-900">
                Add Social Media Links
              </DialogTitle>
              <DialogDescription className="text-base text-slate-700">
                Submit your social media interactions for this task. Each link
                will be timestamped automatically.
              </DialogDescription>
            </DialogHeader>

            {/* Progress Indicator */}
            <div className="flex items-center gap-3 py-6">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-base font-bold transition-all duration-300 shadow-md ${
                      step === stepNum
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                        : step > stepNum
                        ? "bg-gradient-to-r from-green-100 to-green-200 text-green-700"
                        : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-500"
                    }`}
                  >
                    {step > stepNum ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-16 h-1 mx-3 rounded-full transition-colors duration-300 ${
                        step > stepNum ? "bg-gradient-to-r from-green-200 to-green-300" : "bg-gradient-to-r from-slate-200 to-slate-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="max-h-[50vh] overflow-y-auto pr-3">
              {step === 1 && (
                <div className="space-y-8">
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-lg">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-md">
                          <Activity className="w-6 h-6 text-blue-700" />
                        </div>
                        <div>
                          <h3 className="font-bold text-blue-900 mb-3 text-lg">
                            Ready to Add Links
                          </h3>
                          <p className="text-blue-800 text-base leading-relaxed">
                            You'll have 5 pre-configured rows in the next step,
                            but you can add or remove rows as needed. Each
                            submission will be automatically timestamped when
                            saved.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Task Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <div className="text-base text-slate-600">Client</div>
                        <div className="font-bold text-slate-900 text-lg">
                          {task.client?.name || "No Client"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-base text-slate-600">Due Date</div>
                        <div className="font-bold text-slate-900 text-lg">
                          {fmt(task.dueDate)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-base text-slate-600">Duration</div>
                        <div className="font-bold text-slate-900 text-lg">
                          {task.idealDurationMinutes
                            ? `${task.idealDurationMinutes} minutes`
                            : "Not specified"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-base text-slate-700 mb-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                    <strong>Tip:</strong> Make sure all URLs are valid and start
                    with http:// or https://
                  </div>

                  {rows.map((row, i) => (
                    <Card
                      key={i}
                      className="p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-slate-50"
                    >
                      <div className="grid grid-cols-12 gap-6 items-start">
                        <div className="col-span-12 md:col-span-3">
                          <label className="text-base font-bold text-slate-800 mb-3 block">
                            Interaction Type
                          </label>
                          <Select
                            value={row.type}
                            onValueChange={(v) =>
                              setRow(i, { type: v as SCRow["type"] })
                            }
                          >
                            <SelectTrigger className="text-base py-3">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {SC_TYPES.map((t) => (
                                <SelectItem key={t} value={t} className="text-base">
                                  <span className="capitalize font-semibold">
                                    {t}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <label className="text-base font-bold text-slate-800 mb-3 block">
                            Social Media URL *
                          </label>
                          <Input
                            placeholder="https://social-platform.com/post-or-profile-link"
                            value={row.url}
                            onChange={(e) => setRow(i, { url: e.target.value })}
                            className={`text-base py-3 ${
                              !row.url || isHttpUrl(row.url)
                                ? ""
                                : "border-red-400 focus:border-red-400"
                            }`}
                          />
                          {!!row.url && !isHttpUrl(row.url) && (
                            <div className="text-sm text-red-600 mt-2 flex items-center gap-2">
                              <span>⚠️</span> Please enter a valid URL starting
                              with http:// or https://
                            </div>
                          )}
                        </div>

                        <div className="col-span-12 md:col-span-3">
                          <label className="text-base font-bold text-slate-800 mb-3 block">
                            Notes (Optional)
                          </label>
                          <Textarea
                            rows={2}
                            value={row.notes}
                            onChange={(e) =>
                              setRow(i, { notes: e.target.value })
                            }
                            placeholder="Additional context..."
                            className="resize-none text-base"
                          />
                          <div className="flex justify-end mt-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeRow(i)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 shadow-md hover:shadow-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRow}
                      className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200 hover:from-green-100 hover:to-green-200 shadow-lg hover:shadow-xl transition-all text-base px-6 py-3"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Another Row
                    </Button>
                    <div className="text-base text-slate-600 font-semibold">
                      {entries.length} valid URL
                      {entries.length !== 1 ? "s" : ""} ready
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-lg">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-md">
                          <CheckCircle className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                          <h3 className="font-bold text-green-900 mb-3 text-lg">
                            Ready to Submit
                          </h3>
                          <p className="text-green-800 text-base">
                            <strong>{entries.length}</strong> valid social media
                            link{entries.length !== 1 ? "s" : ""}
                            ready for submission. This will also mark the task
                            as completed.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">
                        Submission Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-slate-100">
                      {entries.map((e, idx) => (
                        <div key={idx} className="py-6 first:pt-0">
                          <div className="flex items-start justify-between gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant="secondary"
                                  className="capitalize text-sm font-semibold bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800"
                                >
                                  {e.type}
                                </Badge>
                                <span className="text-base font-bold text-slate-900">
                                  #{idx + 1}
                                </span>
                              </div>
                              <p className="text-base text-slate-700 font-mono bg-slate-50 px-3 py-2 rounded-lg truncate">
                                {e.url}
                              </p>
                              {e.notes && (
                                <p className="text-sm text-slate-600 italic">
                                  "{e.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between items-center pt-8 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() =>
                  setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3)))
                }
                disabled={step === 1}
                className="flex items-center gap-3 text-base px-6 py-3 shadow-md hover:shadow-lg transition-shadow"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </Button>

              {step < 3 ? (
                <Button
                  onClick={() =>
                    setStep((s) => (s === 3 ? s : ((s + 1) as 1 | 2 | 3)))
                  }
                  disabled={step === 2 && !canNextFrom2}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center gap-3 text-base px-6 py-3 shadow-lg hover:shadow-xl transition-all"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  onClick={submitAndComplete}
                  disabled={submitting || entries.length === 0 || coolingDown}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 min-w-[160px] text-base px-6 py-3 shadow-lg hover:shadow-xl transition-all"
                >
                  {submitting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Save & Complete
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}