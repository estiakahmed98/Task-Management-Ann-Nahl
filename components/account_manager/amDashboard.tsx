"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Activity,
  CalendarDays,
  Clock,
  TrendingUp,
  Filter,
  AlertTriangle,
  UserCircle2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// AM dropdown removed; selection now comes from session
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";

import { useUserSession } from "@/lib/hooks/use-user-session";

type ClientLite = {
  id: string;
  name: string;
  status?: string | null;
  progress?: number | null;
  startDate?: string | null;
  dueDate?: string | null;
  amId?: string | null;
  packageId?: string | null;
  accountManager?: { id?: string; name?: string | null; email?: string | null } | null;
};

type FetchState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

type PackageLite = { id: string; name: string };

function safeParse<T = unknown>(raw: any): T {
  // handle responses that come as a JSON string: "\"[ {..} ]\""
  if (typeof raw === "string") {
    try {
      const once = JSON.parse(raw);
      return typeof once === "string" ? (JSON.parse(once) as T) : (once as T);
    } catch {
      return raw as T;
    }
  }
  return raw as T;
}

export function AMDashboard({ defaultAmId = "" }: { defaultAmId?: string }) {
  const [selectedAmId, setSelectedAmId] = useState<string>(defaultAmId);
  const { user, loading: sessionLoading } = useUserSession();

  // Clients (filtered by AM server-side)
  const [clients, setClients] = useState<FetchState<ClientLite[]>>({
    data: [],
    loading: false,
    error: null,
  });

  // Packages map for pretty names in table
  const [pkgMap, setPkgMap] = useState<Record<string, string>>({});
  const [pkgLoading, setPkgLoading] = useState(false);

  // Set selection from session (AM users see their own clients)
  useEffect(() => {
    if (sessionLoading) return;
    // If logged-in user is AM, force selection to their ID
    if (user?.role === "am" && user?.id) {
      setSelectedAmId(user.id);
      return;
    }
    // Otherwise keep defaultAmId (admin or other roles see all when empty)
    if (!user?.id && defaultAmId && !selectedAmId) {
      setSelectedAmId(defaultAmId);
    }
  }, [user, sessionLoading, defaultAmId, selectedAmId]);

  // Load packages → map id→name (once)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPkgLoading(true);
        const res = await fetch("/api/packages", { cache: "no-store" });
        const raw = await res.json();
        const list = safeParse<any[]>(raw);
        const map: Record<string, string> = {};
        (Array.isArray(list) ? list : []).forEach((p) => {
          if (p?.id) map[String(p.id)] = String(p.name ?? "Unnamed");
        });
        if (mounted) setPkgMap(map);
      } catch {
        if (mounted) setPkgMap({});
      } finally {
        if (mounted) setPkgLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load clients for selected AM (server supports ?amId=)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!mounted) return;
        setClients({ data: [], loading: true, error: null });

        const url = selectedAmId ? `/api/clients?amId=${encodeURIComponent(selectedAmId)}` : "/api/clients";
        const res = await fetch(url, { cache: "no-store" });
        const raw = await res.json();
        const arr = safeParse<any[]>(raw);

        const mapped: ClientLite[] = (Array.isArray(arr) ? arr : []).map((c) => ({
          id: String(c.id),
          name: String(c.name ?? "Unnamed"),
          status: c.status ?? null,
          progress: typeof c.progress === "number" ? c.progress : (c.progress ? Number(c.progress) : null),
          startDate: c.startDate ?? null,
          dueDate: c.dueDate ?? null,
          amId: c.amId ?? null,
          packageId: c.packageId ?? null,
          accountManager: c.accountManager ?? null,
        }));

        setClients({ data: mapped, loading: false, error: null });
      } catch {
        setClients({ data: [], loading: false, error: "Failed to load clients" });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedAmId]);

  // ---------- Derived metrics ----------
  const now = new Date();

  const statusCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const c of clients.data) {
      const s = (c.status ?? "unknown").toString().toLowerCase();
      acc[s] = (acc[s] ?? 0) + 1;
    }
    return acc;
  }, [clients.data]);

  const totalClients = clients.data.length;
  const activeClients = clients.data.filter((c) => (c.status ?? "").toLowerCase() === "active").length;

  const avgProgress = useMemo(() => {
    if (!clients.data.length) return 0;
    const vals = clients.data.map((c) => Number(c.progress ?? 0));
    const sum = vals.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
    return Math.round(sum / clients.data.length);
  }, [clients.data]);

  const dueIn7Days = useMemo(() => {
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);
    return clients.data.filter((c) => {
      if (!c.dueDate) return false;
      const d = new Date(c.dueDate);
      return d >= now && d <= in7;
    }).length;
  }, [clients.data]);

  const upcomingDueList = useMemo(() => {
    return [...clients.data]
      .filter((c) => !!c.dueDate)
      .sort((a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime())
      .slice(0, 8);
  }, [clients.data]);

  // Charts
  const pieData = useMemo(
    () =>
      Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value,
      })),
    [statusCounts]
  );

  const progressBuckets = useMemo(() => {
    const buckets = [
      { label: "0–20%", min: 0, max: 20 },
      { label: "21–40%", min: 21, max: 40 },
      { label: "41–60%", min: 41, max: 60 },
      { label: "61–80%", min: 61, max: 80 },
      { label: "81–100%", min: 81, max: 100 },
    ];
    const counts = buckets.map((b) => ({ ...b, count: 0 }));
    for (const c of clients.data) {
      const p = Number(c.progress ?? 0);
      const bucket = counts.find((b) => p >= b.min && p <= b.max);
      if (bucket) bucket.count += 1;
    }
    return counts.map((b) => ({ label: b.label, count: b.count }));
  }, [clients.data]);

  const startsByMonth = useMemo(() => {
    const months: { key: string; label: string; count: number }[] = [];
    const d = new Date(now);
    for (let i = 5; i >= 0; i--) {
      const temp = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, "0")}`;
      const label = temp.toLocaleString("en-US", { month: "short" });
      months.push({ key, label, count: 0 });
    }
    for (const c of clients.data) {
      if (!c.startDate) continue;
      const sd = new Date(c.startDate);
      const k = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, "0")}`;
      const row = months.find((m) => m.key === k);
      if (row) row.count += 1;
    }
    return months;
  }, [clients.data, now]);

  const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#64748b", "#0ea5e9"];

  const amLabel = useMemo(() => {
    // If user is AM, label from session
    if (user?.role === "am") {
      if (user?.name && user?.email) return `${user.name}`;
      return user?.name || user?.email || "My Clients";
    }
    // Fallback: first client's accountManager
    const cm = clients.data[0]?.accountManager;
    if (cm?.name && cm?.email) return `${cm.name}`;
    if (cm?.name || cm?.email) return cm.name || cm.email || "All AMs";
    return selectedAmId ? "Selected AM" : "All AMs";
  }, [user, selectedAmId, clients.data]);

  const formatDate = (s?: string | null) =>
    s ? new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div className="space-y-6 px-4 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl p-2 md:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{amLabel}'s Dashboard</h1>
        </div>
        {/* AM dropdown removed; selection is session-based */}
      </div>

      {/* Loading / Error */}
      {clients.loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
          Loading statistics…
        </div>
      ) : clients.error ? (
        <div className="flex items-center justify-center gap-2 py-16 text-rose-600">
          <AlertTriangle className="w-5 h-5" />
          {clients.error}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-white to-indigo-100/50 hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Clients</p>
                    <p className="text-3xl font-bold text-slate-800">{totalClients}</p>
                  </div>
                  <div className="p-3 bg-indigo-500 rounded-xl shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 via-white to-emerald-100/50 hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Clients</p>
                    <p className="text-3xl font-bold text-slate-800">{activeClients}</p>
                  </div>
                  <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 via-white to-violet-100/50 hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg. Progress</p>
                    <p className="text-3xl font-bold text-slate-800">{avgProgress}%</p>
                  </div>
                  <div className="p-3 bg-violet-500 rounded-xl shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 via-white to-amber-100/50 hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Due in 7 Days</p>
                    <p className="text-3xl font-bold text-slate-800">{dueIn7Days}</p>
                  </div>
                  <div className="p-3 bg-amber-500 rounded-xl shadow-lg">
                    <CalendarDays className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Status pie */}
            <Card className="bg-gradient-to-br from-white to-indigo-50/30 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 lg:col-span-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <UserCircle2 className="w-5 h-5 text-white" />
                  </div>
                  Client Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[260px]">
                {pieData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie dataKey="value" data={pieData} outerRadius={90} label>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Progress distribution */}
            <Card className="bg-gradient-to-br from-white to-emerald-50/30 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 lg:col-span-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  Progress Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RTooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Starts by month */}
            <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 lg:col-span-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  Client Starts (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={startsByMonth}>
                    <defs>
                      <linearGradient id="colorStart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RTooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#colorStart)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Due Table */}
          <Card className="bg-gradient-to-br from-white to-amber-50/20 border-0 shadow-lg mb-6 hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                Upcoming Due Dates
                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-700 hover:bg-slate-200">
                  {upcomingDueList.length}
                </Badge>
                <span className="ml-auto text-sm text-slate-500 font-medium">
                  Viewing: {amLabel}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {upcomingDueList.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 border-b border-slate-200">
                      <th className="py-3 px-4 font-semibold">Client</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Progress</th>
                      <th className="py-3 px-4 font-semibold">Package</th>
                      <th className="py-3 px-4 font-semibold">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingDueList.map((c, index) => (
                      <tr key={c.id} className={`border-t border-slate-100 hover:bg-slate-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className="py-3 px-4 font-medium text-slate-800">{c.name}</td>
                        <td className="py-3 px-4 capitalize">
                          <Badge variant="outline" className="border-slate-300 text-slate-700 bg-white">{(c.status ?? "—").toString().replace(/_/g, " ")}</Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{Number(c.progress ?? 0)}%</td>
                        <td className="py-3 px-4 text-slate-600">
                          {c.packageId ? (pkgMap[c.packageId] ?? (pkgLoading ? "Loading…" : c.packageId)) : "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(c.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-slate-500">No upcoming due dates found.</div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
