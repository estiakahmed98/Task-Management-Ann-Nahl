"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutList,
  Search,
  Clock,
  ChevronRight,
  ListTodo,
  ArrowLeft,
  CalendarDays,
  Timer,
  Link2,
  User,
  Bookmark,
  ClipboardCopy,
  Eye,
  EyeOff,
  Filter,
  BarChart3,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitialsFromName, nameToColor } from "@/utils/avatar";
import { toast } from "sonner";
import { Building2, Package } from "lucide-react";

/* =========================
   Types (w/ richer fields)
   ========================= */
type Task = {
  id: string;
  name: string;
  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "overdue"
    | "cancelled"
    | "reassigned"
    | "qc_approved";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
  createdAt: string;
  idealDurationMinutes: number | null;

  completionLink: string | null;
  username: string | null;
  email?: string | null; // <- ensure your API includes these
  password?: string | null; // <-
  notes: string | null;

  clientId: string;
  category?: { name: string } | null;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};

type Summary = {
  total: number;
  countsByStatus: Record<string, number>;
  countsByPriority: Record<string, number>;
  countsByCategory: Record<string, number>;
};

type ClientHeader = {
  id: string;
  name: string;
  company: string | null;
  avatar: string | null;
  status: string | null;
  package: { name: string | null } | null;
};

/* =========================
   Helpers
   ========================= */

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

/** Extract trailing cycle number: “… -1” / “…-1” / “… – 1” etc. */
function extractCycleNumber(name: string): number | null {
  const m = String(name)
    .trim()
    .match(/(?:-|—|\u2013)\s*(\d+)\s*$/);
  if (m && m[1]) return Number(m[1]);
  const m2 = String(name)
    .trim()
    .match(/(?:^|\s)(\d+)$/);
  if (m2 && m2[1]) return Number(m2[1]);
  return null;
}

async function copyToClipboard(v?: string | null, label?: string) {
  if (!v) return;
  try {
    await navigator.clipboard.writeText(v);
    toast.success(label ?? "Copied");
  } catch {
    toast.error("Copy failed");
  }
}

/* Status / priority / category color helpers */
const statusColor = (s: Task["status"]) =>
  ({
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    in_progress: "bg-sky-100 text-sky-800 border-sky-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    overdue: "bg-rose-100 text-rose-800 border-rose-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200",
    reassigned: "bg-purple-100 text-purple-800 border-purple-200",
    qc_approved: "bg-indigo-100 text-indigo-800 border-indigo-200",
  }[s] || "bg-slate-100 text-slate-700 border-slate-200");

const priorityColor = (p: Task["priority"]) =>
  ({
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-blue-100 text-blue-800 border-blue-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    urgent: "bg-red-100 text-red-800 border-red-200",
  }[p] || "bg-slate-100 text-slate-700 border-slate-200");

const categoryColor = (c?: string) =>
  ({
    "Social Activity": "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    "Blog Posting": "bg-cyan-100 text-cyan-800 border-cyan-200",
  }[c ?? ""] || "bg-slate-100 text-slate-700 border-slate-200");

/* Lighter cycle header gradients */
const cycleGrad = (n: number) => {
  const palette = [
    "from-indigo-100 via-fuchsia-100 to-cyan-100",
    "from-emerald-100 via-teal-100 to-cyan-100",
    "from-rose-100 via-orange-100 to-amber-100",
    "from-blue-100 via-violet-100 to-pink-100",
  ];
  return palette[(n - 1) % palette.length];
};

