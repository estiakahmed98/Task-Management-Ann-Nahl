"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
  Clock,
  Gauge,
  RefreshCw,
  Users2,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ==== Types ====
type AgentLite = { id: string; name: string | null; email: string };
type TaskRow = {
  id: string;
  name: string;
  status: "pending" | "completed" | "qc_approved" | "reassigned" | string;
  performanceRating: "Excellent" | "Good" | "Average" | "Lazy" | null;
  idealDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  updatedAt: string;            // <— we’ll use this everywhere
  completedAt: string | null;   // (not used for date filters anymore)
  assignedTo: AgentLite | null;
};

const perfScore: Record<NonNullable<TaskRow["performanceRating"]>, number> = {
  Excellent: 100,
  Good: 80,
  Average: 60,
  Lazy: 30,
};

// ==== Date helpers (LOCAL TIME) ====
const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const isToday = (date: Date): boolean => {
  const t = new Date();
  return (
    date.getDate() === t.getDate() &&
    date.getMonth() === t.getMonth() &&
    date.getFullYear() === t.getFullYear()
  );
};

const isInRange = (date: Date, start: Date, end: Date): boolean => date >= start && date <= end;

// Convert date to ISO string for API calls (UTC). If your API expects LOCAL bounds, pass epoch millis instead.
const toISODate = (date: Date): string => date.toISOString();

