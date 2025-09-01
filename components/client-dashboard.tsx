"use client";

import { useState, useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  LineChart,
  MoreHorizontal,
  Package,
  Calendar,
  Users,
  PieChart,
  User,
  MessageSquare,
  Search,
  Wand2,
  Loader2,
  BriefcaseIcon,
} from "lucide-react";

import { TaskCard } from "@/components/task-card";
import { WorkflowStages } from "@/components/workflow-stages";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskList } from "@/components/task-list";
import { TaskPerformance } from "@/components/task-performance";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskCompletionChart } from "@/components/charts/task-completion-chart";
import { CategoryDistributionChart } from "@/components/charts/category-distribution-chart";
import { TaskTrendChart } from "@/components/charts/task-trend-chart";
import { AgentPerformanceChart } from "@/components/charts/agent-performance-chart";

// Sample data
const initialTasks = [
  {
    id: 1,
    title: "Create social media graphics",
    dueDate: "2025-04-02",
    priority: "High",
    status: "Pending",
    assignedTo: null,
    category: "design",
    progress: 0,
  },
  {
    id: 2,
    title: "Design new banner ads",
    dueDate: "2025-04-05",
    priority: "Medium",
    status: "Pending",
    assignedTo: null,
    category: "design",
    progress: 0,
  },
  {
    id: 3,
    title: "Update product photos",
    dueDate: "2025-04-10",
    priority: "Low",
    status: "Pending",
    assignedTo: null,
    category: "content",
    progress: 0,
  },
  {
    id: 4,
    title: "Create promotional video",
    dueDate: "2025-04-15",
    priority: "High",
    status: "Pending",
    assignedTo: null,
    category: "video",
    progress: 0,
  },
  {
    id: 5,
    title: "Write blog post about new products",
    dueDate: "2025-04-08",
    priority: "Medium",
    status: "Pending",
    assignedTo: null,
    category: "content",
    progress: 0,
  },
  {
    id: 6,
    title: "Schedule social media posts",
    dueDate: "2025-04-03",
    priority: "High",
    status: "Pending",
    assignedTo: null,
    category: "social",
    progress: 0,
  },
];

const employees = [
  {
    id: 1,
    name: "Alex Kim",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Social Media Specialist",
    maxCapacity: 3,
    assignedTasks: 0,
    skills: ["social media", "content creation"],
  },
  {
    id: 2,
    name: "Jamie Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Content Writer",
    maxCapacity: 2,
    assignedTasks: 0,
    skills: ["writing", "editing", "research"],
  },
  {
    id: 3,
    name: "Taylor Wong",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Graphic Designer",
    maxCapacity: 3,
    assignedTasks: 0,
    skills: ["design", "photography", "illustration"],
  },
  {
    id: 4,
    name: "Jordan Lee",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Video Producer",
    maxCapacity: 2,
    assignedTasks: 0,
    skills: ["video editing", "animation"],
  },
];

const clientData = {
  name: "Acme Corporation",
  package: "DFP120",
  tasksPerMonth: 3,
  tasksCompleted: 1,
  nextTaskDate: "2025-04-10",
  daysUntilNextTask: 15,
};

const workflowData = {
  assets: { total: 12, completed: 8 },
  socialMedia: { total: 8, completed: 3 },
  review: { total: 5, completed: 1 },
};

