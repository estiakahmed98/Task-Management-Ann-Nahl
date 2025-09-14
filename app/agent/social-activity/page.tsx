"use client";

import { useEffect, useMemo, useState } from "react";
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
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Plus,
  Trash2,
} from "lucide-react";

/* =========================================================
   Types (adjust to your actual Task type if needed)
   ========================================================= */
type TaskStatus =
  | "pending"
  | "in_progress"
  | "overdue"
  | "reassigned"
  | "completed"
  | "qc_approved"
  | "cancelled";

type Task = {
  id: string;
  name: string;
  status: TaskStatus;
  dueDate?: string | null;
  idealDurationMinutes?: number | null;
  client?: { id: string; name?: string | null } | null;
  category?: { id: string; name: string } | null;
};

const isSocialCommunication = (t: Partial<Task>) =>
  ((t.category?.name ?? (t as any).categoryName ?? "") as string)
    .toLowerCase()
    .trim() === "social communication";

/* =========================================================
   Social Communication Modal
   ========================================================= */
const SC_TYPES = ["like", "comment", "follow", "share"] as const;
type SCRow = { type: (typeof SC_TYPES)[number]; url: string; notes: string };

function makeEmptyRow(): SCRow {
  return { type: "like", url: "", notes: "" };
}

function isHttpUrl(v: string) {
  try {
    const u = new URL(v);
    return /^https?:$/.test(u.protocol);
  } catch {
    return false;
  }
}

