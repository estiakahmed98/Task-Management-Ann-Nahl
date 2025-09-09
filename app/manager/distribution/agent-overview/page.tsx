"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Briefcase,
  BarChart3,
  Calendar,
  ArrowUpDown,
} from "lucide-react";

// Mock data for agents with assigned tasks
const mockAgents = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    department: "Development",
    role: "Senior Agent",
    status: "active",
    capacity: 10,
    tasks: [
      {
        id: "task4",
        title: "Mobile App Development",
        description: "Create iOS and Android applications",
        status: "in_progress",
        priority: "high",
        deadline: "2024-03-01",
        clientId: "2",
        clientName: "TechStart Inc.",
        estimatedHours: 40,
        completedHours: 15,
      },
      {
        id: "task10",
        title: "API Integration",
        description: "Integrate payment gateway API",
        status: "pending",
        priority: "medium",
        deadline: "2024-03-10",
        clientId: "5",
        clientName: "FinTech Solutions",
        estimatedHours: 20,
        completedHours: 0,
      },
      {
        id: "task11",
        title: "Database Optimization",
        description: "Improve database performance",
        status: "in_progress",
        priority: "high",
        deadline: "2024-02-25",
        clientId: "5",
        clientName: "FinTech Solutions",
        estimatedHours: 15,
        completedHours: 8,
      },
    ],
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael@company.com",
    department: "Design",
    role: "Agent",
    status: "active",
    capacity: 8,
    tasks: [
      {
        id: "task1",
        title: "Website Redesign",
        description: "Complete overhaul of company website with new branding",
        status: "in_progress",
        priority: "high",
        deadline: "2024-02-15",
        clientId: "1",
        clientName: "Acme Corporation",
        estimatedHours: 30,
        completedHours: 20,
      },
      {
        id: "task12",
        title: "Logo Design",
        description: "Create new company logo",
        status: "completed",
        priority: "medium",
        deadline: "2024-02-05",
        clientId: "6",
        clientName: "Startup Ventures",
        estimatedHours: 10,
        completedHours: 10,
      },
    ],
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily@company.com",
    department: "Support",
    role: "Lead Agent",
    status: "active",
    capacity: 12,
    tasks: [
      {
        id: "task8",
        title: "HIPAA Compliance Audit",
        description: "Ensure all systems meet HIPAA requirements",
        status: "in_progress",
        priority: "high",
        deadline: "2024-02-10",
        clientId: "4",
        clientName: "HealthPlus Medical",
        estimatedHours: 25,
        completedHours: 15,
      },
      {
        id: "task13",
        title: "Customer Support Training",
        description: "Train staff on new support procedures",
        status: "pending",
        priority: "medium",
        deadline: "2024-03-05",
        clientId: "7",
        clientName: "Retail Chain Inc.",
        estimatedHours: 15,
        completedHours: 0,
      },
      {
        id: "task14",
        title: "Documentation Update",
        description: "Update all support documentation",
        status: "in_progress",
        priority: "low",
        deadline: "2024-03-15",
        clientId: "7",
        clientName: "Retail Chain Inc.",
        estimatedHours: 20,
        completedHours: 5,
      },
      {
        id: "task15",
        title: "Security Review",
        description: "Review security protocols",
        status: "pending",
        priority: "high",
        deadline: "2024-02-28",
        clientId: "4",
        clientName: "HealthPlus Medical",
        estimatedHours: 18,
        completedHours: 0,
      },
    ],
  },
  {
    id: "4",
    name: "David Wilson",
    email: "david@company.com",
    department: "Development",
    role: "Agent",
    status: "active",
    capacity: 8,
    tasks: [
      {
        id: "task16",
        title: "Bug Fixes",
        description: "Address critical bugs in production",
        status: "in_progress",
        priority: "high",
        deadline: "2024-02-12",
        clientId: "2",
        clientName: "TechStart Inc.",
        estimatedHours: 12,
        completedHours: 8,
      },
      {
        id: "task17",
        title: "Feature Development",
        description: "Implement new user dashboard",
        status: "pending",
        priority: "medium",
        deadline: "2024-03-10",
        clientId: "5",
        clientName: "FinTech Solutions",
        estimatedHours: 25,
        completedHours: 0,
      },
    ],
  },
  {
    id: "5",
    name: "Lisa Thompson",
    email: "lisa@company.com",
    department: "Marketing",
    role: "Senior Agent",
    status: "inactive",
    capacity: 10,
    tasks: [],
  },
];