export function ClientDashboard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTaskForComment, setSelectedTaskForComment] = useState(null);
  const [selectedTaskForReport, setSelectedTaskForReport] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [reportText, setReportText] = useState("");
  const [reportType, setReportType] = useState("");
  const [employeeList, setEmployeeList] = useState(employees);
  const [isDistributing, setIsDistributing] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [distributionProgress, setDistributionProgress] = useState(0);
  const [showDistributionProgress, setShowDistributionProgress] =
    useState(false);

  // Update employee assigned tasks count
  useEffect(() => {
    const updatedEmployees = employeeList.map((employee) => {
      const assignedCount = tasks.filter(
        (task) => task.assignedTo && task.assignedTo.id === employee.id
      ).length;

      return {
        ...employee,
        assignedTasks: assignedCount,
      };
    });

    setEmployeeList(updatedEmployees);
  }, [tasks]);

  // Filter employees based on search and availability
  const filteredEmployees = employeeList.filter((employee) => {
    // Filter by search
    if (
      employeeSearch &&
      !employee.name.toLowerCase().includes(employeeSearch.toLowerCase())
    ) {
      return false;
    }

    // Filter by availability
    if (
      employeeFilter === "free" &&
      employee.assignedTasks >= employee.maxCapacity
    ) {
      return false;
    }

    return true;
  });

  // Filter tasks based on search
  const filteredTasks = tasks.filter((task) => {
    if (
      taskSearch &&
      !task.title.toLowerCase().includes(taskSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Calculate skill match between employee and task
  const getSkillMatch = (employee, taskCategory) => {
    const categorySkillMap = {
      design: ["design", "illustration", "photography"],
      content: ["writing", "editing", "research"],
      social: ["social media", "content creation"],
      video: ["video editing", "animation"],
    };

    const taskSkills = categorySkillMap[taskCategory] || [];
    const matchingSkills = employee.skills.filter((skill) =>
      taskSkills.includes(skill)
    );

    return matchingSkills.length > 0
      ? Math.round((matchingSkills.length / taskSkills.length) * 100)
      : 0;
  };

  // Distribute tasks automatically using AI-like algorithm
  const distributeTasksAutomatically = () => {
    setIsDistributing(true);
    setShowDistributionProgress(true);
    setDistributionProgress(0);

    // Create copies of current state
    const updatedTasks = [...tasks];
    const updatedEmployees = [...employeeList];

    // Get unassigned tasks
    const unassignedTasks = updatedTasks.filter((task) => !task.assignedTo);

    // Sort tasks by priority (High > Medium > Low)
    unassignedTasks.sort((a, b) => {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Simulate AI distribution with progress
    let currentProgress = 0;
    const progressIncrement = 100 / unassignedTasks.length;

    const distributeNextTask = (index) => {
      if (index >= unassignedTasks.length) {
        // All tasks distributed
        setTimeout(() => {
          setTasks(updatedTasks);
          setEmployeeList(updatedEmployees);
          setIsDistributing(false);
          setDistributionProgress(100);

          // Hide progress bar after a delay
          setTimeout(() => {
            setShowDistributionProgress(false);
          }, 1500);
        }, 500);
        return;
      }

      const task = unassignedTasks[index];
      const taskIndex = updatedTasks.findIndex((t) => t.id === task.id);

      // Find available employees
      const availableEmployees = updatedEmployees.filter(
        (emp) => emp.assignedTasks < emp.maxCapacity
      );

      if (availableEmployees.length > 0) {
        // Find best match based on skills and workload
        const scoredEmployees = availableEmployees.map((emp) => {
          const skillMatch = getSkillMatch(emp, task.category);
          const workloadScore = (emp.maxCapacity - emp.assignedTasks) * 20;

          return {
            employee: emp,
            score: skillMatch + workloadScore,
          };
        });

        // Sort by score (highest first)
        scoredEmployees.sort((a, b) => b.score - a.score);

        // Assign to best match
        const bestMatch = scoredEmployees[0].employee;
        updatedTasks[taskIndex].assignedTo = bestMatch;
        updatedTasks[taskIndex].status = "In Progress";
        updatedTasks[taskIndex].progress = 10;

        // Update employee's assigned tasks count
        const empIndex = updatedEmployees.findIndex(
          (e) => e.id === bestMatch.id
        );
        updatedEmployees[empIndex].assignedTasks += 1;
      }

      // Update progress
      currentProgress += progressIncrement;
      setDistributionProgress(Math.min(Math.round(currentProgress), 95));

      // Process next task with delay to show progress
      setTimeout(() => distributeNextTask(index + 1), 300);
    };

    // Start distribution process
    setTimeout(() => distributeNextTask(0), 500);
  };

  return (
    <div className="p-3">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Client Dashboard</h1>
        <p className="text-muted-foreground">
          Manage tasks and track workflow progress
        </p>
      </div>
      <div className="max-w-xl mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Package Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-primary" />
              <span className="font-medium">{clientData.package} Package</span>
            </div>

            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              <span>{clientData.tasksPerMonth} tasks per month</span>
            </div>

            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
              <span>
                {clientData.tasksCompleted}/{clientData.tasksPerMonth} tasks
                completed
              </span>
            </div>

            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <span>Next task in {clientData.daysUntilNextTask} days</span>
            </div>
          </CardContent>
          <CardFooter>
            <Badge variant="outline" className="w-full justify-center py-2">
              Next task: {clientData.nextTaskDate}
            </Badge>
          </CardFooter>
        </Card>
      </div>
      {/* Task Distribution Start */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
        {showDistributionProgress && (
          <div className="w-full md:w-64">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Distribution Progress</span>
              <span className="text-sm font-medium">
                {distributionProgress}%
              </span>
            </div>
            <Progress value={distributionProgress} className="h-2" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Tasks List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Tasks</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8 h-9 w-[180px] md:w-[200px]"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mb-2 opacity-20" />
                  <p>No tasks found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              task.priority === "High"
                                ? "destructive"
                                : task.priority === "Medium"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                          <h3 className="font-medium">{task.title}</h3>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            task.status === "Completed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : task.status === "In Progress"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BriefcaseIcon className="h-3.5 w-3.5" />
                          <span className="capitalize">{task.category}</span>
                        </div>
                      </div>

                      {task.assignedTo ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={task.assignedTo.avatar}
                                alt={task.assignedTo.name}
                              />
                              <AvatarFallback>
                                {task.assignedTo.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {task.assignedTo.name}
                            </span>
                          </div>
                          <div className="w-24">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-red-500 font-medium">
                          Not assigned
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employees List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Team Members</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="free">Available Slots</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search team..."
                  className="pl-8 h-9 w-[180px]"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
              </div>

              <Button
                onClick={distributeTasksAutomatically}
                disabled={isDistributing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isDistributing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Auto-Assign
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mb-2 opacity-20" />
                  <p>No team members found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={employee.avatar}
                              alt={employee.name}
                            />
                            <AvatarFallback>
                              {employee.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{employee.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {employee.role}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            employee.assignedTasks === 0
                              ? "bg-green-50 text-green-700 border-green-200"
                              : employee.assignedTasks < employee.maxCapacity
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {employee.assignedTasks === 0
                            ? "Free"
                            : employee.assignedTasks < employee.maxCapacity
                            ? `${
                                employee.maxCapacity - employee.assignedTasks
                              } slots free`
                            : "Fully booked"}
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Workload</span>
                          <span>
                            {Math.round(
                              (employee.assignedTasks / employee.maxCapacity) *
                                100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            (employee.assignedTasks / employee.maxCapacity) *
                            100
                          }
                          className="h-1.5"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {employee.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-10">
        <WorkflowStages workflowData={workflowData} />
      </div>
      {/* Task Distribution End */}

      <div className="flex flex-col gap-6 mt-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
            <p className="text-muted-foreground"></p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Status</DropdownMenuItem>
                <DropdownMenuItem>Agent</DropdownMenuItem>
                <DropdownMenuItem>Date</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Download className="h-3.5 w-3.5" />
                  <span>Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Export as PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Export as CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LineChart className="mr-2 h-4 w-4" />
                  <span>Export as Excel</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog>
              <DialogTrigger asChild>
                {/* <Button size="sm" className="h-8 gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Task</span>
                </Button> */}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your project. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input id="task-title" placeholder="Enter task title" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      placeholder="Enter task description"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-category">Category</Label>
                    <Select>
                      <SelectTrigger id="task-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select>
                      <SelectTrigger id="task-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-due-date">Due Date</Label>
                    <Input id="task-due-date" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-assignee">Assign To</Label>
                    <Select>
                      <SelectTrigger id="task-assignee">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alice">Alice Johnson</SelectItem>
                        <SelectItem value="bob">Bob Smith</SelectItem>
                        <SelectItem value="charlie">Charlie Davis</SelectItem>
                        <SelectItem value="diana">Diana Miller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Current Package
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">DFP90</div>
                  <p className="text-xs text-muted-foreground">
                    90 Days Duration
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed Tasks
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1/8</div>
                  <p className="text-xs text-muted-foreground">
                    12.5% completion rate
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Tasks
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">
                    62.5% of total tasks
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Overall Progress
                  </CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">13%</div>
                  <Progress value={13} className="h-2" />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Task Status Overview</CardTitle>
                  <CardDescription>
                    View the status of all your tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center justify-center rounded-lg border bg-amber-50 p-4">
                      <span className="text-lg font-semibold text-amber-600">
                        5
                      </span>
                      <span className="text-sm text-amber-700">Pending</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border bg-blue-50 p-4">
                      <span className="text-lg font-semibold text-blue-600">
                        2
                      </span>
                      <span className="text-sm text-blue-700">In Progress</span>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border bg-green-50 p-4">
                      <span className="text-lg font-semibold text-green-600">
                        1
                      </span>
                      <span className="text-sm text-green-700">Completed</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <TaskCompletionChart className="h-[200px] w-full" />
                  </div>

                  <div className="mt-6">
                    <h4 className="mb-4 text-sm font-semibold">Recent Tasks</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700"
                          >
                            Pending
                          </Badge>
                          <span className="font-medium">
                            Create Facebook post
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src="/placeholder.svg?height=24&width=24"
                              alt="@alice"
                            />
                            <AvatarFallback>AJ</AvatarFallback>
                          </Avatar>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700"
                          >
                            In Progress
                          </Badge>
                          <span className="font-medium">
                            Write blog article
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src="/placeholder.svg?height=24&width=24"
                              alt="@bob"
                            />
                            <AvatarFallback>BS</AvatarFallback>
                          </Avatar>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            Completed
                          </Badge>
                          <span className="font-medium">Design logo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src="/placeholder.svg?height=24&width=24"
                              alt="@diana"
                            />
                            <AvatarFallback>DM</AvatarFallback>
                          </Avatar>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("tasks")}
                  >
                    View All Tasks
                  </Button>
                </CardFooter>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Package Details</CardTitle>
                  <CardDescription>
                    Your current subscription package
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Package Name</span>
                    <span className="font-semibold">DFP90</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Duration</span>
                    <span>90 Days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Social Sites</span>
                    <span>11</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Web 2.0s</span>
                    <span>5 Sites</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Additional Assets
                    </span>
                    <span>10 Approx</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Monthly Engagement
                    </span>
                    <span>1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Domain</span>
                    <span>1</span>
                  </div>

                  <div className="pt-4">
                    <h4 className="mb-2 text-sm font-semibold">
                      Assigned Team
                    </h4>
                    <div className="flex -space-x-2">
                      <Avatar className="border-2 border-background">
                        <AvatarImage
                          src="/placeholder.svg?height=32&width=32"
                          alt="@alice"
                        />
                        <AvatarFallback>AJ</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarImage
                          src="/placeholder.svg?height=32&width=32"
                          alt="@bob"
                        />
                        <AvatarFallback>BS</AvatarFallback>
                      </Avatar>
                      <Avatar className="border-2 border-background">
                        <AvatarImage
                          src="/placeholder.svg?height=32&width=32"
                          alt="@charlie"
                        />
                        <AvatarFallback>CD</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  <div className="pt-4">
                    <CategoryDistributionChart className="h-[180px] w-full" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        View Sites
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>DFP90 Site Directory</DialogTitle>
                        <DialogDescription>
                          Browse all available sites included in this package
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="social" className="mt-4">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="social">Social Sites</TabsTrigger>
                          <TabsTrigger value="web">Web 2.0 Sites</TabsTrigger>
                          <TabsTrigger value="additional">
                            Additional Sites
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="social" className="space-y-4 pt-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                              {
                                name: "www.behance.net",
                                url: "https://www.behance.net/",
                              },
                              {
                                name: "www.youtube.com",
                                url: "https://www.youtube.com/",
                              },
                              {
                                name: "www.pinterest.com",
                                url: "https://www.pinterest.com/",
                              },
                              {
                                name: "www.crunchbase.com",
                                url: "https://www.crunchbase.com/register",
                              },
                            ].map((site, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between rounded-md border p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="rounded-full bg-muted p-1">
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 15 15"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15C11.6421 15 15 11.6421 15 7.5C15 3.35786 11.6421 0 7.5 0ZM6.98284 2.18567C7.12126 2.07528 7.30541 2.07528 7.44383 2.18567L9.75 4.01493L7.5 5.8107L5.25 4.01493L6.98284 2.18567ZM4.5 8.25V4.83688L6.75 6.6326V10.0533L4.5 8.25ZM8.25 6.6326L10.5 4.83688V8.25L8.25 10.0533V6.6326Z"
                                        fill="currentColor"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {site.name}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1"
                                >
                                  <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8056 2.09851 12.8536 2.14645Z"
                                      fill="currentColor"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="web" className="space-y-4 pt-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                              {
                                name: "muckrack.com",
                                url: "https://muckrack.com/account/signup",
                              },
                              { name: "slides.com", url: "slides.com" },
                              {
                                name: "flipboard.com",
                                url: "https://flipboard.com/signup",
                              },
                              { name: "about.me", url: "http://about.me/" },
                            ].map((site, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between rounded-md border p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="rounded-full bg-muted p-1">
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 15 15"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15C11.6421 15 15 11.6421 15 7.5C15 3.35786 11.6421 0 7.5 0ZM6.98284 2.18567C7.12126 2.07528 7.30541 2.07528 7.44383 2.18567L9.75 4.01493L7.5 5.8107L5.25 4.01493L6.98284 2.18567ZM4.5 8.25V4.83688L6.75 6.6326V10.0533L4.5 8.25ZM8.25 6.6326L10.5 4.83688V8.25L8.25 10.0533V6.6326Z"
                                        fill="currentColor"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {site.name}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1"
                                >
                                  <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8056 2.09851 12.8536 2.14645Z"
                                      fill="currentColor"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Task Management</CardTitle>
                    <CardDescription>
                      View and manage all your tasks
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span>Sort</span>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        {/* <Button size="sm" className="h-8 gap-1">
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Task</span>
                        </Button> */}
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Task</DialogTitle>
                          <DialogDescription>
                            Add a new task to your project. Click save when
                            you're done.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="task-title">Task Title</Label>
                            <Input
                              id="task-title"
                              placeholder="Enter task title"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="task-description">
                              Description
                            </Label>
                            <Textarea
                              id="task-description"
                              placeholder="Enter task description"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="task-category">Category</Label>
                            <Select>
                              <SelectTrigger id="task-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="social">Social</SelectItem>
                                <SelectItem value="content">Content</SelectItem>
                                <SelectItem value="design">Design</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="task-assignee">Assign To</Label>
                            <Select>
                              <SelectTrigger id="task-assignee">
                                <SelectValue placeholder="Select team member" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="alice">
                                  Alice Johnson
                                </SelectItem>
                                <SelectItem value="bob">Bob Smith</SelectItem>
                                <SelectItem value="charlie">
                                  Charlie Davis
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create Task</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All Tasks</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="mt-4">
                    <TaskList />
                  </TabsContent>
                  <TabsContent value="pending" className="mt-4">
                    <TaskList status="pending" />
                  </TabsContent>
                  <TabsContent value="in-progress" className="mt-4">
                    <TaskList status="in-progress" />
                  </TabsContent>
                  <TabsContent value="completed" className="mt-4">
                    <TaskList status="completed" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Performance Analysis</CardTitle>
                <CardDescription>
                  Track the efficiency and progress of your tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TaskPerformance />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reports & Analytics</CardTitle>
                    <CardDescription>
                      Generate and export detailed reports
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                        >
                          <ArrowDownToLine className="h-3.5 w-3.5" />
                          <span>Export</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          <span>Export as PDF</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          <span>Export as CSV</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <LineChart className="mr-2 h-4 w-4" />
                          <span>Export as Excel</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="agents">Agents</TabsTrigger>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Task Completion Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px]">
                            <TaskCompletionChart className="h-full w-full" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Category Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px]">
                            <CategoryDistributionChart className="h-full w-full" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Monthly Progress Report
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <TaskTrendChart className="h-full w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="performance" className="mt-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Performance Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[400px]">
                          <TaskTrendChart className="h-full w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="agents" className="mt-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Agent Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[400px]">
                          <AgentPerformanceChart className="h-full w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="custom" className="mt-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Custom Report
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label htmlFor="report-type">Report Type</Label>
                            <Select>
                              <SelectTrigger id="report-type">
                                <SelectValue placeholder="Select report type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="task-completion">
                                  Task Completion
                                </SelectItem>
                                <SelectItem value="agent-performance">
                                  Agent Performance
                                </SelectItem>
                                <SelectItem value="category-analysis">
                                  Category Analysis
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="date-range">Date Range</Label>
                            <div className="flex gap-2">
                              <Input
                                id="date-from"
                                type="date"
                                className="w-1/2"
                              />
                              <Input
                                id="date-to"
                                type="date"
                                className="w-1/2"
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label>Include Data</Label>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="include-tasks" />
                                <Label
                                  htmlFor="include-tasks"
                                  className="text-sm font-normal"
                                >
                                  Tasks
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="include-agents" />
                                <Label
                                  htmlFor="include-agents"
                                  className="text-sm font-normal"
                                >
                                  Agents
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="include-categories" />
                                <Label
                                  htmlFor="include-categories"
                                  className="text-sm font-normal"
                                >
                                  Categories
                                </Label>
                              </div>
                            </div>
                          </div>

                          <Button className="w-full">
                            Generate Custom Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Task History</CardTitle>
                <CardDescription>
                  View a record of all past tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-sm font-medium">March 2023</h3>
                    <div className="space-y-2">
                      {[
                        {
                          title: "Logo Design",
                          status: "completed",
                          date: "Mar 28, 2023",
                          agent: "Diana Miller",
                        },
                        {
                          title: "Website Copy",
                          status: "completed",
                          date: "Mar 22, 2023",
                          agent: "Bob Smith",
                        },
                        {
                          title: "Social Media Strategy",
                          status: "completed",
                          date: "Mar 15, 2023",
                          agent: "Alice Johnson",
                        },
                      ].map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700"
                            >
                              Completed
                            </Badge>
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3.5 w-3.5" />
                              <span>{task.agent}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    setSelectedTaskForComment(task)
                                  }
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  <span>Add Comment</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    setSelectedTaskForReport(task)
                                  }
                                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  <span>Add Report</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-medium">February 2023</h3>
                    <div className="space-y-2">
                      {[
                        {
                          title: "Email Campaign",
                          status: "completed",
                          date: "Feb 28, 2023",
                          agent: "Charlie Davis",
                        },
                        {
                          title: "Product Photography",
                          status: "completed",
                          date: "Feb 15, 2023",
                          agent: "Diana Miller",
                        },
                        {
                          title: "Market Research",
                          status: "completed",
                          date: "Feb 10, 2023",
                          agent: "Bob Smith",
                        },
                        {
                          title: "Competitor Analysis",
                          status: "completed",
                          date: "Feb 5, 2023",
                          agent: "Alice Johnson",
                        },
                      ].map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700"
                            >
                              Completed
                            </Badge>
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3.5 w-3.5" />
                              <span>{task.agent}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    setSelectedTaskForComment(task)
                                  }
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  <span>Add Comment</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    setSelectedTaskForReport(task)
                                  }
                                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  <span>Add Report</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Load More
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Comment Modal */}
        <Dialog
          open={selectedTaskForComment !== null}
          onOpenChange={(open) => !open && setSelectedTaskForComment(null)}
        >
          <DialogContent className="w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
              <DialogDescription>
                Add a comment to the task: {selectedTaskForComment?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="comment">Your Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Enter your comment here..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedTaskForComment(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Here you would typically save the comment
                  console.log("Comment added:", commentText);
                  setCommentText("");
                  setSelectedTaskForComment(null);
                }}
              >
                Submit Comment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report Modal */}
        <Dialog
          open={selectedTaskForReport !== null}
          onOpenChange={(open) => !open && setSelectedTaskForReport(null)}
        >
          <DialogContent className="border-red-200 w-[500px]">
            <DialogHeader className="border-b border-red-100 pb-3">
              <DialogTitle className="text-red-600">Add Report</DialogTitle>
              <DialogDescription>
                Submit a report for the task: {selectedTaskForReport?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger
                    id="report-type"
                    className="border-red-200 focus:ring-red-500"
                  >
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="progress">Progress Report</SelectItem>
                    <SelectItem value="issue">Issue Report</SelectItem>
                    <SelectItem value="feedback">Feedback Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report-details">Report Details</Label>
                <Textarea
                  id="report-details"
                  placeholder="Enter report details..."
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="min-h-[120px] border-red-200 focus-visible:ring-red-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedTaskForReport(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  // Here you would typically save the report
                  console.log("Report added:", {
                    type: reportType,
                    details: reportText,
                  });
                  setReportType("");
                  setReportText("");
                  setSelectedTaskForReport(null);
                }}
              >
                Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
