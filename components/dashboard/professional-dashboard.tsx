"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  CheckCircle2,
  Users,
  Layers,
  UserCheck,
  Calendar,
  Target,
  Clock,
  Download,
  FileText,
  AlertTriangle,
  Bell,
  Activity,
  Briefcase,
  Package as PackageIcon,
  MessageSquare,
  Timer,
  Zap,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* -------------------- Types -------------------- */
interface DashboardStats {
  overview: {
    totalClients: number;
    totalTasks: number;
    totalUsers: number;
    totalTeams: number;
    totalPackages: number;
    totalTemplates: number;
    totalAssignments: number;
    totalNotifications: number;
    totalConversations: number;
    totalMessages: number;
    unreadNotifications: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
    avgCompletionTime: number;
    byPriority: Array<{ priority: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    performanceRatings: Array<{ rating: string; count: number }>;
  };
  clients: {
    total: number;
    growthRate: number;
    addedThisWeek: number;
    addedThisMonth: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  teams: {
    total: number;
    efficiency: number;
    data: Array<{
      id: string;
      name: string;
      totalMembers: number;
      clientMembers: number;
      templateMembers: number;
    }>;
  };
  users: {
    total: number;
    roleDistribution: Array<{ role: string; count: number }>;
  };
  timeMetrics: {
    tasksCompletedThisWeek: number;
    tasksCompletedThisMonth: number;
    clientsAddedThisWeek: number;
    clientsAddedThisMonth: number;
  };
  recent: {
    clients: Array<{
      id: string;
      name: string;
      company?: string;
      status?: string;
      progress?: number | null;
      packageName?: string;
      accountManager?: string;
      taskCount: number;
      createdAt: string;
      avatar?: string | null;
    }>;
    tasks: Array<{
      id: string;
      name: string;
      status: string;
      priority: string;
      dueDate?: string | null;
      clientName?: string;
      assignedToName?: string;
      categoryName?: string;
      completedAt?: string | null;
      createdAt: string;
    }>;
    users: Array<{
      id: string;
      name?: string | null;
      email: string;
      roleName?: string | null;
      status: string;
      taskCount: number;
      createdAt: string;
      image?: string | null;
    }>;
    notifications: Array<{
      id: number;
      type: string;
      message: string;
      isRead: boolean;
      userName?: string;
      taskName?: string;
      createdAt: string;
    }>;
    activities: Array<{
      id: string;
      entityType: string;
      action: string;
      userName?: string;
      timestamp: string;
    }>;
  };
}

/* -------------------- Helpers -------------------- */
const numberFmt = (n: number) =>
  Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);

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

const RATING_COLOR: Record<string, string> = {
  Excellent: "bg-emerald-500",
  Good: "bg-blue-500",
  Average: "bg-yellow-500",
  Poor: "bg-orange-500",
  Lazy: "bg-red-500",
};

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

/** Sort by a date key desc and take latest N (default 5). */
function takeLatest<T extends Record<string, any>>(
  arr: T[] | undefined,
  dateKey: keyof T,
  n = 5
): T[] {
  if (!Array.isArray(arr)) return [];
  return [...arr]
    .sort(
      (a, b) =>
        new Date(b[dateKey] as string).getTime() -
        new Date(a[dateKey] as string).getTime()
    )
    .slice(0, n);
}

export function ProfessionalDashboard() {
  const [timeRange, setTimeRange] = useState("month");
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = (await res.json()) as DashboardStats;
        setDashboardData(data);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  /* ---- ensure every recent list is latest 5 ---- */
  const recentTasks = useMemo(
    () => takeLatest(dashboardData?.recent?.tasks, "createdAt", 5) || [],
    [dashboardData]
  );
  const recentClients = useMemo(
    () => takeLatest(dashboardData?.recent?.clients, "createdAt", 5) || [],
    [dashboardData]
  );
  const recentUsers = useMemo(
    () => takeLatest(dashboardData?.recent?.users, "createdAt", 5) || [],
    [dashboardData]
  );
  const recentNotifications = useMemo(
    () => takeLatest(dashboardData?.recent?.notifications, "createdAt", 5) || [],
    [dashboardData]
  );
  const recentActivities = useMemo(
    () => takeLatest(dashboardData?.recent?.activities, "timestamp", 5) || [],
    [dashboardData]
  );
  // Get all teams without limiting the count
  const allTeams = useMemo(
    () => dashboardData?.teams?.data || [],
    [dashboardData]
  );

  // Get task categories with counts from the API data
  const taskCategories = useMemo(() => {
    // Get all unique categories from tasks
    const categoryMap = new Map<string, number>();
    
    // Process tasks to count categories
    dashboardData?.recent?.tasks?.forEach(task => {
      if (task.categoryName) {
        categoryMap.set(
          task.categoryName,
          (categoryMap.get(task.categoryName) || 0) + 1
        );
      }
    });

    // Convert to array and calculate percentages
    return Array.from(categoryMap.entries()).map(([name, count]) => {
      const percentage = dashboardData?.tasks?.total 
        ? (count / dashboardData.tasks.total * 100).toFixed(1)
        : '0.0';
        
      return {
        name,
        count,
        percentage,
        color: getCategoryColor(name)
      };
    });
    
    // Helper function to get color based on category name
    function getCategoryColor(categoryName: string): string {
      const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-yellow-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500',
        'bg-orange-500',
        'bg-cyan-500',
        'bg-rose-500',
      ];
      
      // Simple hash function to get consistent color for same category
      let hash = 0;
      for (let i = 0; i < categoryName.length; i++) {
        hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    }
  }, [dashboardData]);

  if (loading) return <DashboardSkeleton />;
  if (error)
    return (
      <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-rose-50 to-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Dashboard Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  if (!dashboardData) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
            Dashboard Overview
          </h2>
          <p className="text-muted-foreground mt-2">
            Real-time insights into your operations & performance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full md:w-auto">
          {/* <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 border-slate-300 bg-white/80 backdrop-blur"
            >
              <Link href="/admin/reports">
                <Download className="h-4 w-4" />
                Export
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md"
            >
              <Link href="/admin/reports/new">
                <FileText className="h-4 w-4" />
                Report
              </Link>
            </Button>
          </div> */}
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px] border-slate-300 bg-white/80 backdrop-blur">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Clients"
          value={numberFmt(dashboardData.overview.totalClients)}
          change={`+${dashboardData.clients.growthRate}%`}
          trend="up"
          description="vs previous period"
          icon={<Users className="h-6 w-6" />}
          gradient="from-blue-500 to-cyan-500"
          subMetric={`${dashboardData.clients.addedThisMonth} this month`}
        />
        <MetricCard
          title="Total Tasks"
          value={numberFmt(dashboardData.overview.totalTasks)}
          change={`${dashboardData.tasks.completionRate}%`}
          trend="up"
          description="completion rate"
          icon={<Layers className="h-6 w-6" />}
          gradient="from-violet-500 to-purple-500"
          subMetric={`${dashboardData.tasks.completed} completed`}
        />
        <MetricCard
          title="Active Teams"
          value={numberFmt(dashboardData.overview.totalTeams)}
          change={`${dashboardData.teams.efficiency}`}
          trend="up"
          description="avg tasks / team"
          icon={<UserCheck className="h-6 w-6" />}
          gradient="from-emerald-500 to-green-500"
          subMetric={`${dashboardData.overview.totalUsers} users`}
        />
        <MetricCard
          title="Notifications"
          value={numberFmt(dashboardData.overview.unreadNotifications)}
          change={`${dashboardData.overview.totalNotifications}`}
          trend={dashboardData.overview.unreadNotifications > 5 ? "down" : "up"}
          description="total notifications"
          icon={<Bell className="h-6 w-6" />}
          gradient="from-amber-500 to-orange-500"
          subMetric={`${dashboardData.overview.totalMessages} messages`}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-white/70 backdrop-blur border border-slate-200/60 rounded-xl p-1">
          <TabsTrigger value="tasks" className="rounded-lg">
            Tasks
          </TabsTrigger>
          <TabsTrigger value="clients" className="rounded-lg">
            Clients
          </TabsTrigger>
          <TabsTrigger value="teams" className="rounded-lg">
            Teams
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-lg">
            Performance
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg">
            Activity
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg">
            Users
          </TabsTrigger>
        </TabsList>

        {/* ---------- TASKS TAB ---------- */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status breakdown */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-blue-50/60">
              <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Task Status Distribution
                </CardTitle>
                <CardDescription>Current task status breakdown</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {(dashboardData.tasks.byStatus || []).map((g) => {
                    const pct =
                      dashboardData.tasks.total > 0
                        ? (g.count / dashboardData.tasks.total) * 100
                        : 0;
                    const color = STATUS_COLOR[g.status] || "bg-slate-400";
                    return (
                      <div key={g.status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn("h-3 w-3 rounded-full", color)}
                            />
                            <span className="text-sm font-medium text-slate-700">
                              {titleCase(g.status)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {g.count} ({pct.toFixed(1)}%)
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
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Priority breakdown */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-purple-50/60">
              <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-purple-50/70 to-violet-50/70">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Task Priority Breakdown
                </CardTitle>
                <CardDescription>Tasks by urgency</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {(dashboardData.tasks.byPriority || []).map((g) => {
                    const pct =
                      dashboardData.tasks.total > 0
                        ? (g.count / dashboardData.tasks.total) * 100
                        : 0;
                    const color = PRIORITY_COLOR[g.priority] || "bg-slate-400";
                    return (
                      <div key={g.priority} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn("h-3 w-3 rounded-full", color)}
                            />
                            <span className="text-sm font-medium text-slate-700 capitalize">
                              {g.priority}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {g.count} ({pct.toFixed(1)}%)
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
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Categories */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-cyan-50/60">
            <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-cyan-50/70 to-blue-50/70">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Layers className="h-5 w-5 text-cyan-600" />
                Task Categories
              </CardTitle>
              <CardDescription>Distribution of tasks by category</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {taskCategories.length === 0 ? (
                  <div className="text-sm text-slate-500">No task categories found.</div>
                ) : (
                  <div className="space-y-4">
                    {taskCategories.map((category) => {
                      const percentage = parseFloat(category.percentage);
                      return (
                        <div key={category.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span 
                                className={cn("h-3 w-3 rounded-full", category.color)}
                              />
                              <span className="text-sm font-medium text-slate-700">
                                {category.name}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-slate-900">
                              {category.count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress
                            value={percentage}
                            className={cn(
                              "h-2.5 bg-slate-200 [&>div]:rounded-full",
                              `[&>div]:${category.color}`
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Latest 5 tasks */}
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-50/60">
            <CardHeader className="border-b border-slate-200/70 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    Recent Tasks
                  </CardTitle>
                  <CardDescription>Latest 5 task activities</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="gap-1">
                  <Link href="/admin/tasks">
                    View all <ChevronDown className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                {recentTasks.length === 0 && (
                  <div className="text-sm text-slate-500">No recent tasks.</div>
                )}
                {recentTasks.map((task) => {
                  const isCompleted = task.status === "completed";
                  const isInProgress = task.status === "in_progress";
                  const isOverdue = task.status === "overdue";
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-slate-100/60"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center shadow-sm",
                            isCompleted
                              ? "bg-emerald-100 text-emerald-600"
                              : isInProgress
                              ? "bg-blue-100 text-blue-600"
                              : isOverdue
                              ? "bg-red-100 text-red-600"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : isInProgress ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <Calendar className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {task.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {task.clientName && <span>{task.clientName}</span>}
                            {task.assignedToName && (
                              <span>• {task.assignedToName}</span>
                            )}
                            {task.categoryName && (
                              <span>• {task.categoryName}</span>
                            )}
                            {task.dueDate && (
                              <span>
                                • Due{" "}
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            task.priority === "urgent"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : task.priority === "high"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : task.priority === "medium"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          )}
                        >
                          {task.priority.toUpperCase()}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isInProgress
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : isOverdue
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {titleCase(task.status)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- CLIENTS TAB ---------- */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client status */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-emerald-50/60">
              <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-green-50/70 to-emerald-50/70">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Client Status Overview
                </CardTitle>
                <CardDescription>
                  Distribution of client statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {(dashboardData.clients.byStatus || []).map((g) => {
                    const pct =
                      dashboardData.clients.total > 0
                        ? (g.count / dashboardData.clients.total) * 100
                        : 0;
                    return (
                      <div key={g.status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {g.status}
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {g.count} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          className="h-2.5 bg-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500 [&>div]:rounded-full"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Latest 5 clients */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-50/60">
              <CardHeader className="border-b border-slate-200/70 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Recent Clients
                    </CardTitle>
                    <CardDescription>Latest 5 clients</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="gap-1">
                    <Link href="/admin/clients">
                      View all <ChevronDown className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  {recentClients.length === 0 && (
                    <div className="text-sm text-slate-500">
                      No recent clients.
                    </div>
                  )}
                  {recentClients.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          {c.avatar ? (
                            <AvatarImage src={c.avatar} alt={c.name} />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 font-medium">
                            {c.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-800">{c.name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {c.company && <span>{c.company}</span>}
                            {c.packageName && <span>• {c.packageName}</span>}
                            <span>• {c.taskCount} tasks</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {typeof c.progress === "number" && (
                          <span className="text-xs text-slate-500">
                            {c.progress}%
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            c.status?.toLowerCase() === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {c.status?.toUpperCase() || "UNKNOWN"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- TEAMS TAB ---------- */}
        <TabsContent value="teams" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {allTeams.map((team) => (
              <Card
                key={team.id}
                className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-indigo-50/60"
              >
                <CardHeader className="border-b border-slate-200/70 py-4">
                  <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-600" />
                    {team.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Total Members
                    </span>
                    <span className="font-semibold text-slate-900">
                      {team.totalMembers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Client Members
                    </span>
                    <span className="font-medium text-slate-700">
                      {team.clientMembers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Template Members
                    </span>
                    <span className="font-medium text-slate-700">
                      {team.templateMembers}
                    </span>
                  </div>
                  <Progress
                    value={
                      team.totalMembers > 0
                        ? Math.min((team.totalMembers / 10) * 100, 100)
                        : 0
                    }
                    className="h-2 bg-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-purple-500 [&>div]:rounded-full"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ---------- PERFORMANCE TAB ---------- */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ratings */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-amber-50/60">
              <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-yellow-50/70 to-amber-50/70">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-600" />
                  Performance Ratings
                </CardTitle>
                <CardDescription>Task performance distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {(dashboardData.tasks.performanceRatings || []).map((g) => {
                    const total = (
                      dashboardData.tasks.performanceRatings || []
                    ).reduce((s, x) => s + x.count, 0);
                    const pct = total > 0 ? (g.count / total) * 100 : 0;
                    const color = RATING_COLOR[g.rating] || "bg-slate-400";
                    return (
                      <div key={g.rating} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn("h-3 w-3 rounded-full", color)}
                            />
                            <span className="text-sm font-medium text-slate-700">
                              {g.rating}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {g.count} ({pct.toFixed(1)}%)
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
                  })}
                 </div>
              </CardContent>
            </Card>

            {/* Time metrics */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-cyan-50/60">
              <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-cyan-50/70 to-blue-50/70">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Timer className="h-5 w-5 text-cyan-600" />
                  Time Metrics
                </CardTitle>
                <CardDescription>Completion and cadence</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-slate-900 mb-1">
                    {dashboardData.tasks.avgCompletionTime}
                  </div>
                  <div className="text-sm text-slate-600">
                    Average completion time (minutes)
                  </div>
                </div>
                <div className="space-y-4">
                  <Row
                    label="Tasks completed this week"
                    value={dashboardData.timeMetrics.tasksCompletedThisWeek}
                  />
                  <Row
                    label="Tasks completed this month"
                    value={dashboardData.timeMetrics.tasksCompletedThisMonth}
                  />
                  <Row
                    label="Clients added this week"
                    value={dashboardData.timeMetrics.clientsAddedThisWeek}
                  />
                  <Row
                    label="Clients added this month"
                    value={dashboardData.timeMetrics.clientsAddedThisMonth}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- ACTIVITY TAB ---------- */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest 5 activities */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-50/60">
              <CardHeader className="border-b border-slate-200/70 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-slate-600" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest 5 system activities
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="gap-1">
                    <Link href="/admin/activity">
                      All logs <ChevronDown className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  {recentActivities.length === 0 && (
                    <div className="text-sm text-slate-500">
                      No recent activity.
                    </div>
                  )}
                  {recentActivities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {a.action} on {a.entityType}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          {a.userName && <span>by {a.userName}</span>}
                          <span>
                            • {new Date(a.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Latest 5 notifications */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-amber-50/60">
              <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-orange-50/70 to-amber-50/70">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  Recent Notifications
                </CardTitle>
                <CardDescription>Latest 5 notifications</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  {recentNotifications.length === 0 && (
                    <div className="text-sm text-slate-500">
                      No notifications.
                    </div>
                  )}
                  {recentNotifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-100/60 transition-colors"
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          n.isRead ? "bg-slate-100" : "bg-orange-100"
                        )}
                      >
                        <Bell
                          className={cn(
                            "h-4 w-4",
                            n.isRead ? "text-slate-600" : "text-orange-600"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {n.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="capitalize">
                            {titleCase(n.type)}
                          </span>
                          {n.userName && <span>• {n.userName}</span>}
                          <span>
                            • {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------- USERS TAB ---------- */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role distribution */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-fuchsia-50/60">
              <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-fuchsia-50/70 to-violet-50/70">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-fuchsia-600" />
                  User Role Distribution
                </CardTitle>
                <CardDescription>Users by role</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {(dashboardData.users.roleDistribution || []).map((g) => {
                    const pct =
                      dashboardData.users.total > 0
                        ? (g.count / dashboardData.users.total) * 100
                        : 0;
                    return (
                      <div key={g.role} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {g.role}
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {g.count} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          className="h-2.5 bg-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-fuchsia-500 [&>div]:to-violet-500 [&>div]:rounded-full"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Latest 5 users */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-50/60">
              <CardHeader className="border-b border-slate-200/70 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Users className="h-5 w-5 text-slate-700" />
                      Recent Users
                    </CardTitle>
                    <CardDescription>Latest 5 registered users</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="gap-1">
                    <Link href="/admin/user">
                      View all <ChevronDown className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  {recentUsers.length === 0 && (
                    <div className="text-sm text-slate-500">
                      No recent users.
                    </div>
                  )}
                  {recentUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          {u.image ? (
                            <AvatarImage
                              src={u.image}
                              alt={u.name || u.email}
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 font-medium">
                            {(u.name || u.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-800">
                            {u.name || u.email}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{u.email}</span>
                            {u.roleName && <span>• {u.roleName}</span>}
                            <span>• {u.taskCount} tasks</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          u.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {u.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Extra KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <MetricCard
          title="Packages"
          value={numberFmt(dashboardData.overview.totalPackages)}
          change={`${dashboardData.overview.totalTemplates}`}
          trend="up"
          description="total templates"
          icon={<PackageIcon className="h-6 w-6" />}
          gradient="from-teal-500 to-cyan-500"
          subMetric={`${dashboardData.overview.totalAssignments} assignments`}
        />
        <MetricCard
          title="Conversations"
          value={numberFmt(dashboardData.overview.totalConversations)}
          change={`${dashboardData.overview.totalMessages}`}
          trend="up"
          description="total messages"
          icon={<MessageSquare className="h-6 w-6" />}
          gradient="from-pink-500 to-rose-500"
          subMetric="active chats"
        />
        <MetricCard
          title="Avg Task Time"
          value={`${dashboardData.tasks.avgCompletionTime}m`}
          change={`${dashboardData.tasks.overdue}`}
          trend={dashboardData.tasks.overdue > 0 ? "down" : "up"}
          description="overdue tasks"
          icon={<Timer className="h-6 w-6" />}
          gradient="from-indigo-500 to-purple-500"
          subMetric="completion time"
        />
        
      </div>
    </div>
  );
}

/* -------------------- Small pieces -------------------- */
function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{numberFmt(value)}</span>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description: string;
  icon: React.ReactNode;
  gradient?: string;
  subMetric?: string;
}

function MetricCard({
  title,
  value,
  change,
  trend,
  description,
  icon,
  gradient = "from-blue-500 to-cyan-500",
  subMetric,
}: MetricCardProps) {
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
          <Badge
            variant="outline"
            className={cn(
              "font-medium group-hover:shadow-sm",
              trend === "up"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            )}
          >
            {change}{" "}
            {trend === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 ml-1" />
            )}
          </Badge>
        </div>
        <div className="mt-5">
          <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
          <p className="text-sm text-slate-600 mt-1 font-medium">{title}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-500">{description}</p>
          {subMetric && (
            <p className="text-xs text-slate-400 font-medium">{subMetric}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------- Skeleton -------------------- */
function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full md:w-auto">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-36" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="overflow-hidden border-0 rounded-2xl bg-gradient-to-br from-white to-slate-50/60"
          >
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-xl mb-4" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card
            key={i}
            className="border-0 shadow-lg rounded-2xl overflow-hidden"
          >
            <CardHeader className="border-b border-slate-200/70 py-5">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2.5 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
