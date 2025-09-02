"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Timer,
  CheckCircle2,
  RotateCcw,
  Gauge,
  BarChart3,
  Users,
  Activity,
  ChevronDown,
} from "lucide-react";

// ---------- Types (loose, aligned to your API) ----------
export type AnyTask = any;

// ---------- Helpers shared with your ProfessionalDashboard ----------
const numberFmt = (n: number | string) =>
  Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    typeof n === "string" ? Number(n) : n
  );

const titleCase = (s: string) =>
  String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const STATUS_COLOR: Record<string, string> = {
  completed: "bg-emerald-500",
  qc_approved: "bg-teal-500",
  in_progress: "bg-blue-500",
  pending: "bg-amber-500",
  reassigned: "bg-violet-500",
  overdue: "bg-red-500",
  cancelled: "bg-slate-500",
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

// ---------- Metric Card (design-matched) ----------
function MetricCard({
  title,
  value,
  change,
  trend,
  description,
  icon,
  gradient = "from-blue-500 to-cyan-500",
  subMetric,
}: {
  title: string;
  value: string | number;
  change?: string | number;
  trend?: "up" | "down";
  description?: string;
  icon: React.ReactNode;
  gradient?: string;
  subMetric?: string;
}) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-0 rounded-2xl bg-gradient-to-br from-white to-slate-50/60 backdrop-blur-sm group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "p-3 rounded-xl text-white shadow-md",
              "bg-gradient-to-r",
              gradient
            )}
          >
            {icon}
          </div>
          {typeof change !== "undefined" && trend && (
            <Badge
              variant="outline"
              className={cn(
                "font-medium group-hover:shadow-sm",
                trend === "up"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              )}
            >
              {change}
            </Badge>
          )}
        </div>
        <div className="mt-5">
          <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
          <p className="text-sm text-slate-600 mt-1 font-medium">{title}</p>
        </div>
        {(description || subMetric) && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-500">{description}</p>
            {subMetric && (
              <p className="text-xs text-slate-400 font-medium">{subMetric}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Date Range Controls ----------

type RangeType = "today" | "7" | "30" | "custom";

function RangeControls({
  range,
  setRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
}: {
  range: RangeType;
  setRange: (v: RangeType) => void;
  customStart: string;
  setCustomStart: (v: string) => void;
  customEnd: string;
  setCustomEnd: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select value={range} onValueChange={(v: RangeType) => setRange(v)}>
        <SelectTrigger className="w-44 h-9 border-slate-300 bg-white/80 backdrop-blur">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {range === "custom" && (
        <div className="flex items-end gap-2">
          <div className="grid gap-1">
            <Label htmlFor="start" className="text-xs">
              Start
            </Label>
            <Input
              id="start"
              type="date"
              className="h-9"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="end" className="text-xs">
              End
            </Label>
            <Input
              id="end"
              type="date"
              className="h-9"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main ----------
export default function QCDashboardPro({ tasks = [] }: { tasks: AnyTask[] }) {
  // --- helpers
  const now = new Date();
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  const fmt = (d?: string | Date | null) =>
    d ? new Date(d).toLocaleString() : "—";

  const isOverdue = (t: AnyTask) => {
    const due = t?.dueDate ? new Date(t.dueDate) : null;
    const pendingish = ["pending", "reassigned"].includes(
      String(t?.status ?? "")
    );
    return !!(due && pendingish && due.getTime() < now.getTime());
  };

  // --- Date range filter
  const [range, setRange] = useState<RangeType>("today");
  const [customStart, setCustomStart] = useState<string>(toISODate(now));
  const [customEnd, setCustomEnd] = useState<string>(toISODate(now));

  const { start, end } = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (range === "7") {
      start.setDate(start.getDate() - 6);
    } else if (range === "30") {
      start.setDate(start.getDate() - 29);
    } else if (range === "custom") {
      const s = new Date(customStart || toISODate(new Date()));
      const e = new Date(customEnd || toISODate(new Date()));
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    return { start, end };
  }, [range, customStart, customEnd]);

  // Primary timestamp: updatedAt → completedAt → createdAt
  const withinRange = (t: AnyTask) => {
    const stamp = new Date(
      t?.updatedAt ?? t?.completedAt ?? t?.createdAt ?? now
    );
    return stamp >= start && stamp <= end;
  };

  const rangedTasks = useMemo(
    () => tasks.filter(withinRange),
    [tasks, start.getTime(), end.getTime()]
  );

  // --- derived metrics
  const metrics = useMemo(() => {
    const total = rangedTasks.length;
    const pending = rangedTasks.filter((t) => t.status === "pending").length;
    const qcApproved = rangedTasks.filter((t) => t.status === "qc_approved").length;
    const completed = rangedTasks.filter((t) => t.status === "completed").length;
    const overdue = rangedTasks.filter((t) => isOverdue(t)).length;
    const completedToday = rangedTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt).toDateString() === now.toDateString()
    ).length;
    const reassignCount = rangedTasks.filter((t) => String(t.status) === "reassigned").length;
    const reassignToday = tasks.filter(
      (t) => String(t.status) === "reassigned" && new Date(t.updatedAt).toDateString() === now.toDateString()
    ).length;

    return {
      total,
      pending,
      qcApproved,
      completed,
      overdue,
      completedToday,
      reassignCount,
      reassignToday,
    };
  }, [rangedTasks, tasks, now.toDateString()]);

  // --- group helpers
  const by = (arr: AnyTask[], key: (x: AnyTask) => string) => {
    const m = new Map<string, number>();
    arr.forEach((x) => m.set(key(x), (m.get(key(x)) || 0) + 1));
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };
  // --- search filter (optional quick filter)
  const [q, setQ] = useState("");
  const matches = (t: AnyTask) => {
    const hay = [
      t?.name,
      t?.status,
      t?.priority,
      t?.client?.name,
      t?.category?.name,
      t?.assignedTo?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q.toLowerCase());
  };

  // sanitized rows
  const rows = useMemo(
    () =>
      rangedTasks.filter(matches).map((t) => ({
        id: t.id,
        name: t.name,
        client: t?.client?.name,
        category: t?.category?.name,
        assignee: t?.assignedTo?.name,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        completedAt: t.completedAt,
        ideal: t.idealDurationMinutes,
        actual: t.actualDurationMinutes,
        rating: t.performanceRating,
      })),
    [rangedTasks, q]
  );

  const overdueRows = rows.filter((r) => {
    const t = rangedTasks.find((x) => x.id === r.id);
    return t ? isOverdue(t) : false;
  });

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
            QC Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of QC throughput & task health
          </p>
        </div>
        <div className="flex items-end gap-3 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Quick filter (client / assignee / task)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 sm:w-72 border-slate-300 bg-white/80 backdrop-blur"
            />
          </div>
          <RangeControls
            range={range}
            setRange={setRange}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
          />
        </div>
      </div>

      {/* Range badge */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
        Date Range:
        <span className="font-mono">
          {start.toLocaleDateString()} → {end.toLocaleDateString()}
        </span>
      </div>

      {/* KPI Row (design language) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <MetricCard
            title="Total"
            value={numberFmt(metrics.total)}
            description="tasks in range"
            icon={<Gauge className="h-6 w-6" />}
            gradient="from-indigo-500 to-purple-500"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <MetricCard
            title="QC Approved"
            value={numberFmt(metrics.qcApproved)}
            description="passed QC"
            icon={<CheckCircle2 className="h-6 w-6" />}
            gradient="from-emerald-500 to-green-500"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
          <MetricCard
            title="Completed Task"
            value={numberFmt(metrics.completed)}
            description="done in range"
            icon={<TrendingUp className="h-6 w-6" />}
            gradient="from-blue-500 to-cyan-500"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <MetricCard
            title="Reassign Task"
            value={numberFmt(metrics.reassignCount)}
            description={`Today: ${numberFmt(metrics.reassignToday)}`}
            icon={<RotateCcw className="h-6 w-6" />}
            gradient="from-pink-500 to-rose-500"
          />
        </motion.div>
      </div>

      {/* Status & Priority breakdown (matches your gradient bars) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-blue-50/60">
          <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Task Status Distribution
            </CardTitle>
            <CardDescription>Current task status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {by(rangedTasks, (t) => String(t.status || "unknown")).map(
                (g) => {
                  const total = rangedTasks.length || 1;
                  const pct = (g.value / total) * 100;
                  const color = STATUS_COLOR[g.name] || "bg-slate-400";
                  return (
                    <div key={g.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-3 w-3 rounded-full", color)} />
                          <span className="text-sm font-medium text-slate-700">
                            {titleCase(g.name)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {numberFmt(g.value)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className={cn(
                          "h-2.5 bg-slate-200 [&>div]:rounded-full",
                          `[&>div]:${color}`
                        )}
                      />
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>

        {/* Priority */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-purple-50/60">
          <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-purple-50/70 to-violet-50/70">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Task Priority Breakdown
            </CardTitle>
            <CardDescription>Tasks by urgency</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {by(rangedTasks, (t) => String(t.priority || "unknown")).map(
                (g) => {
                  const total = rangedTasks.length || 1;
                  const pct = (g.value / total) * 100;
                  const color = PRIORITY_COLOR[g.name] || "bg-slate-400";
                  return (
                    <div key={g.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-3 w-3 rounded-full", color)} />
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {g.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {numberFmt(g.value)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className={cn(
                          "h-2.5 bg-slate-200 [&>div]:rounded-full",
                          `[&>div]:${color}`
                        )}
                      />
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <Tabs defaultValue="all" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-white/90 via-slate-50/80 to-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl p-2 shadow-lg">
          <TabsTrigger 
            value="all" 
            className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-100/60 hover:shadow-md"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            All Tasks
          </TabsTrigger>
          <TabsTrigger 
            value="qc" 
            className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-100/60 hover:shadow-md"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            QC Approved
          </TabsTrigger>
          <TabsTrigger 
            value="overdue" 
            className="rounded-xl font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-100/60 hover:shadow-md"
          >
            <Timer className="h-4 w-4 mr-2" />
            Overdue
          </TabsTrigger>
        </TabsList>

        {/* All Tasks */}
        <TabsContent value="all">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-50/60">
            <CardHeader className="border-b border-slate-200/70 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-slate-700" />
                    All Tasks
                  </CardTitle>
                  <CardDescription>Filtered by date range & query</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Ideal</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-100/60">
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.client}</TableCell>
                        <TableCell>{r.category}</TableCell>
                        <TableCell>{r.assignee}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {titleCase(r.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.priority}</TableCell>
                        <TableCell>{fmt(r.dueDate)}</TableCell>
                        <TableCell>{fmt(r.completedAt)}</TableCell>
                        <TableCell>{r.ideal ?? "—"}</TableCell>
                        <TableCell>{r.actual ?? "—"}</TableCell>
                        <TableCell>{r.rating ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-8">
                          No tasks in this range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QC Approved */}
        <TabsContent value="qc">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-50/60">
            <CardHeader className="border-b border-slate-200/70 py-5">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                QC Approved
              </CardTitle>
              <CardDescription>Only tasks with status qc_approved</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[40vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Perf</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows
                      .filter((r) => r.status === "qc_approved")
                      .map((r) => (
                        <TableRow key={r.id} className="hover:bg-slate-100/60">
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>{r.client}</TableCell>
                          <TableCell>{r.category}</TableCell>
                          <TableCell>{r.assignee}</TableCell>
                          <TableCell>{fmt(r.completedAt)}</TableCell>
                          <TableCell>{r.rating ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    {rows.filter((r) => r.status === "qc_approved").length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                          Nothing approved in this range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue */}
        <TabsContent value="overdue">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-50/60">
            <CardHeader className="border-b border-slate-200/70 py-5">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Timer className="h-5 w-5 text-red-600" />
                Overdue
              </CardTitle>
              <CardDescription>Pending / reassigned past due</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[40vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueRows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-slate-100/60">
                        <TableCell className="font-mono text-[11px]">
                          {String(r.id).slice(0, 8)}…
                        </TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.client}</TableCell>
                        <TableCell>{r.category}</TableCell>
                        <TableCell>{r.assignee}</TableCell>
                        <TableCell>{fmt(r.dueDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {titleCase(r.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {overdueRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                          No overdue tasks 🎉
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