// Safely format a Date for <input type="date"> as LOCAL yyyy-mm-dd
const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Parse yyyy-mm-dd **as local time** (avoids UTC shift)
const fromDateInputValue = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export default function QCDashboard() {
  // Quick range — Today, 7d, 30d, Custom
  const [range, setRange] = useState<"today" | "7d" | "30d" | "custom">("today");

  // Selected date range (LOCAL)
  const [startDate, setStartDate] = useState<Date>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfDay(new Date()));

  // Data
  const [all, setAll] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const url = `/api/tasks?startDate=${encodeURIComponent(toISODate(startDate))}&endDate=${encodeURIComponent(toISODate(endDate))}`;
      const res = await fetch(url, { cache: "no-store" });
      const data: TaskRow[] = res.ok ? await res.json() : [];
      setAll(Array.isArray(data) ? data : []);
    } catch {
      setAll([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // Adjust range selections
  useEffect(() => {
    const now = new Date();
    if (range === "today") {
      setStartDate(startOfDay(now));
      setEndDate(endOfDay(now));
    } else if (range === "7d") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6); // inclusive: today + prev 6 days
      setStartDate(startOfDay(start));
      setEndDate(endOfDay(now));
    } else if (range === "30d") {
      const start = new Date(now);
      start.setDate(now.getDate() - 29); // inclusive: today + prev 29 days
      setStartDate(startOfDay(start));
      setEndDate(endOfDay(now));
    }
    // For custom, keep whatever the user has picked.
  }, [range]);

  // Buckets
  const completed = useMemo(() => all.filter((t) => t.status === "completed"), [all]);
  const approved  = useMemo(() => all.filter((t) => t.status === "qc_approved"), [all]);
  const reassigned = useMemo(() => all.filter((t) => t.status === "reassigned"), [all]);

  // KPIs — ALL date checks use updatedAt
  const kpis = useMemo(() => {
    const completedToday  = completed.filter((t) => isToday(new Date(t.updatedAt))).length;
    const approvedToday   = approved.filter((t)  => isToday(new Date(t.updatedAt))).length;
    const reassignedToday = reassigned.filter((t) => isToday(new Date(t.updatedAt))).length;

    const completedInRange = completed.filter((t) =>
      isInRange(new Date(t.updatedAt), startDate, endDate)
    );
    const totalCompleted = completedInRange.length;

    const rated = completedInRange.filter((t) => t.performanceRating);
    const avgPerformance = rated.length
      ? Math.round(
          rated.reduce((sum, t) => sum + (perfScore[t.performanceRating as keyof typeof perfScore] || 0), 0) /
            rated.length
        )
      : 0;

    const withActual = completedInRange.filter((t) => t.actualDurationMinutes && t.actualDurationMinutes > 0);
    const avgDuration = withActual.length
      ? Math.round(withActual.reduce((s, t) => s + (t.actualDurationMinutes || 0), 0) / withActual.length)
      : 0;

    const withEff = completedInRange.filter(
      (t) => t.idealDurationMinutes && t.actualDurationMinutes && t.actualDurationMinutes > 0
    );
    const avgEfficiency = withEff.length
      ? Math.round(
          withEff.reduce(
            (s, t) => s + Math.min(150, (t.idealDurationMinutes! / t.actualDurationMinutes!) * 100),
            0
          ) / withEff.length
        )
      : 0;

    const perAgent = new Map<
      string,
      { id: string; label: string; completed: number; avgPerf: number; sumPerf: number; rated: number }
    >();
    for (const t of completedInRange) {
      const id = t.assignedTo?.id || "unknown";
      const label = t.assignedTo?.name || t.assignedTo?.email || "Unassigned";
      if (!perAgent.has(id)) perAgent.set(id, { id, label, completed: 0, avgPerf: 0, sumPerf: 0, rated: 0 });
      const a = perAgent.get(id)!;
      a.completed += 1;
      if (t.performanceRating) {
        a.sumPerf += perfScore[t.performanceRating];
        a.rated += 1;
      }
    }
    perAgent.forEach((a) => (a.avgPerf = a.rated ? Math.round(a.sumPerf / a.rated) : 0));
    const leaderboard = [...perAgent.values()].sort((a, b) => b.completed - a.completed).slice(0, 8);

    return {
      completedToday,
      approvedToday,
      reassignedToday,
      totalCompleted,
      avgPerformance,
      avgDuration,
      avgEfficiency,
      leaderboard,
    };
  }, [completed, approved, reassigned, startDate, endDate]);

  return (
    <div className="mx-auto w-full p-6 min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="relative rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 p-6">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-[radial-gradient(40rem_20rem_at_80%_-20%,rgba(59,130,246,0.08),transparent),radial-gradient(30rem_18rem_at_0%_-10%,rgba(16,185,129,0.08),transparent)]" />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <BarChart3 className="h-3.5 w-3.5" />
              Insights
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              QC Insights
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
              Today snapshot, time-range KPIs & agent leaderboard
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Quick ranges — Today, 7d, 30d, Custom */}
            <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="today" className="text-xs md:text-sm">Today</TabsTrigger>
                <TabsTrigger value="7d" className="text-xs md:text-sm">Last 7d</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs md:text-sm">Last 30d</TabsTrigger>
                <TabsTrigger value="custom" className="text-xs md:text-sm">Custom</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={fetchAll} disabled={loading} className="h-9 md:h-10 bg-slate-900 hover:bg-slate-800 text-white">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* Custom range controls */}
        {range === "custom" && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600 dark:text-slate-300">Range</span>
            </div>
            <input
              type="date"
              className="h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-background px-3 text-sm"
              value={toDateInputValue(startDate)}
              onChange={(e) => setStartDate(startOfDay(fromDateInputValue(e.target.value)))}
            />
            <span className="opacity-60 text-slate-500">to</span>
            <input
              type="date"
              className="h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-background px-3 text-sm"
              value={toDateInputValue(endDate)}
              onChange={(e) => setEndDate(endOfDay(fromDateInputValue(e.target.value)))}
            />
            <Button onClick={fetchAll} disabled={loading} variant="outline" className="h-10">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* TODAY – execution KPIs (3 tiles) */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Completed Tasks" value={formatNumber(kpis.completedToday)} icon={<CheckCircle2 className="h-5 w-5" />} accent="from-teal-500 to-teal-500" />
        <KpiCard title="QC Approved Tasks" value={formatNumber(kpis.approvedToday)} icon={<CheckCircle2 className="h-5 w-5" />} accent="from-emerald-500 to-emerald-500" />
        <KpiCard title="Reassigned Tasks" value={formatNumber(kpis.reassignedToday)} icon={<RotateCcw className="h-5 w-5" />} accent="from-blue-500 to-blue-500" />
      </section>

      {/* RANGE KPIs */}
      <section className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard title="Completed (Range)" value={formatNumber(kpis.totalCompleted)} icon={<CheckCircle2 className="h-5 w-5" />} accent="from-slate-800 to-slate-600" />
        <KpiCard title="Avg Performance" value={kpis.avgPerformance ? `${kpis.avgPerformance}/100` : "—"} icon={<TrendingUp className="h-5 w-5" />} accent="from-indigo-500 to-violet-500" />
        <KpiCard title="Avg Duration" value={kpis.avgDuration ? `${kpis.avgDuration}m` : "—"} icon={<Clock className="h-5 w-5" />} accent="from-blue-500 to-sky-500" />
        <KpiCard title="Avg Efficiency" value={kpis.avgEfficiency ? `${kpis.avgEfficiency}%` : "—"} icon={<Gauge className="h-5 w-5" />} accent="from-emerald-600 to-green-600" />
      </section>

      {/* Agent Leaderboard */}
      <section className="mt-8">
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-500 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/15">
                <Users2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl font-bold">Agent Leaderboard</CardTitle>
                <p className="text-xs md:text-sm text-slate-200/80">Top by completed tasks (selected range)</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {kpis.leaderboard.length === 0 ? (
              <div className="text-sm text-slate-500">No data in this range.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {kpis.leaderboard.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center font-semibold">
                          {(a.label || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{a.label}</div>
                          <div className="text-xs text-slate-500">Completed: {formatNumber(a.completed)}</div>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "text-xs px-2 py-1 rounded-full border",
                          a.avgPerf >= 80
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800"
                            : a.avgPerf >= 60
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-800"
                        )}
                        title="Average performance score"
                      >
                        Avg Perf: {a.avgPerf || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({ title, value, icon, accent, hint }: { title: string; value: string | number; icon: React.ReactNode; accent: string; hint?: string }) {
  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
      <div className={cn("h-1 w-full bg-gradient-to-r", accent)} />
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">{title}</div>
          <div className={cn("p-2 rounded-md text-white bg-gradient-to-br", accent)}>{icon}</div>
        </div>
        <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{value}</div>
        {hint ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

const formatNumber = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
