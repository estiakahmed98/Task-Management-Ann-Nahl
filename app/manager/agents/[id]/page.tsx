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
  Globe
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const revalidate = 0; // always fresh

function statusBadge(status: string) {
  const map: Record<string, { color: string; icon: ReactElement }> = {
    pending: {
      color: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/50",
      icon: <Clock className="w-3 h-3" />
    },
    in_progress: {
      color: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200/50",
      icon: <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
    },
    completed: {
      color: "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200/50",
      icon: <CheckCircle className="w-3 h-3" />
    },
    overdue: {
      color: "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200/50",
      icon: <AlertTriangle className="w-3 h-3" />
    },
    cancelled: {
      color: "bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-lg shadow-gray-200/50",
      icon: <div className="w-3 h-3 rounded-full bg-white/70" />
    },
  };
  const config = map[status] ?? { 
    color: "bg-gray-100 text-gray-800", 
    icon: <div className="w-3 h-3 rounded-full bg-gray-400" />
  };
  return (
    <Badge className={`font-medium ${config.color} flex items-center gap-1.5 px-3 py-1`}>
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
    urgent: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200/50"
  };
  const cls = map[priority] ?? "bg-gray-100 text-gray-800";
  const stars = priority === 'urgent' ? 3 : priority === 'high' ? 2 : priority === 'medium' ? 1 : 0;
  
  return (
    <Badge className={`font-medium ${cls} flex items-center gap-1 px-2 py-1`}>
      {Array.from({ length: stars }).map((_, i) => (
        <Star key={i} className="w-3 h-3 fill-current" />
      ))}
      {priority.toUpperCase()}
    </Badge>
  );
}

function userStatusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-200/50",
    inactive: "bg-gradient-to-r from-slate-400 to-gray-500 text-white shadow-lg shadow-gray-200/50",
    pending: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200/50",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-800";
  return <Badge className={`${cls} px-3 py-1 font-semibold`}>{status.toUpperCase()}</Badge>;
}

