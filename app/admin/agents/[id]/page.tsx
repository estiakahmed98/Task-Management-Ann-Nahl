import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  ArrowLeft,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Star,
  Building,
  Globe,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Award,
  Target,
  Activity,
  FileCheck,
  Timer,
  Filter,
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import PerformanceFilterSelect from "@/components/agents/performance-filter-select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

export const revalidate = 0; // always fresh

// Performance filter types
type PerformanceFilter = "today" | "weekly" | "monthly" | "yearly" | "all";

interface TaskWithDetails {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  completedAt: Date | null;
  performanceRating: string | null;
  qcReview: any;
  qcTotalScore: number | null;
  idealDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  completionLink: string | null;
  client: { id: string; name: string; company: string | null } | null;
  assignment: { id: string; status: string | null } | null;
  templateSiteAsset: { name: string; type: string } | null;
  category: { name: string } | null;
}

function getDateRange(filter: PerformanceFilter): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case "today":
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    case "weekly":
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return {
        start: weekStart,
        end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1),
      };
    case "monthly":
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      return { start: monthStart, end: monthEnd };
    case "yearly":
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
      return { start: yearStart, end: yearEnd };
    default: // 'all'
      return {
        start: new Date("2020-01-01"),
        end: new Date("2030-12-31"),
      };
  }
}