export default function CreatedTasksPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  // UI State
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"dueAsc" | "dueDesc" | "createdDesc">(
    "dueAsc"
  );

  const [showPasswordIds, setShowPasswordIds] = useState<
    Record<string, boolean>
  >({});
  const [expandedCycles, setExpandedCycles] = useState<Record<string, boolean>>(
    {}
  );
  const cyclesNavRef = useRef<HTMLDivElement | null>(null);

  const [client, setClient] = useState<ClientHeader | null>(null);

  // incoming client selection via query param
  const clientId = params.get("clientId") ?? "";

  const fetchClientInfo = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const c = await res.json();
      setClient({
        id: c.id,
        name: c.name ?? "",
        company: c.company ?? null,
        avatar: c.avatar ?? null,
        status: c.status ?? null,
        package: c.package ? { name: c.package.name ?? null } : null,
      });
    } catch {
      // silent: header is optional
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (clientId) qs.set("clientId", clientId);
      if (q.trim()) qs.set("q", q.trim());
      if (status !== "all") qs.set("status", status);
      if (priority !== "all") qs.set("priority", priority);
      if (category !== "all") qs.set("category", category);

      const res = await fetch(`/api/tasks/created?${qs.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`);
      const data = await res.json();

      setTasks(data.tasks || []);
      setSummary(data.summary || null);

      // ✅ Try to grab client from tasks (the route now returns `task.client`)
      if (clientId) {
        const firstWithClient = (data.tasks || []).find(
          (t: any) => t.client
        )?.client;
        if (firstWithClient) {
          setClient({
            id: firstWithClient.id,
            name: firstWithClient.name ?? "",
            company: firstWithClient.company ?? null,
            avatar: firstWithClient.avatar ?? null,
            status: firstWithClient.status ?? null,
            package: firstWithClient.package
              ? { name: firstWithClient.package.name ?? null }
              : null,
          });
        } else {
          // Fallback if there are no tasks yet
          await fetchClientInfo(clientId);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to load tasks");
      setTasks([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    const t = setTimeout(() => fetchTasks(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, priority, category, sort]);

  /* ===== Sort then Group By Cycle ===== */
  const sortedTasks = useMemo(() => {
    const copy = [...tasks];
    if (sort === "dueAsc") {
      copy.sort(
        (a, b) =>
          (new Date(a.dueDate ?? 0).getTime() || 0) -
          (new Date(b.dueDate ?? 0).getTime() || 0)
      );
    } else if (sort === "dueDesc") {
      copy.sort(
        (a, b) =>
          (new Date(b.dueDate ?? 0).getTime() || 0) -
          (new Date(a.dueDate ?? 0).getTime() || 0)
      );
    } else {
      copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return copy;
  }, [tasks, sort]);

  const cycles = useMemo(() => {
    const map = new Map<number, Task[]>();
    const misc: Task[] = [];

    for (const t of sortedTasks) {
      const n = extractCycleNumber(t.name);
      if (n && n > 0) {
        if (!map.has(n)) map.set(n, []);
        map.get(n)!.push(t);
      } else {
        misc.push(t);
      }
    }

    const ordered = Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([cycle, items]) => ({ cycle, items }));

    if (misc.length) ordered.push({ cycle: 0, items: misc });
    return ordered;
  }, [sortedTasks]);

  const allCycleLabels = cycles.map((c) =>
    c.cycle === 0 ? "Misc" : `Cycle ${c.cycle}`
  );
  useEffect(() => {
    setExpandedCycles((prev) => {
      if (Object.keys(prev).length) return prev;
      const init: Record<string, boolean> = {};
      for (const c of cycles) init[String(c.cycle)] = c.cycle <= 1;
      return init;
    });
  }, [cycles]);

  const toggleCycle = (key: number) =>
    setExpandedCycles((s) => ({ ...s, [String(key)]: !s[String(key)] }));

  const goBack = () => router.push("/admin/distribution/client-agent");

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      <div className="container mx-auto p-6 lg:p-8">
        {/* Lighter Header */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-white/90 backdrop-blur">
          <CardHeader className="relative text-slate-800 border-b border-slate-200/60 bg-sky-50">
            <div className="p-6">
              {/* Top-left Back button */}
              <div className="mb-4">
                <Button
                  variant="ghost"
                  onClick={goBack}
                  className="h-9 px-3 -ml-2 text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              {/* Client information (below back button) */}
              {client && (
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-14 w-14 ring-2 ring-slate-200">
                    {client.avatar ? (
                      <AvatarImage src={client.avatar} alt={client.name} />
                    ) : (
                      <AvatarFallback
                        className="text-white font-semibold"
                        style={{ backgroundColor: nameToColor(client.name) }}
                      >
                        {getInitialsFromName(client.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                        {client.name}
                      </h2>

                      {client.status && (
                        <Badge
                          variant="outline"
                          className={`rounded-full text-xs border ${
                            client.status === "active"
                              ? "text-emerald-700 border-emerald-300"
                              : "text-slate-600 border-slate-300"
                          }`}
                        >
                          {client.status}
                        </Badge>
                      )}

                      {client.package?.name && (
                        <Badge
                          variant="outline"
                          className="rounded-full text-xs border border-indigo-300 text-indigo-700"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          {client.package.name}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1.5 text-sm text-slate-600 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="truncate">
                        {client.company || "No company"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Title & subtitle */}
              <div className="space-y-1">
                <CardTitle className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                  <div className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center">
                    <LayoutList className="h-6 w-6 text-slate-700" />
                  </div>
                  Created Tasks — Cycle View
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Top Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search tasks, notes, usernames, links…"
                  className="pl-9 h-11 rounded-xl"
                />
              </div>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="qc_approved">QC Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="reassigned">Reassigned</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Social Activity">
                    Social Activity
                  </SelectItem>
                  <SelectItem value="Blog Posting">Blog Posting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="rounded-xl border-2 border-indigo-100 bg-indigo-50/60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-indigo-700">Total Tasks</div>
                    <div className="text-2xl font-bold text-indigo-900">
                      {summary?.total ?? (loading ? "…" : 0)}
                    </div>
                  </div>
                  <ListTodo className="h-10 w-10 text-indigo-600" />
                </CardContent>
              </Card>

              <Card className="rounded-xl border-2 border-fuchsia-100 bg-fuchsia-50/60">
                <CardContent className="p-4">
                  <div className="text-sm text-fuchsia-700 mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    By Status
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summary ? (
                      Object.entries(summary.countsByStatus).map(([s, n]) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="bg-white text-fuchsia-800 border-fuchsia-200"
                        >
                          {s.replaceAll("_", " ")}:{" "}
                          <span className="ml-1 font-semibold">{n}</span>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-fuchsia-700/70">—</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-2 border-cyan-100 bg-cyan-50/60">
                <CardContent className="p-4">
                  <div className="text-sm text-cyan-700 mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    By Priority
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summary ? (
                      Object.entries(summary.countsByPriority).map(([p, n]) => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="bg-white text-cyan-800 border-cyan-200"
                        >
                          {p}: <span className="ml-1 font-semibold">{n}</span>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-cyan-700/70">—</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-6" />

            {/* Sort Tabs */}
            <Tabs
              value={sort}
              onValueChange={(v) => setSort(v as any)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full rounded-xl">
                <TabsTrigger value="dueAsc">Due Date ↑</TabsTrigger>
                <TabsTrigger value="dueDesc">Due Date ↓</TabsTrigger>
                <TabsTrigger value="createdDesc">Newest First</TabsTrigger>
              </TabsList>

              <TabsContent value={sort} className="mt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
                    <span className="ml-4 text-lg text-slate-600">
                      Loading tasks…
                    </span>
                  </div>
                ) : sortedTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <LayoutList className="h-16 w-16 mx-auto mb-6 text-slate-400" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No tasks found
                    </h3>
                    <p className="text-slate-600">
                      Try adjusting your filters or search.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Quick cycle nav */}
                    <div
                      ref={cyclesNavRef}
                      className="flex flex-wrap gap-2 mb-6"
                    >
                      {cycles.map(({ cycle }, idx) => {
                        const key = String(cycle);
                        const active = expandedCycles[key];
                        const label = cycle === 0 ? "Misc" : `Cycle ${cycle}`;
                        return (
                          <Button
                            key={key}
                            variant={active ? "default" : "outline"}
                            onClick={() => {
                              toggleCycle(Number(key));
                              const el = document.getElementById(
                                `cycle-${key}`
                              );
                              if (el)
                                el.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                            }}
                            className={cn(
                              "h-9 rounded-full",
                              active
                                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                                : ""
                            )}
                          >
                            <Hash className="h-4 w-4 mr-1" />
                            {label}
                          </Button>
                        );
                      })}
                    </div>

                    {/* Cycle sections */}
                    <div className="space-y-10">
                      {cycles.map(({ cycle, items }) => {
                        const open = !!expandedCycles[String(cycle)];
                        const label =
                          cycle === 0 ? "Misc (Unnumbered)" : `Cycle ${cycle}`;

                        // mini-stats for the cycle header
                        const byStatus = items.reduce<Record<string, number>>(
                          (acc, t) => {
                            acc[t.status] = (acc[t.status] ?? 0) + 1;
                            return acc;
                          },
                          {}
                        );
                        const dueMs = items
                          .map((t) =>
                            t.dueDate ? new Date(t.dueDate).getTime() : NaN
                          )
                          .filter((n) => Number.isFinite(n)) as number[];
                        const dueRange =
                          dueMs.length > 0
                            ? `${formatDate(
                                new Date(Math.min(...dueMs)).toISOString()
                              )} – ${formatDate(
                                new Date(Math.max(...dueMs)).toISOString()
                              )}`
                            : "—";

                        return (
                          <section
                            key={cycle}
                            id={`cycle-${cycle}`}
                            className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl"
                          >
                            {/* Lighter Section Header */}
                            <div
                              className={cn(
                                "px-6 py-5 text-slate-800 bg-gradient-to-r",
                                cycleGrad(Math.max(1, cycle))
                              )}
                            >
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white/70 border border-slate-200 flex items-center justify-center">
                                    <Bookmark className="h-5 w-5 text-slate-700" />
                                  </div>
                                  <div>
                                    <div className="text-xl font-bold leading-5">
                                      {label}
                                    </div>
                                    <div className="text-slate-600 text-sm">
                                      {items.length} task
                                      {items.length !== 1 ? "s" : ""} • Due
                                      range: {dueRange}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {Object.entries(byStatus).map(([s, n]) => (
                                    <Badge
                                      key={s}
                                      variant="outline"
                                      className="border border-slate-300 bg-white/70 text-slate-700 capitalize"
                                    >
                                      {s.replaceAll("_", " ")}:{" "}
                                      <span className="ml-1 font-semibold">
                                        {n}
                                      </span>
                                    </Badge>
                                  ))}
                                  <Button
                                    variant="outline"
                                    className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                    onClick={() => toggleCycle(cycle)}
                                  >
                                    {open ? "Collapse" : "Expand"}
                                    <ChevronRight
                                      className={cn(
                                        "h-4 w-4 ml-1 transition-transform",
                                        open && "rotate-90"
                                      )}
                                    />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Section Body */}
                            {open && (
                              <div className="p-6 bg-white">
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                  {items.map((task) => {
                                    const assignee = task.assignedTo;
                                    const showPwd = !!showPasswordIds[task.id];

                                    return (
                                      <Card
                                        key={task.id}
                                        className="group border-2 hover:border-indigo-300 rounded-2xl transition-all bg-white/90"
                                      >
                                        <CardContent className="p-5">
                                          {/* Title & Badges */}
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <Badge
                                                  variant="outline"
                                                  className={cn(
                                                    "border",
                                                    categoryColor(
                                                      task.category?.name
                                                    )
                                                  )}
                                                >
                                                  <Bookmark className="h-3 w-3 mr-1" />
                                                  {task.category?.name ??
                                                    "Uncategorized"}
                                                </Badge>
                                                <Badge
                                                  variant="outline"
                                                  className={cn(
                                                    "border capitalize",
                                                    statusColor(task.status)
                                                  )}
                                                >
                                                  {task.status.replaceAll(
                                                    "_",
                                                    " "
                                                  )}
                                                </Badge>
                                                <Badge
                                                  variant="outline"
                                                  className={cn(
                                                    "border",
                                                    priorityColor(task.priority)
                                                  )}
                                                >
                                                  {task.priority}
                                                </Badge>
                                              </div>
                                              <div
                                                className="font-semibold text-slate-900 text-base truncate"
                                                title={task.name}
                                              >
                                                {task.name}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Meta */}
                                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                              <CalendarDays className="h-4 w-4" />
                                              <span title={task.dueDate ?? ""}>
                                                Due: {formatDate(task.dueDate)}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Clock className="h-4 w-4" />
                                              <span>
                                                Created:{" "}
                                                {formatDate(task.createdAt)}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Timer className="h-4 w-4" />
                                              <span>
                                                Duration:{" "}
                                                {task.idealDurationMinutes ??
                                                  "—"}{" "}
                                                min
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <User className="h-4 w-4" />
                                              {assignee ? (
                                                <span
                                                  className="truncate"
                                                  title={assignee.email ?? ""}
                                                >
                                                  {assignee.name ??
                                                    assignee.email ??
                                                    "—"}
                                                </span>
                                              ) : (
                                                <span>Unassigned</span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Credentials (URL / Username / Email / Password) */}
                                          <div className="mt-4 space-y-2 text-sm">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-slate-500">
                                                URL
                                              </span>
                                              <div className="flex items-center gap-2">
                                                {task.completionLink ? (
                                                  <>
                                                    <a
                                                      href={task.completionLink}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                                                    >
                                                      <Link2 className="h-4 w-4 mr-1" />
                                                      Open
                                                    </a>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8"
                                                      onClick={() =>
                                                        copyToClipboard(
                                                          task.completionLink,
                                                          "URL copied"
                                                        )
                                                      }
                                                      title="Copy URL"
                                                    >
                                                      <ClipboardCopy className="h-4 w-4" />
                                                    </Button>
                                                  </>
                                                ) : (
                                                  <span className="text-slate-400">
                                                    —
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-slate-500">
                                                Username
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className="truncate max-w-[170px]"
                                                  title={task.username ?? ""}
                                                >
                                                  {task.username ?? "—"}
                                                </span>
                                                {task.username && (
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                      copyToClipboard(
                                                        task.username!,
                                                        "Username copied"
                                                      )
                                                    }
                                                    title="Copy username"
                                                  >
                                                    <ClipboardCopy className="h-4 w-4" />
                                                  </Button>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-slate-500">
                                                Email
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className="truncate max-w-[170px]"
                                                  title={task.email ?? ""}
                                                >
                                                  {task.email ?? "—"}
                                                </span>
                                                {task.email && (
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                      copyToClipboard(
                                                        task.email!,
                                                        "Email copied"
                                                      )
                                                    }
                                                    title="Copy email"
                                                  >
                                                    <ClipboardCopy className="h-4 w-4" />
                                                  </Button>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-slate-500">
                                                Password
                                              </span>
                                              <div className="flex items-center gap-2">
                                                {task.password ? (
                                                  <>
                                                    <span className="font-mono">
                                                      {showPwd
                                                        ? task.password
                                                        : "•".repeat(
                                                            Math.min(
                                                              12,
                                                              Math.max(
                                                                6,
                                                                task.password
                                                                  .length
                                                              )
                                                            )
                                                          )}
                                                    </span>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8"
                                                      onClick={() =>
                                                        setShowPasswordIds(
                                                          (s) => ({
                                                            ...s,
                                                            [task.id]:
                                                              !s[task.id],
                                                          })
                                                        )
                                                      }
                                                      title={
                                                        showPwd
                                                          ? "Hide password"
                                                          : "Reveal password"
                                                      }
                                                    >
                                                      {showPwd ? (
                                                        <EyeOff className="h-4 w-4" />
                                                      ) : (
                                                        <Eye className="h-4 w-4" />
                                                      )}
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8"
                                                      onClick={() =>
                                                        copyToClipboard(
                                                          task.password!,
                                                          "Password copied"
                                                        )
                                                      }
                                                      title="Copy password"
                                                    >
                                                      <ClipboardCopy className="h-4 w-4" />
                                                    </Button>
                                                  </>
                                                ) : (
                                                  <span className="text-slate-400">
                                                    —
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Notes */}
                                          {task.notes ? (
                                            <div className="mt-4 text-sm text-slate-700">
                                              <div className="text-slate-500 mb-1">
                                                Notes
                                              </div>
                                              <div className="line-clamp-3">
                                                {task.notes}
                                              </div>
                                            </div>
                                          ) : null}
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