function categoryBadge(category?: string | null) {
  if (!category) return null;
  const colors: Record<string, string> = {
    "Social Team": "bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-200/50",
    "Asset Team": "bg-gradient-to-r from-purple-400 to-violet-500 text-white shadow-lg shadow-purple-200/50",
    "Marketing Team": "bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200/50",
    "Development Team": "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-200/50",
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

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // fetch all tasks assigned to this agent
  const tasks = await prisma.task.findMany({
    where: { assignedToId: agent.id },
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
      client: { select: { id: true, name: true } },
      assignment: { select: { id: true, status: true } },
      templateSiteAsset: { select: { name: true, type: true } },
    },
  });

  // quick stats
  const total = tasks.length;
  
  // Group tasks by client
  const tasksByClient = tasks.reduce((acc, task) => {
    const clientKey = task.client?.id || 'no-client';
    const clientName = task.client?.name || 'Unassigned Tasks';
    
    if (!acc[clientKey]) {
      acc[clientKey] = {
        client: { id: clientKey, name: clientName },
        tasks: []
      };
    }
    acc[clientKey].tasks.push(task);
    return acc;
  }, {} as Record<string, { client: { id: string; name: string }; tasks: any[] }>);
  
  const clientGroups = Object.values(tasksByClient);
  
  const counts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
  };
  const completionRate = total
    ? Math.round((counts.completed / total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30">
      <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
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
                Agent Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive overview and task management</p>
            </div>
          </div>
        </div>

        {/* Agent Profile Card */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32 border-4 border-white shadow-2xl ring-4 ring-indigo-100 dark:ring-indigo-800">
                  <AvatarImage
                    src={agent.image || "/placeholder.svg"}
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">EMAIL</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{agent.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg backdrop-blur-sm">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">PHONE</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{agent.phone ?? "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg backdrop-blur-sm">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg text-white">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">JOINED</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{fmtDate(agent.createdAt)}</p>
                      </div>
                    </div>
                    {agent.address && (
                      <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg backdrop-blur-sm">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-white">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">LOCATION</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{agent.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {agent.biography && (
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Biography</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {agent.biography}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard title="Total Tasks" value={total} tone="slate" />
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

        {/* Client-Based Task Organization */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                Tasks by Client
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Tasks organized by client for better workload management
              </p>
            </div>
            <Badge variant="outline" className="px-4 py-2 text-sm font-semibold border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300">
              {clientGroups.length} Clients • {tasks.length} Total Tasks
            </Badge>
          </div>

          {tasks.length === 0 ? (
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">No Tasks Assigned</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">This agent doesn't have any tasks assigned yet. Tasks will appear here once they are created and assigned.</p>
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
      </div>
    </div>
  );
}

function ClientTaskCard({ clientGroup }: { clientGroup: { client: { id: string; name: string }; tasks: any[] } }) {
  const { client, tasks } = clientGroup;
  const isUnassigned = client.id === 'no-client';
  
  // Calculate client-specific stats
  const clientStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
  };
  
  const completionRate = clientStats.total ? Math.round((clientStats.completed / clientStats.total) * 100) : 0;
  
  return (
    <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/20">
      {/* Client Header */}
      <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-100 dark:border-indigo-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
              isUnassigned 
                ? 'bg-gradient-to-br from-gray-500 to-slate-600' 
                : 'bg-gradient-to-br from-indigo-500 to-purple-600'
            }`}>
              {isUnassigned ? '?' : client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className={`text-xl font-bold ${
                isUnassigned 
                  ? 'text-gray-700 dark:text-gray-300' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400'
              }`}>
                {client.name}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {clientStats.total} task{clientStats.total !== 1 ? 's' : ''} • {completionRate}% completion rate
              </CardDescription>
            </div>
          </div>
          
          {/* Client Stats */}
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
            <Badge variant="outline" className="px-3 py-1 font-semibold border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300">
              {clientStats.total} Total
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {/* Tasks List */}
      <CardContent className="p-0">
        <div className="space-y-0">
          {tasks.map((task, index) => (
            <TaskListItem key={task.id} task={task} isLast={index === tasks.length - 1} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskListItem({ task, isLast }: { task: any; isLast?: boolean }) {
  const isOverdue = task.status === 'overdue';
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  
  return (
    <div className={`group relative p-6 transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 ${
      !isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''
    } ${
      isOverdue ? 'bg-gradient-to-r from-red-50/30 to-transparent dark:from-red-900/10 dark:to-transparent' : 
      isCompleted ? 'bg-gradient-to-r from-emerald-50/30 to-transparent dark:from-emerald-900/10 dark:to-transparent' :
      isInProgress ? 'bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/10 dark:to-transparent' : ''
    }`}>
      {/* Priority Indicator Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
        task.priority === 'urgent' ? 'bg-gradient-to-b from-purple-500 to-indigo-600' :
        task.priority === 'high' ? 'bg-gradient-to-b from-red-500 to-pink-600' :
        task.priority === 'medium' ? 'bg-gradient-to-b from-yellow-500 to-orange-600' :
        'bg-gradient-to-b from-green-500 to-emerald-600'
      }`} />
      
      <div className="flex items-center justify-between gap-6">
        {/* Main Task Info */}
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
                    <span className="font-medium">{task.templateSiteAsset.name}</span>
                    {task.templateSiteAsset.type && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5 border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300">
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
        
        {/* Date Information */}
        <div className="flex flex-col gap-3 text-right min-w-0">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Due:</span>
              <span className={`font-semibold ${
                isOverdue ? 'text-red-600 dark:text-red-400' : 
                'text-gray-900 dark:text-gray-100'
              }`}>
                {fmtDate(task.dueDate)}
              </span>
            </div>
            
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Created:</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {fmtDate(task.createdAt)}
              </span>
            </div>
            
            {task.completedAt && (
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Completed:</span>
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
      shadow: "shadow-slate-200/50"
    },
    blue: {
      from: "from-blue-500",
      to: "to-indigo-600",
      text: "text-white",
      sub: "text-blue-100",
      shadow: "shadow-blue-200/50"
    },
    amber: {
      from: "from-amber-500",
      to: "to-orange-600",
      text: "text-white",
      sub: "text-amber-100",
      shadow: "shadow-amber-200/50"
    },
    emerald: {
      from: "from-emerald-500",
      to: "to-green-600",
      text: "text-white",
      sub: "text-emerald-100",
      shadow: "shadow-emerald-200/50"
    },
    red: {
      from: "from-red-500",
      to: "to-rose-600",
      text: "text-white",
      sub: "text-red-100",
      shadow: "shadow-red-200/50"
    },
    violet: {
      from: "from-violet-500",
      to: "to-purple-600",
      text: "text-white",
      sub: "text-violet-100",
      shadow: "shadow-violet-200/50"
    },
  };
  const t = tones[tone];
  return (
    <Card
      className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${t.from} ${t.to} ${t.text} ${t.shadow} hover:scale-105`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="relative pb-2">
        <CardTitle className={`text-sm font-semibold ${t.sub} uppercase tracking-wide`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

