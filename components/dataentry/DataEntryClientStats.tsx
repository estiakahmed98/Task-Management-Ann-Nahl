"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Client } from "@/types/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2, CalendarRange } from "lucide-react";
import { BackgroundGradient } from "../ui/background-gradient";

export type DataEntryClientStatsProps = {
  clients: Client[];
};

// A small helper to toISOString date boundaries safely
function toISODateOnly(d: Date) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return dt.toISOString();
}

export default function DataEntryClientStats({ clients }: DataEntryClientStatsProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [from, setFrom] = useState<string>(""); // YYYY-MM-DD
  const [to, setTo] = useState<string>("");   // YYYY-MM-DD
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState(() => ({
    totalInRange: 0,
    today: 0,
    last7Days: 0,
    last30Days: 0,
    byStatus: {} as Record<string, number>,
  }));

  const clientOptions = useMemo(() => {
    const safe = Array.isArray(clients) ? clients : [];
    return [{ id: "all", name: "All Clients" }, ...safe.map(c => ({ id: String(c.id), name: c.name ?? String(c.id) }))];
  }, [clients]);

  const refresh = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("pageSize", "1000");
      if (selectedClientId !== "all") params.set("clientId", selectedClientId);
      if (from) params.set("from", from); // accepts YYYY-MM-DD
      if (to) params.set("to", to);

      const res = await fetch(`/api/tasks/data-entry-reports?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      const data: any[] = Array.isArray(json?.data) ? json.data : [];

      // Pre-calc helpers
      const today = new Date();
      const startOfTodayISO = toISODateOnly(today);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const inRangeTotal = data.length;

      const todayCount = data.filter((r) => {
        const d = r?.dataEntryCompletedAt ? new Date(r.dataEntryCompletedAt) : null;
        if (!d) return false;
        return d >= new Date(startOfTodayISO);
      }).length;

      const last7 = data.filter((r) => {
        const d = r?.dataEntryCompletedAt ? new Date(r.dataEntryCompletedAt) : null;
        return !!d && d >= sevenDaysAgo;
      }).length;

      const last30 = data.filter((r) => {
        const d = r?.dataEntryCompletedAt ? new Date(r.dataEntryCompletedAt) : null;
        return !!d && d >= thirtyDaysAgo;
      }).length;

      const byStatus: Record<string, number> = {};
      data.forEach((r) => {
        const st = (r?.dataEntryStatus ?? "unknown").toString();
        byStatus[st] = (byStatus[st] || 0) + 1;
      });

      setStats({ totalInRange: inRangeTotal, today: todayCount, last7Days: last7, last30Days: last30, byStatus });
    } catch (e) {
      console.error("Failed to load client stats", e);
      setStats({ totalInRange: 0, today: 0, last7Days: 0, last30Days: 0, byStatus: {} });
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh when filters change
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto">
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">Client</label>
            <select
              className="border rounded-md px-2 py-2 text-sm"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              {clientOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">From</label>
            <input
              type="date"
              className="border rounded-md px-2 py-2 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">To</label>
            <input
              type="date"
              className="border rounded-md px-2 py-2 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
            <BackgroundGradient>
          <Button className="bg-transparent hover:bg-transparent" size="sm" onClick={refresh} disabled={loading}>
            <CalendarRange className="h-4 w-4 mr-2" />
            {loading ? "Loading..." : "Apply"}
          </Button>
          </BackgroundGradient>
          <BackgroundGradient>
          <Button
            size="sm"
            className="bg-transparent hover:bg-transparent"
            onClick={() => {
              setFrom("");
              setTo("");
              refresh();
            }}
          >
            Reset
          </Button>
          </BackgroundGradient>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Completed (Range)</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalInRange}</div>
            <p className="text-xs text-blue-600 mt-1">Total completed in selected range</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.today}</div>
            <p className="text-xs text-green-700 mt-1">Completed today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">Last 7 Days</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{stats.last7Days}</div>
            <p className="text-xs text-indigo-700 mt-1">Completed in last 7 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Last 30 Days</CardTitle>
            <BarChart3 className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{stats.last30Days}</div>
            <p className="text-xs text-amber-700 mt-1">Completed in last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Status summary */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.byStatus).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data for selected filters.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {Object.entries(stats.byStatus).map(([st, count]) => (
                <div key={st} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <span className="capitalize">{st.replace("_", " ")}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
}
