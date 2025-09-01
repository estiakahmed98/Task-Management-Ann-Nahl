"use client";
import React, { type ReactNode } from "react";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Globe, Star } from "lucide-react";

// ===== Types =====
type TaskLite = {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | Date | null;
  createdAt: string | Date;
  completedAt?: string | Date | null;
  performanceRating?: string | null;
  client: { id: string; name: string } | null;
  assignment?: { id: string; status: string | null } | null;
  templateSiteAsset?: { name: string; type?: string | null } | null;
};

export default function AgentTasksClient({
  tasks,
  agentId,
}: {
  tasks: TaskLite[];
  agentId: string;
}) {
  // Build client dropdown options from ALL tasks once
  const clientOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    tasks.forEach((t) => {
      if (t.client)
        map.set(t.client.id, { id: t.client.id, name: t.client.name });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [tasks]);

  // '' = All, 'no-client' = Unassigned, otherwise clientId
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // Filter instantly in-memory
  const filteredTasks = useMemo(() => {
    if (selectedClientId === "") return tasks;
    if (selectedClientId === "no-client") return tasks.filter((t) => !t.client);
    return tasks.filter((t) => t.client?.id === selectedClientId);
  }, [tasks, selectedClientId]);

  // KPIs from filtered set
  const counts = useMemo(() => {
    const c = {
      total: filteredTasks.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      cancelled: 0,
    };
    for (const t of filteredTasks) c[t.status as keyof typeof c] += 1;
    return c;
  }, [filteredTasks]);

  const completionRate = counts.total
    ? Math.round((counts.completed / counts.total) * 100)
    : 0;

  // Group by client after filtering
  const clientGroups = useMemo(() => {
    const acc: Record<
      string,
      { client: { id: string; name: string }; tasks: TaskLite[] }
    > = {};
    for (const task of filteredTasks) {
      const key = task.client?.id ?? "no-client";
      const name = task.client?.name ?? "Unassigned Tasks";
      if (!acc[key]) acc[key] = { client: { id: key, name }, tasks: [] };
      acc[key].tasks.push(task);
    }
    return Object.values(acc);
  }, [filteredTasks]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Tasks" value={counts.total} tone="slate" />
        <KpiCard title="In Progress" value={counts.in_progress} tone="blue" />
        <KpiCard title="Pending" value={counts.pending} tone="amber" />
        <KpiCard title="Completed" value={counts.completed} tone="emerald" />
        <KpiCard title="Overdue" value={counts.overdue} tone="red" />
        <KpiCard
          title="Success Rate"
          value={`${completionRate}%`}
          tone="violet"
        />
      </div>

      {/* Header + Instant Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
            Tasks by Client
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Filter instantly without reloading the page
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="h-9 rounded-md border border-indigo-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-indigo-800 dark:text-gray-100"
            aria-label="Filter by client"
          >
            <option value="">All Clients</option>
            <option value="no-client">Unassigned</option>
            {clientOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {selectedClientId !== "" && (
            <Button
              variant="ghost"
              className="h-9"
              onClick={() => setSelectedClientId("")}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <Badge
        variant="outline"
        className="px-4 py-2 text-sm font-semibold border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300"
      >
        {clientGroups.length} Client{clientGroups.length !== 1 ? "s" : ""} •{" "}
        {counts.total} Task
        {counts.total !== 1 ? "s" : ""}
      </Badge>

      {counts.total === 0 ? (
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
              No Tasks Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Try switching back to “All Clients” or choose another client.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {clientGroups.map((group) => (
            <ClientTaskCard key={group.client.id} clientGroup={group} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== UI bits (copied/local so they can run in a client component) ===== */
function KpiCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number | string;
  tone: "slate" | "blue" | "amber" | "emerald" | "red" | "violet";
}) {
  const tones: Record<
    string,
    { from: string; to: string; text: string; sub: string; shadow: string }
  > = {
    slate: {
      from: "from-slate-500",
      to: "to-slate-700",
      text: "text-white",
      sub: "text-slate-100",
      shadow: "shadow-slate-200/50",
    },
    blue: {
      from: "from-blue-500",
      to: "to-indigo-600",
      text: "text-white",
      sub: "text-blue-100",
      shadow: "shadow-blue-200/50",
    },
    amber: {
      from: "from-amber-500",
      to: "to-orange-600",
      text: "text-white",
      sub: "text-amber-100",
      shadow: "shadow-amber-200/50",
    },
    emerald: {
      from: "from-emerald-500",
      to: "to-green-600",
      text: "text-white",
      sub: "text-emerald-100",
      shadow: "shadow-emerald-200/50",
    },
    red: {
      from: "from-red-500",
      to: "to-rose-600",
      text: "text-white",
      sub: "text-red-100",
      shadow: "shadow-red-200/50",
    },
    violet: {
      from: "from-violet-500",
      to: "to-purple-600",
      text: "text-white",
      sub: "text-violet-100",
      shadow: "shadow-violet-200/50",
    },
  };
  const t = tones[tone];
  return (
    <Card
      className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${t.from} ${t.to} ${t.text} ${t.shadow} hover:scale-105`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="relative pb-2">
        <CardTitle
          className={`text-sm font-semibold ${t.sub} uppercase tracking-wide`}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// You already have these in your page; duplicating so the client component is self-contained.
function statusBadge(status: string) {
  const map: Record<string, { color: string; icon: ReactNode }> = {
    pending: {
      color:
        "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/50",
      icon: <span className="block w-3 h-3 rounded-full bg-white/80" />,
    },
    in_progress: {
      color:
        "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200/50",
      icon: (
        <span className="block w-3 h-3 rounded-full bg-white animate-pulse" />
      ),
    },
    completed: {
      color:
        "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200/50",
      icon: <span className="block w-3 h-3 rounded-full bg-white/80" />,
    },
    overdue: {
      color:
        "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200/50",
      icon: <span className="block w-3 h-3 rounded-full bg-white/80" />,
    },
    cancelled: {
      color:
        "bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-lg shadow-gray-200/50",
      icon: <span className="block w-3 h-3 rounded-full bg-white/70" />,
    },
  };
  const config = map[status] ?? {
    color: "bg-gray-100 text-gray-800",
    icon: <span className="block w-3 h-3 rounded-full bg-gray-400" />,
  };
  return (
    <Badge
      className={`font-medium ${config.color} flex items-center gap-1.5 px-3 py-1`}
    >
      {config.icon}
      {status.replace("_", " ").toUpperCase()}
    </Badge>
  );
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    low: "bg-gradient-to-r from-green-400 to-emerald-500 text-white",
    medium: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
    high: "bg-gradient-to-r from-red-400 to-pink-500 text-white",
    urgent:
      "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200/50",
  };
  const cls = map[priority] ?? "bg-gray-100 text-gray-800";
  const stars =
    priority === "urgent"
      ? 3
      : priority === "high"
      ? 2
      : priority === "medium"
      ? 1
      : 0;
  return (
    <Badge className={`font-medium ${cls} flex items-center gap-1 px-2 py-1`}>
      {Array.from({ length: stars }).map((_, i) => (
        <Star key={i} className="w-3 h-3 fill-current" />
      ))}
      {priority.toUpperCase()}
    </Badge>
  );
}

function fmtDate(d?: Date | string | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ClientTaskCard({
  clientGroup,
}: {
  clientGroup: { client: { id: string; name: string }; tasks: TaskLite[] };
}) {
  const { client, tasks } = clientGroup;
  const isUnassigned = client.id === "no-client";

  const clientStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
  };

  const completionRate = clientStats.total
    ? Math.round((clientStats.completed / clientStats.total) * 100)
    : 0;

  return (
    <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20">
      <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-100 dark:border-indigo-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                isUnassigned
                  ? "bg-gradient-to-br from-gray-500 to-slate-600"
                  : "bg-gradient-to-br from-indigo-500 to-purple-600"
              }`}
            >
              {isUnassigned ? "?" : client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle
                className={`text-xl font-bold ${
                  isUnassigned
                    ? "text-gray-700 dark:text-gray-300"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400"
                }`}
              >
                {client.name}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {clientStats.total} task{clientStats.total !== 1 ? "s" : ""} •{" "}
                {completionRate}% completion rate
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {clientStats.pending > 0 && (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/50 px-2 py-1">
                {clientStats.pending} Pending
              </Badge>
            )}
            {clientStats.in_progress > 0 && (
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200/50 px-2 py-1">
                {clientStats.in_progress} In Progress
              </Badge>
            )}
            {clientStats.overdue > 0 && (
              <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200/50 px-2 py-1">
                {clientStats.overdue} Overdue
              </Badge>
            )}
            <Badge
              variant="outline"
              className="px-3 py-1 font-semibold border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300"
            >
              {clientStats.total} Total
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-0">
          {tasks.map((task, index) => (
            <TaskListItem
              key={task.id}
              task={task}
              isLast={index === tasks.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskListItem({ task, isLast }: { task: TaskLite; isLast?: boolean }) {
  const isOverdue = task.status === "overdue";
  const isCompleted = task.status === "completed";
  const isInProgress = task.status === "in_progress";

  return (
    <div
      className={`group relative p-6 transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 ${
        !isLast ? "border-b border-gray-100 dark:border-gray-700" : ""
      } ${
        isOverdue
          ? "bg-gradient-to-r from-red-50/30 to-transparent dark:from-red-900/10 dark:to-transparent"
          : isCompleted
          ? "bg-gradient-to-r from-emerald-50/30 to-transparent dark:from-emerald-900/10 dark:to-transparent"
          : isInProgress
          ? "bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/10 dark:to-transparent"
          : ""
      }`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
          task.priority === "urgent"
            ? "bg-gradient-to-b from-purple-500 to-indigo-600"
            : task.priority === "high"
            ? "bg-gradient-to-b from-red-500 to-pink-600"
            : task.priority === "medium"
            ? "bg-gradient-to-b from-yellow-500 to-orange-600"
            : "bg-gradient-to-b from-green-500 to-emerald-600"
        }`}
      />
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                  {task.name}
                </h3>
                {statusBadge(task.status)}
                {priorityBadge(task.priority)}
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                {task.templateSiteAsset && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">
                      {task.templateSiteAsset.name}
                    </span>
                    {task.templateSiteAsset.type && (
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-0.5 border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                      >
                        {task.templateSiteAsset.type}
                      </Badge>
                    )}
                  </div>
                )}

                {task.performanceRating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {task.performanceRating}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-right min-w-0">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                Due:
              </span>
              <span
                className={`font-semibold ${
                  isOverdue
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {fmtDate(task.dueDate)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                Created:
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {fmtDate(task.createdAt)}
              </span>
            </div>

            {task.completedAt && (
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                  Completed:
                </span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {fmtDate(task.completedAt)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