export default function AgentOverviewPage() {
  const [agents, setAgents] = useState(mockAgents);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || agent.department === departmentFilter;
    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue, bValue;

    switch (sortConfig.key) {
      case "name":
        aValue = a.name;
        bValue = b.name;
        break;
      case "department":
        aValue = a.department;
        bValue = b.department;
        break;
      case "taskCount":
        aValue = a.tasks.length;
        bValue = b.tasks.length;
        break;
      case "capacity":
        aValue = a.capacity;
        bValue = b.capacity;
        break;
      case "utilization":
        aValue = (a.tasks.length / a.capacity) * 100;
        bValue = (b.tasks.length / b.capacity) * 100;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortDirection = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Low
          </Badge>
        );
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            In Progress
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status.replace("_", " ")}</Badge>;
    }
  };

  const getUtilizationPercentage = (agent: (typeof agents)[0]) => {
    return Math.round((agent.tasks.length / agent.capacity) * 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTotalTasksByStatus = (tasks: any[], status: string) => {
    return tasks.filter((task) => task.status === status).length;
  };

  const getCompletionPercentage = (task: any) => {
    return Math.round((task.completedHours / task.estimatedHours) * 100);
  };

  const getSelectedAgent = () => {
    return agents.find((agent) => agent.id === selectedAgent);
  };

  const getTotalHours = (tasks: any[]) => {
    return tasks.reduce((total, task) => total + task.estimatedHours, 0);
  };

  const getCompletedHours = (tasks: any[]) => {
    return tasks.reduce((total, task) => total + task.completedHours, 0);
  };

  const getClientTaskCount = (tasks: any[]) => {
    const clientCounts: Record<string, number> = {};
    tasks.forEach((task) => {
      if (!clientCounts[task.clientId]) {
        clientCounts[task.clientId] = 0;
      }
      clientCounts[task.clientId]++;
    });
    return Object.entries(clientCounts).map(([clientId, count]) => {
      const clientName =
        tasks.find((task) => task.clientId === clientId)?.clientName ||
        "Unknown Client";
      return { clientId, clientName, count };
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents Overview</h1>
          <p className="text-muted-foreground">
            Monitor agent workload and task distribution
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Agents
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
              <p className="text-xs text-muted-foreground">
                {agents.filter((a) => a.status === "active").length} active
                agents
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Assigned Tasks
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.reduce((count, agent) => count + agent.tasks.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all agents</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Workload
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  (agents.reduce(
                    (sum, agent) => sum + getUtilizationPercentage(agent),
                    0
                  ) /
                    agents.length) *
                    10
                ) / 10}
                %
              </div>
              <p className="text-xs text-muted-foreground">Of total capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Deadlines
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  agents
                    .flatMap((agent) => agent.tasks)
                    .filter(
                      (task) =>
                        new Date(task.deadline) <=
                          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
                        task.status !== "completed"
                    ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Due in the next 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Workload Management</CardTitle>
            <CardDescription>
              Monitor and manage agent task assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agents Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort("name")}
                    >
                      <div className="flex items-center">
                        Agent
                        {getSortDirection("name") === "asc" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                        {getSortDirection("name") === "desc" && (
                          <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort("department")}
                    >
                      <div className="flex items-center">
                        Department
                        {getSortDirection("department") === "asc" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                        {getSortDirection("department") === "desc" && (
                          <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort("taskCount")}
                    >
                      <div className="flex items-center">
                        Tasks
                        {getSortDirection("taskCount") === "asc" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                        {getSortDirection("taskCount") === "desc" && (
                          <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort("capacity")}
                    >
                      <div className="flex items-center">
                        Capacity
                        {getSortDirection("capacity") === "asc" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                        {getSortDirection("capacity") === "desc" && (
                          <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => requestSort("utilization")}
                    >
                      <div className="flex items-center">
                        Utilization
                        {getSortDirection("utilization") === "asc" && (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                        {getSortDirection("utilization") === "desc" && (
                          <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAgents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No agents found
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAgents.map((agent) => {
                      const utilizationPercentage =
                        getUtilizationPercentage(agent);
                      const utilizationColor = getUtilizationColor(
                        utilizationPercentage
                      );

                      return (
                        <TableRow
                          key={agent.id}
                          className={
                            selectedAgent === agent.id ? "bg-muted/50" : ""
                          }
                          onClick={() => setSelectedAgent(agent.id)}
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="font-medium">{agent.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {agent.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{agent.department}</TableCell>
                          <TableCell>{getStatusBadge(agent.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {agent.tasks.length}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                tasks
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{agent.capacity}</TableCell>
                          <TableCell>
                            <div className="w-full">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">
                                  {utilizationPercentage}%
                                </span>
                              </div>
                              <Progress
                                value={utilizationPercentage}
                                className="h-2"
                                indicatorClassName={utilizationColor}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={
                                selectedAgent === agent.id
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAgent(
                                  selectedAgent === agent.id ? null : agent.id
                                );
                              }}
                            >
                              {selectedAgent === agent.id
                                ? "Hide Details"
                                : "View Details"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Agent Details */}
            {selectedAgent && (
              <div className="mt-8 border rounded-lg p-6">
                {(() => {
                  const agent = getSelectedAgent();
                  if (!agent) return null;

                  const totalHours = getTotalHours(agent.tasks);
                  const completedHours = getCompletedHours(agent.tasks);
                  const clientTaskCounts = getClientTaskCount(agent.tasks);

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">
                              {agent.name}
                            </h3>
                            <p className="text-muted-foreground">
                              {agent.department} • {agent.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(agent.status)}
                          <Badge variant="outline">
                            {agent.tasks.length} / {agent.capacity} tasks
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              Task Status
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Completed</span>
                                <Badge variant="outline">
                                  {getTotalTasksByStatus(
                                    agent.tasks,
                                    "completed"
                                  )}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">In Progress</span>
                                <Badge variant="outline">
                                  {getTotalTasksByStatus(
                                    agent.tasks,
                                    "in_progress"
                                  )}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Pending</span>
                                <Badge variant="outline">
                                  {getTotalTasksByStatus(
                                    agent.tasks,
                                    "pending"
                                  )}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              Time Tracking
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Total Hours</span>
                                <span className="font-medium">
                                  {totalHours} hrs
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Completed</span>
                                <span className="font-medium">
                                  {completedHours} hrs
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Remaining</span>
                                <span className="font-medium">
                                  {totalHours - completedHours} hrs
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              Client Distribution
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {clientTaskCounts.map((client) => (
                                <div
                                  key={client.clientId}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-sm truncate max-w-[150px]">
                                    {client.clientName}
                                  </span>
                                  <Badge variant="outline">
                                    {client.count} tasks
                                  </Badge>
                                </div>
                              ))}
                              {clientTaskCounts.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                  No clients assigned
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Tabs defaultValue="tasks" className="w-full">
                        <TabsList>
                          <TabsTrigger value="tasks">
                            Assigned Tasks
                          </TabsTrigger>
                          <TabsTrigger value="clients">
                            Client Breakdown
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="tasks" className="pt-4">
                          {agent.tasks.length === 0 ? (
                            <div className="text-center py-8 border rounded-lg">
                              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                              <h3 className="text-lg font-medium">
                                No tasks assigned
                              </h3>
                              <p className="text-muted-foreground">
                                This agent currently has no assigned tasks
                              </p>
                            </div>
                          ) : (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Deadline</TableHead>
                                    <TableHead>Progress</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {agent.tasks.map((task) => (
                                    <TableRow key={task.id}>
                                      <TableCell>
                                        <div>
                                          <div className="font-medium">
                                            {task.title}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {task.description}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                                          <span>{task.clientName}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {getTaskStatusBadge(task.status)}
                                      </TableCell>
                                      <TableCell>
                                        {getPriorityBadge(task.priority)}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                          <span>
                                            {new Date(
                                              task.deadline
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="w-full">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs">
                                              {task.completedHours} /{" "}
                                              {task.estimatedHours} hrs
                                            </span>
                                            <span className="text-xs font-medium">
                                              {getCompletionPercentage(task)}%
                                            </span>
                                          </div>
                                          <Progress
                                            value={getCompletionPercentage(
                                              task
                                            )}
                                            className="h-2"
                                            indicatorClassName={
                                              task.status === "completed"
                                                ? "bg-green-500"
                                                : task.status === "in_progress"
                                                ? "bg-blue-500"
                                                : "bg-yellow-500"
                                            }
                                          />
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </TabsContent>
                        <TabsContent value="clients" className="pt-4">
                          {clientTaskCounts.length === 0 ? (
                            <div className="text-center py-8 border rounded-lg">
                              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                              <h3 className="text-lg font-medium">
                                No clients assigned
                              </h3>
                              <p className="text-muted-foreground">
                                This agent is not working with any clients
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {clientTaskCounts.map((client) => {
                                const clientTasks = agent.tasks.filter(
                                  (task) => task.clientId === client.clientId
                                );
                                const completedTasks = clientTasks.filter(
                                  (task) => task.status === "completed"
                                ).length;
                                const inProgressTasks = clientTasks.filter(
                                  (task) => task.status === "in_progress"
                                ).length;
                                const pendingTasks = clientTasks.filter(
                                  (task) => task.status === "pending"
                                ).length;

                                return (
                                  <Card key={client.clientId}>
                                    <CardHeader>
                                      <CardTitle className="text-lg">
                                        {client.clientName}
                                      </CardTitle>
                                      <CardDescription>
                                        {client.count} assigned tasks
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                          <div className="p-2 bg-muted rounded-lg">
                                            <div className="text-sm text-muted-foreground">
                                              Completed
                                            </div>
                                            <div className="font-medium">
                                              {completedTasks}
                                            </div>
                                          </div>
                                          <div className="p-2 bg-muted rounded-lg">
                                            <div className="text-sm text-muted-foreground">
                                              In Progress
                                            </div>
                                            <div className="font-medium">
                                              {inProgressTasks}
                                            </div>
                                          </div>
                                          <div className="p-2 bg-muted rounded-lg">
                                            <div className="text-sm text-muted-foreground">
                                              Pending
                                            </div>
                                            <div className="font-medium">
                                              {pendingTasks}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          {clientTasks.map((task) => (
                                            <div
                                              key={task.id}
                                              className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                                            >
                                              <div className="flex items-center gap-2">
                                                {task.status === "completed" ? (
                                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                                ) : task.status ===
                                                  "in_progress" ? (
                                                  <Clock className="h-4 w-4 text-blue-600" />
                                                ) : (
                                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                )}
                                                <span className="text-sm font-medium">
                                                  {task.title}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {getPriorityBadge(
                                                  task.priority
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
