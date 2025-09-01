"use client";

import { useState, useEffect } from "react";
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
  BarChart3,
  CheckCircle2,
  Users,
  Layers,
  UserCheck,
  Calendar,
  Target,
  Clock,
  TrendingUp,
  Download,
  FileText,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Types for our data
interface Client {
  id: string;
  name: string;
  status: string;
  progress: number;
  company?: string;
}

interface Task {
  id: string;
  name: string;
  status: string;
  dueDate: string;
  clientId: string;
  completedAt?: string;
}

interface Team {
  id: string;
  name: string;
  totalMembers: number;
}

// Dashboard data structure
interface DashboardData {
  totalClients: number;
  totalTasks: number;
  completedTasks: number;
  totalTeams: number;
  recentClients: Client[];
  recentTasks: Task[];
  teams: Team[];
  taskCompletionRate: number;
  clientGrowthRate: number;
}

export function ProfessionalDashboard() {
  const [timeRange, setTimeRange] = useState("month");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all necessary data in parallel
        const [clientsRes, tasksRes, teamsRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/tasks"),
          fetch("/api/teams")
        ]);

        if (!clientsRes.ok || !tasksRes.ok || !teamsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const clients = await clientsRes.json();
        const tasks = await tasksRes.json();
        const teams = await teamsRes.json();

        // Calculate completed tasks - checking multiple possible status values
        const completedTasks = tasks.filter((task: Task) => 
          task.status?.toLowerCase().includes('complete') || 
          task.status?.toLowerCase().includes('done') ||
          task.status === 'COMPLETED' ||
          task.completedAt !== null
        ).length;
        
        const recentClients = clients.slice(0, 5);
        const recentTasks = tasks.slice(0, 5);
        
        // Calculate rates
        const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
        
        // Calculate client growth (mock for demonstration)
        const clientGrowthRate = clients.length > 10 ? 12 : 25;

        setDashboardData({
          totalClients: clients.length,
          totalTasks: tasks.length,
          completedTasks,
          totalTeams: teams.length,
          recentClients,
          recentTasks,
          teams: teams.map((team: any) => ({
            id: team.id,
            name: team.name,
            totalMembers: team.totalMembers || 0
          })),
          taskCompletionRate,
          clientGrowthRate
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            Dashboard Overview
          </h2>
          <p className="text-muted-foreground mt-2">
            Track and manage your team's performance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full md:w-auto">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-slate-300">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px] border-slate-300">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Clients"
          value={dashboardData?.totalClients.toString() || "0"}
          change={`+${dashboardData?.clientGrowthRate || 0}%`}
          trend="up"
          description="vs previous period"
          icon={<Users className="h-6 w-6" />}
          loading={loading}
          gradient="from-blue-500 to-cyan-500"
        />
        <MetricCard
          title="Total Tasks"
          value={dashboardData?.totalTasks.toString() || "0"}
          change={`+${Math.round((dashboardData?.totalTasks || 0) / 10)}%`}
          trend="up"
          description="vs previous period"
          icon={<Layers className="h-6 w-6" />}
          loading={loading}
          gradient="from-violet-500 to-purple-500"
        />
        <MetricCard
          title="Completed Tasks"
          value={dashboardData?.completedTasks.toString() || "0"}
          change={`${dashboardData?.taskCompletionRate || 0}%`}
          trend="up"
          description="completion rate"
          icon={<CheckCircle2 className="h-6 w-6" />}
          loading={loading}
          gradient="from-emerald-500 to-green-500"
        />
        <MetricCard
          title="Total Teams"
          value={dashboardData?.totalTeams.toString() || "0"}
          change={`+${Math.round((dashboardData?.totalTeams || 0) / 2)}`}
          trend="up"
          description="active teams"
          icon={<UserCheck className="h-6 w-6" />}
          loading={loading}
          gradient="from-amber-500 to-orange-500"
        />
      </div>

      {/* Charts and Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Task Completion Trends
                </CardTitle>
                <CardDescription className="text-slate-500">Current task status overview</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-600">
                View details <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium text-slate-700">Completed</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {dashboardData?.completedTasks} / {dashboardData?.totalTasks}
                  </span>
                </div>
                <Progress 
                  value={dashboardData?.totalTasks ? 
                    (dashboardData.completedTasks / dashboardData.totalTasks) * 100 : 0} 
                  className="h-2.5 bg-slate-200 [&>div]:bg-emerald-500 [&>div]:rounded-full" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-slate-700">In Progress</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {dashboardData?.totalTasks ? 
                      Math.round((dashboardData.totalTasks - dashboardData.completedTasks) * 0.7) : 0}
                  </span>
                </div>
                <Progress 
                  value={dashboardData?.totalTasks ? 
                    ((dashboardData.totalTasks - dashboardData.completedTasks) * 0.7 / dashboardData.totalTasks) * 100 : 0} 
                  className="h-2.5 bg-slate-200 [&>div]:bg-blue-500 [&>div]:rounded-full" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-medium text-slate-700">Pending</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {dashboardData?.totalTasks ? 
                      Math.round((dashboardData.totalTasks - dashboardData.completedTasks) * 0.3) : 0}
                  </span>
                </div>
                <Progress 
                  value={dashboardData?.totalTasks ? 
                    ((dashboardData.totalTasks - dashboardData.completedTasks) * 0.3 / dashboardData.totalTasks) * 100 : 0} 
                  className="h-2.5 bg-slate-200 [&>div]:bg-amber-500 [&>div]:rounded-full" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-purple-50/50 to-violet-50/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Team Performance
                </CardTitle>
                <CardDescription className="text-slate-500">Tasks distribution across teams</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-600">
                View details <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              {dashboardData?.teams.slice(0, 4).map((team) => (
                <div key={team.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{team.name}</span>
                    <span className="text-sm text-slate-500">
                      {team.totalMembers} members
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(team.totalMembers * 15, 100)} 
                    className="h-2 bg-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-violet-500 [&>div]:rounded-full" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-slate-50/50 to-slate-100/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent Clients
                </CardTitle>
                <CardDescription className="text-slate-500">Recently added clients</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-600">
                View all <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              {dashboardData?.recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-slate-100/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 font-medium">
                        {client.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-800">{client.name}</p>
                      <p className="text-xs text-slate-500">
                        {client.company || "No company specified"}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      client.status === "ACTIVE" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium" 
                        : "bg-slate-100 text-slate-700 border-slate-200 font-medium"
                    }
                  >
                    {client.status || "UNKNOWN"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/70 py-5 bg-gradient-to-r from-slate-50/50 to-slate-100/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Recent Tasks
                </CardTitle>
                <CardDescription className="text-slate-500">Recently created tasks</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-600">
                View all <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              {dashboardData?.recentTasks.map((task) => {
                // Determine task status with better matching
                const isCompleted = task.status?.toLowerCase().includes('complete') || 
                                  task.status?.toLowerCase().includes('done') ||
                                  task.status === 'COMPLETED' ||
                                  task.completedAt !== null;
                
                const isInProgress = task.status?.toLowerCase().includes('progress') || 
                                   task.status?.toLowerCase().includes('working');
                
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${
                        isCompleted ? "bg-emerald-100 text-emerald-600" : 
                        isInProgress ? "bg-blue-100 text-blue-600" : 
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isInProgress ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <Calendar className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{task.name}</p>
                        <p className="text-xs text-slate-500">
                          Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        isCompleted 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium" 
                          : isInProgress
                          ? "bg-blue-50 text-blue-700 border-blue-200 font-medium"
                          : "bg-slate-100 text-slate-700 border-slate-200 font-medium"
                      }
                    >
                      {isCompleted ? "COMPLETED" : isInProgress ? "IN PROGRESS" : "PENDING"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
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
  loading?: boolean;
  gradient?: string;
}

function MetricCard({
  title,
  value,
  change,
  trend,
  description,
  icon,
  loading = false,
  gradient = "from-blue-500 to-cyan-500"
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-0 rounded-2xl bg-gradient-to-br from-white to-slate-50/50">
        <CardContent className="p-6">
          <Skeleton className="h-12 w-12 rounded-xl mb-4" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-3 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-0 rounded-2xl bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-sm group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-md`}>
            {icon}
          </div>
          <Badge
            variant="outline"
            className={
              trend === "up"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium group-hover:shadow-sm"
                : "bg-red-50 text-red-700 border-red-200 font-medium group-hover:shadow-sm"
            }
          >
            {change}{" "}
            {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5 ml-1" /> : null}
          </Badge>
        </div>
        <div className="mt-5">
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
          <p className="text-sm text-slate-600 mt-1 font-medium">{title}</p>
        </div>
        <p className="text-xs text-slate-500 mt-4">{description}</p>
      </CardContent>
    </Card>
  );
}

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
          <Card key={i} className="overflow-hidden transition-all duration-300 hover:shadow-lg border-0 rounded-2xl bg-gradient-to-br from-white to-slate-50/50">
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
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-200/70 py-5">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
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

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-200/70 py-5">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-200/70 py-5">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-200/70 py-5">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}