function StepPill({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`px-2.5 py-1 rounded-full text-sm font-medium ${
        active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
      }`}
    >
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    pending: "bg-slate-200 text-slate-700",
    in_progress: "bg-blue-100 text-blue-800",
    overdue: "bg-rose-100 text-rose-800",
    reassigned: "bg-amber-100 text-amber-800",
    completed: "bg-emerald-100 text-emerald-800",
    qc_approved: "bg-emerald-200 text-emerald-900",
    cancelled: "bg-slate-300 text-slate-700",
  };
  return (
    <Badge className={`${map[status]} border-none`}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function SocialCommunicationTasksPage() {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");

  // Modal state
  const [open, setOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<SCRow[]>(
    Array.from({ length: 5 }, makeEmptyRow)
  );
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- Fetch tasks (SC category only) ---------------- */
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        // 1) who am I?
        const sessRes = await fetch("/api/auth/get-session", {
          cache: "no-store",
        });
        const sess = await sessRes.json();
        const agentId = sess?.user?.id as string | undefined;
        if (!agentId) throw new Error("No active session");

        // 2) get only this agent’s tasks from your existing endpoint
        const res = await fetch(
          `/api/tasks/agents/${agentId}?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );
        if (!res.ok) throw new Error("Failed to fetch agent tasks");
        const payload = await res.json();

        // 3) hard-filter to the exact category "Social Communication"
        const list: Task[] = (payload?.tasks ?? payload ?? []) as Task[];
        const onlySC = list.filter(isSocialCommunication);

        if (mounted) setTasks(onlySC);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load Social Communication tasks for you.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------- Filtering ---------------- */
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    return (tasks || [])
      .filter(isSocialCommunication) // enforce again
      .filter((t) => {
        const okStatus =
          statusFilter === "all" ? true : (t as any).status === statusFilter;
        const hay = `${t.name} ${t.client?.name ?? ""}`.toLowerCase();
        const okQuery = !q || hay.includes(q);
        return okStatus && okQuery;
      });
  }, [tasks, query, statusFilter]);

  /* ---------------- Modal handlers ---------------- */
  const openForTask = (t: Task) => {
    setCurrentTask(t);
    setRows(Array.from({ length: 5 }, makeEmptyRow));
    setStep(1);
    setOpen(true);
  };

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
    if (!currentTask) return;
    if (!entries.length) {
      toast.error("Please add at least one valid URL");
      return;
    }

    try {
      setSubmitting(true);

      // 1) Save entries to the task
      // TODO: আপনার social-communications API রুট নিশ্চিত করুন
      const save = await fetch(
        `/api/tasks/${currentTask.id}/social-communications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries }),
        }
      );
      const saveJson = await save.json().catch(() => ({}));
      if (!save.ok) {
        throw new Error(saveJson?.message || "Failed to save links");
      }

      // 2) Mark task complete (existing behavior—adjust endpoint if needed)
      // যদি আপনার সিস্টেমে অন্য রকম এন্ডপয়েন্ট থাকে, এটুকু বদলাবেন
      const complete = await fetch(`/api/tasks/${currentTask.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // চাইলে প্রথম URL টাকে completionLink হিসেবে পাঠাতে পারেন
        body: JSON.stringify({ completionLink: entries[0]?.url }),
      });
      const completeJson = await complete.json().catch(() => ({}));
      if (!complete.ok) {
        throw new Error(completeJson?.message || "Failed to complete task");
      }

      toast.success("Saved & task completed");
      setOpen(false);

      // refresh list
      setTasks((prev) =>
        prev.map((t) =>
          t.id === currentTask.id ? { ...t, status: "completed" } : t
        )
      );
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-3 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Social Communication Tasks
            </h1>
            <p className="text-sm text-slate-600">
              Submit Like / Comment / Follow / Share links directly from here.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    placeholder="Search by task/client..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                  />
                  <ListFilter className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="w-full md:w-56">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="reassigned">Reassigned</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="qc_approved">QC Approved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="p-10 text-center text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-slate-500">
              No Social Communication tasks found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <Card
                key={t.id}
                className="group hover:shadow-lg transition-all border-slate-200"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-5">
                      {t.name}
                    </CardTitle>
                    <StatusBadge status={t.status} />
                  </div>
                  <CardDescription className="mt-1">
                    {t.client?.name ? (
                      <>
                        <span className="text-slate-600">Client: </span>
                        <span className="font-medium">{t.client.name}</span>
                      </>
                    ) : (
                      <span className="text-slate-500">No client</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div>
                      <span className="text-slate-500">Due: </span>
                      {t.dueDate ? format(new Date(t.dueDate), "PPP") : "—"}
                    </div>
                    {t.idealDurationMinutes ? (
                      <div>
                        <span className="text-slate-500">Ideal: </span>
                        {t.idealDurationMinutes}m
                      </div>
                    ) : (
                      <div className="text-slate-400">No timer</div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => openForTask(t)}
                      disabled={
                        t.status === "completed" || t.status === "qc_approved"
                      }
                    >
                      Submit Links
                    </Button>
                    <Link href={`/tasks/${t.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Open Task
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: 3-step wizard */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[720px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {currentTask?.name || "Social Communication"}
              </DialogTitle>
              <DialogDescription>
                Add Like / Comment / Follow / Share links for this task.
              </DialogDescription>
            </DialogHeader>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-2">
              <StepPill active={step === 1}>1. Overview</StepPill>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <StepPill active={step === 2}>2. Add Links</StepPill>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <StepPill active={step === 3}>3. Review & Submit</StepPill>
            </div>

            {/* Scrollable body */}
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
                    <CardContent className="p-4 text-sm">
                      <div className="flex justify-between">
                        <div>
                          <div className="text-slate-500">Client</div>
                          <div className="font-medium">
                            {currentTask?.client?.name || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Due</div>
                          <div className="font-medium">
                            {currentTask?.dueDate
                              ? format(new Date(currentTask.dueDate), "PPP")
                              : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Ideal</div>
                          <div className="font-medium">
                            {currentTask?.idealDurationMinutes
                              ? `${currentTask.idealDurationMinutes}m`
                              : "—"}
                          </div>
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
                              : "border-red-400 focus-visible:ring-red-400"
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
                  disabled={submitting || entries.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
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