function statusBadge(status: string) {
  const map: Record<string, { color: string; icon: ReactElement }> = {
    pending: {
      color:
        "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/50",
      icon: <Clock className="w-3 h-3" />,
    },
    in_progress: {
      color:
        "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200/50",
      icon: <div className="w-3 h-3 rounded-full bg-white animate-pulse" />,
    },
    completed: {
      color:
        "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200/50",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    overdue: {
      color:
        "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200/50",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    cancelled: {
      color:
        "bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-lg shadow-gray-200/50",
      icon: <div className="w-3 h-3 rounded-full bg-white/70" />,
    },
    reassigned: {
      color:
        "bg-gradient-to-r from-purple-400 to-violet-500 text-white shadow-lg shadow-purple-200/50",
      icon: <Activity className="w-3 h-3" />,
    },
    qc_approved: {
      color:
        "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200/50",
      icon: <Award className="w-3 h-3" />,
    },
  };
  const config = map[status] ?? {
    color: "bg-gray-100 text-gray-800",
    icon: <div className="w-3 h-3 rounded-full bg-gray-400" />,
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

function performanceRatingBadge(rating: string | null) {
  if (!rating) return null;

  const map: Record<string, { color: string; icon: ReactElement }> = {
    Excellent: {
      color:
        "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200/50",
      icon: <Award className="w-3 h-3" />,
    },
    Good: {
      color:
        "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200/50",
      icon: <TrendingUp className="w-3 h-3" />,
    },
    Average: {
      color:
        "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-200/50",
      icon: <Target className="w-3 h-3" />,
    },
    Poor: {
      color:
        "bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-200/50",
      icon: <TrendingDown className="w-3 h-3" />,
    },
    Lazy: {
      color:
        "bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-200/50",
      icon: <Clock className="w-3 h-3" />,
    },
  };

  const config = map[rating] ?? {
    color: "bg-gray-100 text-gray-800",
    icon: <div className="w-3 h-3 rounded-full bg-gray-400" />,
  };

  return (
    <Badge
      className={`font-medium ${config.color} flex items-center gap-1.5 px-3 py-1`}
    >
      {config.icon}
      {rating}
    </Badge>
  );
}

function qcScoreBadge(score: number | null) {
  if (!score) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90)
      return "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200/50";
    if (score >= 80)
      return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200/50";
    if (score >= 70)
      return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-200/50";
    if (score >= 60)
      return "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200/50";
    return "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200/50";
  };

  return (
    <Badge
      className={`font-medium ${getScoreColor(
        score
      )} flex items-center gap-1.5 px-3 py-1`}
    >
      <FileCheck className="w-3 h-3" />
      QC: {score}/100
    </Badge>
  );
}

function userStatusBadge(status: string) {
  const map: Record<string, string> = {
    active:
      "bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-200/50",
    inactive:
      "bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-lg shadow-gray-200/50",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-800";
  return (
    <Badge className={`${cls} px-3 py-1 font-semibold`}>
      {status.toUpperCase()}
    </Badge>
  );
}

function categoryBadge(category?: string | null) {
  if (!category) return null;
  const colors: Record<string, string> = {
    "Social Team":
      "bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-200/50",
    "Asset Team":
      "bg-gradient-to-r from-purple-400 to-violet-500 text-white shadow-lg shadow-purple-200/50",
    "Marketing Team":
      "bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200/50",
    "Development Team":
      "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200/50",
  };
  const cls = colors[category] ?? "bg-gray-100 text-gray-800";
  return <Badge className={`font-semibold ${cls} px-3 py-1`}>{category}</Badge>;
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

function fmtDateTime(d?: Date | string | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export default async function AgentPerformancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: PerformanceFilter }>;
}) {
  const { id } = await params;
  const { filter = "all" } = await searchParams;

  const agent = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      category: true,
      address: true,
      biography: true,
      status: true,
      image: true,
      createdAt: true,
    },
  });

  if (!agent) return notFound();

  // Get date range based on filter
  const { start, end } = getDateRange(filter);

  // Fetch tasks with performance data based on filter
  const tasks = await prisma.task.findMany({
    where: {
      assignedToId: agent.id,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      completedAt: true,
      performanceRating: true,
      qcReview: true,
      qcTotalScore: true,
      idealDurationMinutes: true,
      actualDurationMinutes: true,
      completionLink: true,
      client: {
        select: {
          id: true,
          name: true,
          company: true,
        },
      },
      assignment: {
        select: {
          id: true,
          status: true,
        },
      },
      templateSiteAsset: {
        select: {
          name: true,
          type: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  // Calculate comprehensive performance metrics
  const performanceMetrics = calculatePerformanceMetrics(tasks);

  // Group tasks by client for better organization
  const tasksByClient = tasks.reduce((acc, task) => {
    const clientKey = task.client?.id || "no-client";
    const clientName = task.client?.name || "Unassigned Tasks";
    const clientCompany = task.client?.company || "";

    if (!acc[clientKey]) {
      acc[clientKey] = {
        client: { id: clientKey, name: clientName, company: clientCompany },
        tasks: [],
      };
    }
    acc[clientKey].tasks.push(task);
    return acc;
  }, {} as Record<string, { client: { id: string; name: string; company: string }; tasks: TaskWithDetails[] }>);

  const clientGroups = Object.values(tasksByClient);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30">
      <div className="w-full mx-auto py-8 px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/agents">
              <Button
                variant="outline"
                className="border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-700 dark:hover:bg-indigo-900/20 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Agents
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Agent Performance Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive performance analytics and task management
              </p>
            </div>
          </div>

          {/* Performance Filter */}
          {/* Performance Filter (no server-side event handlers) */}
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <PerformanceFilterSelect value={filter} />
          </div>
        </div>

        {/* Agent Profile Card */}
        <AgentProfileCard agent={agent} />

        {/* Performance Metrics Dashboard */}
        <PerformanceMetricsCard metrics={performanceMetrics} filter={filter} />

        {/* Tasks Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                Performance Tasks ({filter.replace("_", " ").toUpperCase()})
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Detailed task performance with QC reviews and ratings
              </p>
            </div>
            <Badge
              variant="outline"
              className="px-4 py-2 text-sm font-semibold border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300"
            >
              {clientGroups.length} Client{clientGroups.length !== 1 ? "s" : ""}{" "}
              • {tasks.length} Task{tasks.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {tasks.length === 0 ? (
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <BarChart3 className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                  No Tasks for {filter.replace("_", " ").toUpperCase()} Period
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  No tasks were found for the selected time period. Try
                  adjusting the filter or check other time ranges.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion
              type="multiple"
              className="space-y-4" /* no defaultValue => none open by default */
            >
              {clientGroups.map((group) => (
                <ClientAccordionItem
                  key={group.client.id}
                  clientGroup={group}
                />
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </div>
  );
}

function calculatePerformanceMetrics(tasks: any[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const overdue = tasks.filter((t) => t.status === "overdue").length;
  const cancelled = tasks.filter((t) => t.status === "cancelled").length;
  const qcApproved = tasks.filter((t) => t.status === "qc_approved").length;

  const completionRate = total ? Math.round((qcApproved / total) * 100) : 0;
  const qcApprovalRate = total ? Math.round((qcApproved / total) * 100) : 0;

  // Performance ratings analysis
  const ratingsCount = {
    Excellent: tasks.filter((t) => t.performanceRating === "Excellent").length,
    Good: tasks.filter((t) => t.performanceRating === "Good").length,
    Average: tasks.filter((t) => t.performanceRating === "Average").length,
    Poor: tasks.filter((t) => t.performanceRating === "Poor").length,
    Lazy: tasks.filter((t) => t.performanceRating === "Lazy").length,
  };

  // QC Score analysis
  const qcScores = tasks
    .filter((t) => t.qcTotalScore !== null)
    .map((t) => t.qcTotalScore);
  const avgQcScore = qcScores.length
    ? Math.round(qcScores.reduce((a, b) => a + b, 0) / qcScores.length)
    : 0;

  // Duration analysis
  const tasksWithDuration = tasks.filter(
    (t) => t.actualDurationMinutes && t.idealDurationMinutes
  );
  const avgEfficiency = tasksWithDuration.length
    ? Math.round(
        tasksWithDuration.reduce((acc, task) => {
          const efficiency =
            (task.idealDurationMinutes / task.actualDurationMinutes) * 100;
          return acc + Math.min(efficiency, 200); // Cap at 200% efficiency
        }, 0) / tasksWithDuration.length
      )
    : 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    overdue,
    cancelled,
    qcApproved,
    completionRate,
    qcApprovalRate,
    ratingsCount,
    avgQcScore,
    avgEfficiency,
    tasksWithRating: tasks.filter((t) => t.performanceRating).length,
    tasksWithQcReview: tasks.filter((t) => t.qcReview).length,
  };
}

function AgentProfileCard({ agent }: { agent: any }) {
  return (
    <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
          <div className="flex-shrink-0">
            <Avatar className="h-32 w-32 border-4 border-white shadow-2xl ring-4 ring-indigo-100 dark:ring-indigo-800">
              <AvatarImage
                src={agent.image ?? undefined}
                alt={`${agent.firstName ?? ""} ${agent.lastName ?? ""}`}
              />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl font-bold">
                {agent.firstName?.[0] ?? "A"}
                {agent.lastName?.[0] ?? "G"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                  {agent.firstName} {agent.lastName}
                </h2>
                {userStatusBadge(agent.status)}
                {categoryBadge(agent.category)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg text-white">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      EMAIL
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {agent.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      PHONE
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {agent.phone ?? "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg backdrop-blur-sm">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg text-white">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      JOINED
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {fmtDate(agent.createdAt)}
                    </p>
                  </div>
                </div>
                {agent.address && (
                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg backdrop-blur-sm">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-white">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        LOCATION
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {agent.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {agent.biography && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Biography
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {agent.biography}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceMetricsCard({
  metrics,
  filter,
}: {
  metrics: any;
  filter: PerformanceFilter;
}) {
  const periodLabel =
    filter === "today"
      ? "Today"
      : filter === "weekly"
      ? "This Week"
      : filter === "monthly"
      ? "This Month"
      : filter === "yearly"
      ? "This Year"
      : "All Time";

  return (
    <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-100 dark:border-indigo-800">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          Performance Analytics - {periodLabel}
        </CardTitle>
        <CardDescription>
          Comprehensive performance metrics and quality analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        {/* Primary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          <KpiCard title="Total Tasks" value={metrics.total} tone="slate" />
          <KpiCard title="Completed" value={metrics.completed} tone="emerald" />
          <KpiCard title="In Progress" value={metrics.inProgress} tone="blue" />
          <KpiCard title="Pending" value={metrics.pending} tone="amber" />
          <KpiCard title="Overdue" value={metrics.overdue} tone="red" />
          <KpiCard
            title="QC Approved"
            value={metrics.qcApproved}
            tone="violet"
          />
          <KpiCard
            title="Success Rate"
            value={`${metrics.completionRate}%`}
            tone="emerald"
          />
        </div>

        <Separator className="my-6" />

        {/* Performance Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Ratings */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                <Award className="w-4 h-4" />
                Performance Ratings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(metrics.ratingsCount).map(([rating, count]) => (
                <div key={rating} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {performanceRatingBadge(rating)}
                  </div>
                  <Badge variant="outline" className="font-semibold">
                    {String(count)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quality Control */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Quality Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {metrics.avgQcScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Average QC Score
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tasks with QC Review
                </span>
                <Badge variant="outline" className="font-semibold">
                  {metrics.tasksWithQcReview}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  QC Approval Rate
                </span>
                <Badge
                  className={`font-semibold ${
                    metrics.qcApprovalRate >= 80
                      ? "bg-emerald-500"
                      : metrics.qcApprovalRate >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  } text-white`}
                >
                  {metrics.qcApprovalRate}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Efficiency Metrics */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Efficiency Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {metrics.avgEfficiency}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Average Efficiency
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tasks with Performance Rating
                </span>
                <Badge variant="outline" className="font-semibold">
                  {metrics.tasksWithRating}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

function ClientPerformanceCard({
  clientGroup,
}: {
  clientGroup: {
    client: { id: string; name: string; company: string };
    tasks: TaskWithDetails[];
  };
}) {
  const { client, tasks } = clientGroup;
  const isUnassigned = client.id === "no-client";

  // Calculate client-specific performance stats
  const clientStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
    qc_approved: tasks.filter((t) => t.status === "qc_approved").length,
    avgQcScore:
      tasks.filter((t) => t.qcTotalScore).length > 0
        ? Math.round(
            tasks
              .filter((t) => t.qcTotalScore)
              .reduce((acc, t) => acc + (t.qcTotalScore || 0), 0) /
              tasks.filter((t) => t.qcTotalScore).length
          )
        : 0,
  };

  const completionRate = clientStats.total
    ? Math.round((clientStats.completed / clientStats.total) * 100)
    : 0;

  return (
    <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20">
      {/* Client Header */}
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
                {client.company && <span>{client.company} • </span>}
                {clientStats.total} task{clientStats.total !== 1 ? "s" : ""} •{" "}
                {completionRate}% completion •{" "}
                {clientStats.avgQcScore > 0
                  ? `${clientStats.avgQcScore} avg QC`
                  : "No QC data"}
              </CardDescription>
            </div>
          </div>

          {/* Client Performance Stats */}
          <div className="flex items-center gap-2 flex-wrap">
            {clientStats.pending > 0 && (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/50 px-2 py-1">
                {clientStats.pending} Pending
              </Badge>
            )}
            {clientStats.in_progress > 0 && (
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200/50 px-2 py-1">
                {clientStats.in_progress} Progress
              </Badge>
            )}
            {clientStats.overdue > 0 && (
              <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200/50 px-2 py-1">
                {clientStats.overdue} Overdue
              </Badge>
            )}
            {clientStats.qc_approved > 0 && (
              <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200/50 px-2 py-1">
                {clientStats.qc_approved} QC Approved
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Tasks List */}
      <CardContent className="p-0">
        <div className="space-y-0">
          {tasks.map((task, index) => (
            <PerformanceTaskItem
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

function PerformanceTaskItem({
  task,
  isLast,
}: {
  task: TaskWithDetails;
  isLast?: boolean;
}) {
  const isOverdue = task.status === "overdue";
  const isCompleted = task.status === "completed";
  const isInProgress = task.status === "in_progress";
  const isQcApproved = task.status === "qc_approved";

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
          : isQcApproved
          ? "bg-gradient-to-r from-teal-50/30 to-transparent dark:from-teal-900/10 dark:to-transparent"
          : ""
      }`}
    >
      {/* Priority Indicator Bar */}
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

      <div className="space-y-4 g">
        {/* Task Header */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                {task.name}
              </h3>
              {statusBadge(task.status)}
              {priorityBadge(task.priority)}
              {performanceRatingBadge(task.performanceRating)}
              {qcScoreBadge(task.qcTotalScore)}
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
              {task.templateSiteAsset && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">
                    {task.templateSiteAsset.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0.5 border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                  >
                    {task.templateSiteAsset.type}
                  </Badge>
                </div>
              )}

              {task.category && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium">{task.category.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Date Information */}
          <div className="text-right min-w-0 space-y-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Due:{" "}
              <span
                className={`font-semibold ${
                  isOverdue
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {fmtDate(task.dueDate)}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Created:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {fmtDate(task.createdAt)}
              </span>
            </div>
            {task.completedAt && (
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Completed:{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {fmtDateTime(task.completedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Duration & Efficiency */}
          <Card className="border border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Timer className="w-3 h-3" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Ideal:
                  </span>
                  <span className="font-medium">
                    {formatDuration(task.idealDurationMinutes)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Actual:
                  </span>
                  <span className="font-medium">
                    {formatDuration(task.actualDurationMinutes)}
                  </span>
                </div>
                {task.idealDurationMinutes && task.actualDurationMinutes && (
                  <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-gray-600 dark:text-gray-400">
                      Efficiency:
                    </span>
                    <Badge
                      className={`text-xs ${
                        task.idealDurationMinutes /
                          task.actualDurationMinutes >=
                        1
                          ? "bg-emerald-500"
                          : task.idealDurationMinutes /
                              task.actualDurationMinutes >=
                            0.8
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      } text-white`}
                    >
                      {Math.round(
                        (task.idealDurationMinutes /
                          task.actualDurationMinutes) *
                          100
                      )}
                      %
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QC Review Details */}
          <Card className="border border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <FileCheck className="w-3 h-3" />
                QC Review
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {task.qcReview || task.qcTotalScore ? (
                <div className="space-y-2 text-sm">
                  {task.qcTotalScore && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Score:
                      </span>
                      <Badge
                        className={`text-xs ${
                          task.qcTotalScore >= 90
                            ? "bg-emerald-500"
                            : task.qcTotalScore >= 80
                            ? "bg-blue-500"
                            : task.qcTotalScore >= 70
                            ? "bg-yellow-500"
                            : task.qcTotalScore >= 60
                            ? "bg-orange-500"
                            : "bg-red-500"
                        } text-white`}
                      >
                        {task.qcTotalScore}/100
                      </Badge>
                    </div>
                  )}
                  {task.qcReview && typeof task.qcReview === "object" && (
                    <div className="space-y-1">
                      {Object.entries(task.qcReview as Record<string, any>)
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400 capitalize text-xs truncate">
                              {key.replace(/([A-Z])/g, " $1").trim()}:
                            </span>
                            <span className="font-medium text-xs">
                              {typeof value === "boolean"
                                ? value
                                  ? "✓"
                                  : "✗"
                                : typeof value === "number"
                                ? value
                                : String(value).slice(0, 10) +
                                  (String(value).length > 10 ? "..." : "")}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                  No QC data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                {task.completionLink && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">
                      Completion Link:
                    </span>
                    <div className="mt-1">
                      <a
                        href={task.completionLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs break-all"
                      >
                        {task.completionLink.length > 30
                          ? `${task.completionLink.substring(0, 30)}...`
                          : task.completionLink}
                      </a>
                    </div>
                  </div>
                )}
                {task.assignment && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Assignment:
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {task.assignment.status || "Active"}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

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


function getClientStats(tasks: TaskWithDetails[]) {
  const count = (s: TaskWithDetails["status"]) =>
    tasks.filter((t) => t.status === s).length;

  const total = tasks.length;
  const pending = count("pending");
  const in_progress = count("in_progress");
  const completed = count("completed");
  const overdue = count("overdue");
  const qc_approved = count("qc_approved");

  // ⬇️ Only qc_approved tasks contribute to QC average
  const qcApprovedScores = tasks
    .filter((t) => t.status === "qc_approved" && typeof t.qcTotalScore === "number")
    .map((t) => t.qcTotalScore as number);

  const avgQcScore = qcApprovedScores.length
    ? Math.round(qcApprovedScores.reduce((a, b) => a + b, 0) / qcApprovedScores.length)
    : 0;

  const completionRate = total ? Math.round((qc_approved / total) * 100) : 0;

  return {
    total,
    pending,
    in_progress,
    overdue,
    qc_approved,
    completed,
    avgQcScore,
    completionRate,
  };
}



function ClientAccordionItem({
  clientGroup,
}: {
  clientGroup: {
    client: { id: string; name: string; company: string };
    tasks: TaskWithDetails[];
  };
}) {
  const { client, tasks } = clientGroup;
  const isUnassigned = client.id === "no-client";
  const stats = getClientStats(tasks);

  return (
    <AccordionItem
      value={client.id}
      className="group rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm overflow-hidden"
    >
      {/* Remove your custom ChevronDown — shadcn adds one automatically */}
      <AccordionTrigger
        className="
          px-5 py-4 hover:no-underline
          data-[state=open]:bg-gradient-to-r data-[state=open]:from-indigo-50/70 data-[state=open]:to-purple-50/70
          dark:data-[state=open]:from-indigo-900/20 dark:data-[state=open]:to-purple-900/20
          [&>svg]:text-slate-500
        "
      >
        <div className="flex w-full items-center justify-between gap-4">
          {/* Left: Identity & meta */}
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={`
                relative w-11 h-11 rounded-xl text-white font-semibold shadow
                flex items-center justify-center overflow-hidden
                ${isUnassigned
                  ? "bg-gradient-to-br from-slate-500 to-slate-700"
                  : "bg-gradient-to-br from-indigo-500 to-purple-600"}
              `}
            >
              <span className="relative z-10">
                {isUnassigned ? "?" : client.name.charAt(0).toUpperCase()}
              </span>
              <div className="absolute inset-0 opacity-20 bg-white" />
            </div>

            <div className="min-w-0">
              <div
                className={`text-base font-bold truncate ${
                  isUnassigned
                    ? "text-slate-800 dark:text-slate-200"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400"
                }`}
              >
                {client.name}
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {client.company ? `${client.company} • ` : ""}
                {stats.total} task{stats.total !== 1 ? "s" : ""} •{" "}
                {stats.completionRate}% completion •{" "}
                {stats.avgQcScore ? `${stats.avgQcScore} avg QC` : "No QC data"}
              </div>

              {/* Slim completion progress */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: status chips */}
          <div className="hidden md:flex items-center gap-1.5 flex-wrap">
            {stats.pending > 0 && (
              <Badge className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow">
                {stats.pending} Pending
              </Badge>
            )}
            {stats.in_progress > 0 && (
              <Badge className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow">
                {stats.in_progress} Progress
              </Badge>
            )}
            {stats.overdue > 0 && (
              <Badge className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-rose-500 text-white shadow">
                {stats.overdue} Overdue
              </Badge>
            )}
            {stats.qc_approved > 0 && (
              <Badge className="px-2 py-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow">
                {stats.qc_approved} QC
              </Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="p-0 border-t border-slate-100 dark:border-slate-800">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {tasks.map((task, idx) => (
            <PerformanceTaskItem
              key={task.id}
              task={task}
              isLast={idx === tasks.length - 1}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

