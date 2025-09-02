"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TrendingUp, Timer, CheckCircle2, CircleAlert, CalendarClock, Gauge, RotateCcw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Types (loose, aligned to your API)
type AnyTask = any;

export default function QCDashboard({ tasks = [] }: { tasks: AnyTask[] }) {
  // --- helpers
  const now = new Date();
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  const fmt = (d?: string | Date | null) => (d ? new Date(d).toLocaleString() : "—");

  const isOverdue = (t: AnyTask) => {
    const due = t?.dueDate ? new Date(t.dueDate) : null;
    const pendingish = ["pending", "reassigned"].includes(String(t?.status ?? ""));
    return !!(due && pendingish && due.getTime() < now.getTime());
  };

  // --- Date range filter (Today, Last 7, Last 30, Custom)
  type RangeType = "today" | "7" | "30" | "custom";
  const [range, setRange] = useState<RangeType>("today");
  const [customStart, setCustomStart] = useState<string>(toISODate(now));
  const [customEnd, setCustomEnd] = useState<string>(toISODate(now));

  const { start, end } = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (range === "7") {
      start.setDate(start.getDate() - 6); // inclusive window: today + previous 6 days
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

  // We consider the task's updatedAt as the primary timestamp for filtering (aligns with reassign tracking).
  const withinRange = (t: AnyTask) => {
    const stamp = new Date(t?.updatedAt ?? t?.completedAt ?? t?.createdAt ?? now);
    return stamp >= start && stamp <= end;
  };

  const rangedTasks = useMemo(() => tasks.filter(withinRange), [tasks, start, end]);

  // --- derived metrics (from rangedTasks)
  const metrics = useMemo(() => {
    const total = rangedTasks.length;
    const pending = rangedTasks.filter((t) => t.status === "pending").length;
    const qcApproved = rangedTasks.filter((t) => t.status === "qc_approved").length;
    const completed = rangedTasks.filter((t) => t.status === "completed").length;
    const overdue = rangedTasks.filter((t) => isOverdue(t)).length;
    const completedToday = rangedTasks.filter((t) => t.completedAt && new Date(t.completedAt).toDateString() === now.toDateString()).length;
    const slaChecked = rangedTasks.filter((t) => t.actualDurationMinutes != null).length;
    const slaWithin = rangedTasks.filter((t) => t.actualDurationMinutes != null && t.idealDurationMinutes != null && t.actualDurationMinutes <= t.idealDurationMinutes).length;

    // Reassign Count: count tasks whose status is "reassigned" and whose updatedAt falls within selected range
    const reassignCount = rangedTasks.filter((t) => String(t.status) === "reassigned").length;

    // Reassign Today: specifically look at updatedAt matching today's date
    const reassignToday = tasks.filter((t) => String(t.status) === "reassigned" && new Date(t.updatedAt).toDateString() === now.toDateString()).length;

    return { total, pending, qcApproved, completed, overdue, completedToday, slaChecked, slaWithin, reassignCount, reassignToday };
  }, [rangedTasks, tasks]);

  // group helpers
  const by = (arr: AnyTask[], key: (x: AnyTask) => string) => {
    const m = new Map<string, number>();
    arr.forEach((x) => m.set(key(x), (m.get(key(x)) || 0) + 1));
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };

  const workloadByAssignee = useMemo(() => by(rangedTasks, (t) => t?.assignedTo?.name ?? "—"), [rangedTasks]);
  const overdueByAssignee = useMemo(() => by(rangedTasks.filter(isOverdue), (t) => t?.assignedTo?.name ?? "—"), [rangedTasks]);
  const mixByClient = useMemo(() => by(rangedTasks, (t) => t?.client?.name ?? "—"), [rangedTasks]);

  // search filter (client / name / assignee)
  const [q, setQ] = useState("");
  const matches = (t: AnyTask) => {
    const hay = [t?.name, t?.status, t?.priority, t?.client?.name, t?.category?.name, t?.assignedTo?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q.toLowerCase());
  };

  // sanitized view rows (from rangedTasks only)
  const rows = useMemo(() => rangedTasks.filter(matches).map((t) => ({
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
  })), [rangedTasks, q]);

  const overdueRows = rows.filter((r) => {
    const t = rangedTasks.find((x) => x.id === r.id);
    return t ? isOverdue(t) : false;
  });

  // --- UI bits
  const KPI = ({ icon: Icon, label, value, hint }: any) => (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl border"><Icon className="w-4 h-4" /></div>
          <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-semibold leading-snug">{value}</div>
            {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MiniBar = ({ data, title }: { data: { name: string; value: number }[]; title: string }) => (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        <div className="text-sm font-medium mb-2">{title}</div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0, 6).reverse()} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const RangeControls = () => (
    <div className="flex flex-wrap items-end gap-2">
      <Select value={range} onValueChange={(v: RangeType) => setRange(v)}>
        <SelectTrigger className="w-44 h-9">
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
            <Label htmlFor="start" className="text-xs">Start</Label>
            <Input id="start" type="date" className="h-9" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="end" className="text-xs">End</Label>
            <Input id="end" type="date" className="h-9" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </div>
        </div>
      )}

      <div className="text-[11px] text-muted-foreground ml-1">
        Filtering by <span className="font-medium">updatedAt</span> (reassign-friendly).
      </div>
    </div>
  );

  return (
    <div className="w-full p-4 space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">QC Dashboard</h1>
          <p className="text-xs text-muted-foreground">Minimal • professional • one-screen overview</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input placeholder="Quick filter (client / assignee / task)" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 sm:w-72" />
        </div>
      </div>

      {/* Range Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <RangeControls />
        <div className="hidden sm:block text-xs text-muted-foreground">
          Window: <span className="font-mono">{start.toLocaleDateString()} → {end.toLocaleDateString()}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}><KPI icon={Gauge} label="Total" value={metrics.total} /></motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}><KPI icon={CheckCircle2} label="QC Approved" value={metrics.qcApproved} /></motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}><KPI icon={TrendingUp} label="Completed Task" value={metrics.completed} /></motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}><KPI icon={CalendarClock} label="Completed Today" value={metrics.completedToday} /></motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}><KPI icon={RotateCcw} label="Reassign Count" value={metrics.reassignCount} hint={`Today: ${metrics.reassignToday}`} /></motion.div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[20vh] overflow-y-auto">
        <MiniBar title="Workload by Assignee" data={workloadByAssignee} />
        <MiniBar title="Overdue by Assignee" data={overdueByAssignee} />
        <MiniBar title="Tasks by Client" data={mixByClient} />
      </div>
    </div>
  );
}
