"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarDays,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Users,
  Building2,
  Globe,
  Grid3X3,
  List,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { ClientSelectModal } from "./clients/ClientSelectModal";

type Client = {
  id: string;
  name: string;
  company: string;
  avatar: string;
  package: {
    id: string;
    name: string;
  };
};

type Agent = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
  category: string;
  role: {
    name: string;
  };
};

type Task = {
  id: string;
  name: string;
  priority: string;
  dueDate: string;
  status: string;
  idealDurationMinutes: number;
  templateSiteAsset: {
    id: number;
    name: string;
    type: string;
    description: string;
    url: string;
    isRequired: boolean;
  };
  assignedTo: Agent | null;
  client: {
    id: string;
    name: string;
    company: string;
  };
};

type TaskAssignment = {
  taskId: string;
  agentId: string;
};

const priorityColors = {
  low: "bg-gradient-to-r from-emerald-100 via-teal-50 to-green-100 text-emerald-800 border-emerald-300 shadow-emerald-100",
  medium:
    "bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 text-amber-800 border-amber-300 shadow-amber-100",
  high: "bg-gradient-to-r from-orange-100 via-red-50 to-rose-100 text-orange-800 border-orange-300 shadow-orange-100",
  urgent:
    "bg-gradient-to-r from-red-100 via-rose-50 to-pink-100 text-red-800 border-red-300 shadow-red-100",
};

const statusColors = {
  pending:
    "bg-gradient-to-r from-slate-100 via-gray-50 to-zinc-100 text-slate-800 border-slate-300 shadow-slate-100",
  in_progress:
    "bg-gradient-to-r from-blue-100 via-indigo-50 to-sky-100 text-blue-800 border-blue-300 shadow-blue-100",
  completed:
    "bg-gradient-to-r from-emerald-100 via-green-50 to-teal-100 text-emerald-800 border-emerald-300 shadow-emerald-100",
  overdue:
    "bg-gradient-to-r from-red-100 via-rose-50 to-pink-100 text-red-800 border-red-300 shadow-red-100",
  cancelled:
    "bg-gradient-to-r from-slate-100 via-gray-50 to-zinc-100 text-slate-800 border-slate-300 shadow-slate-100",
};

const siteTypeIcons = {
  social_site: Users,
  web2_site: Globe,
  other_asset: Building2,
};

const siteTypeColors = {
  social_site:
    "bg-gradient-to-r from-violet-100 via-purple-50 to-fuchsia-100 text-violet-800 border-violet-300 shadow-violet-100",
  web2_site:
    "bg-gradient-to-r from-blue-100 via-cyan-50 to-sky-100 text-blue-800 border-blue-300 shadow-blue-100",
  other_asset:
    "bg-gradient-to-r from-slate-100 via-gray-50 to-zinc-100 text-slate-800 border-slate-300 shadow-slate-100",
};

export default function TaskDistribution() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedTasksOrder, setSelectedTasksOrder] = useState<string[]>([]);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  


  // Load clients on component mount
  useEffect(() => {
    fetchClients();
    fetchAgents();
  }, []);

  // Load tasks when client is selected
  useEffect(() => {
    if (selectedClientId) {
      fetchClientTasks(selectedClientId);
    } else {
      setTasks([]);
      setTaskAssignments([]);
      setSelectedTasks(new Set());
      setSelectedTasksOrder([]);
    }
  }, [selectedClientId]);

  // Clean up selectedTasksOrder when tasks change
  useEffect(() => {
    setSelectedTasksOrder((prev) =>
      prev.filter((id) => tasks.some((task) => task.id === id))
    );
  }, [tasks]);

  // Clean up selectedTasksOrder when client changes
  useEffect(() => {
    if (selectedClientId) {
      setSelectedTasksOrder([]);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/tasks/agents");
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    }
  };

  const fetchClientTasks = async (clientId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/client/${clientId}`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load client tasks");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAgents = (siteType: string) => {
    const categoryMap: { [key: string]: string } = {
      social_site: "social",
      web2_site: "web2",
      other_asset: "general",
    };
    const targetCategory = categoryMap[siteType] || "general";
    return agents.filter(
      (agent) =>
        agent.category?.toLowerCase() === targetCategory ||
        agent.role?.name?.toLowerCase() === "agent"
    );
  };

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
        // Remove assignment if task is deselected
        setTaskAssignments((assignments) =>
          assignments.filter((assignment) => assignment.taskId !== taskId)
        );
      }
      return newSet;
    });

    // Update the order of selected tasks
    setSelectedTasksOrder((prev) => {
      if (checked) {
        // Add to the end if not already present
        return prev.includes(taskId) ? prev : [...prev, taskId];
      } else {
        // Remove from order
        return prev.filter((id) => id !== taskId);
      }
    });
  };

  const handleSelectAllTasks = (taskIds: string[], checked: boolean) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      taskIds.forEach((taskId) => {
        if (checked) {
          newSet.add(taskId);
        } else {
          newSet.delete(taskId);
        }
      });
      return newSet;
    });

    // Update the order for select all
    setSelectedTasksOrder((prev) => {
      if (checked) {
        const newTasks = taskIds.filter((id) => !prev.includes(id));
        return [...prev, ...newTasks];
      } else {
        return prev.filter((id) => !taskIds.includes(id));
      }
    });

    if (!checked) {
      // Remove assignments for deselected tasks
      setTaskAssignments((assignments) =>
        assignments.filter((assignment) => !taskIds.includes(assignment.taskId))
      );
    }
  };

  const submitTaskDistribution = async () => {
    if (taskAssignments.length === 0) {
      toast.warning("⚠️ No Assignments", {
        description:
          "Please assign at least one task to an agent before distributing",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/tasks/distribute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          assignments: taskAssignments,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("🎉 Tasks Distributed Successfully!", {
          description: `${taskAssignments.length} tasks have been assigned. Notifications sent.`,
          duration: 5000,
        });
        // Refresh tasks to show updated assignments
        fetchClientTasks(selectedClientId);
        setTaskAssignments([]);
        setSelectedTasks(new Set());
        setSelectedTasksOrder([]);
      } else {
        throw new Error("Failed to distribute tasks");
      }
    } catch (error) {
      console.error("Error distributing tasks:", error);
      toast.error("❌ Distribution Failed", {
        description: "Please try again or contact support.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categorizedTasks = {
    social_site: tasks.filter(
      (task) => task.templateSiteAsset?.type === "social_site"
    ),
    web2_site: tasks.filter(
      (task) => task.templateSiteAsset?.type === "web2_site"
    ),
    other_asset: tasks.filter(
      (task) => task.templateSiteAsset?.type === "other_asset"
    ),
  };

  const handleNoteChange = useCallback((taskId: string, note: string) => {
    setTaskNotes((prev) => ({ ...prev, [taskId]: note }));
  }, [taskNotes]);


  const TaskCard = ({ task, siteType }: { task: Task; siteType: string }) => {
    const isSelected = selectedTasks.has(task.id);
    const assignment = taskAssignments.find((a) => a.taskId === task.id);
    const filteredAgents = getFilteredAgents(siteType);
    const SiteIcon = siteTypeIcons[siteType as keyof typeof siteTypeIcons];

    // Get the first selected task ID for bulk assignment control
    const firstSelectedTaskId = selectedTasksOrder.find((id) =>
      selectedTasks.has(id)
    );
    const isFirstSelectedTask = firstSelectedTaskId === task.id;
    const isMultipleSelected = selectedTasks.size > 1;
    const shouldDisableDropdown =
      isMultipleSelected && isSelected && !isFirstSelectedTask;

    // Handle assignment change for bulk assignment
    const handleAssignmentChange = (agentId: string) => {
      if (isMultipleSelected && isFirstSelectedTask) {
        // Bulk assignment: assign the same agent to all currently selected tasks
        const selectedTasksArray = Array.from(selectedTasks);
        const newAssignments: TaskAssignment[] = selectedTasksArray.map(
          (taskId) => ({
            taskId,
            agentId,
          })
        );

        setTaskAssignments((prev) => {
          // Remove existing assignments for currently selected tasks
          const filtered = prev.filter(
            (assignment) => !selectedTasks.has(assignment.taskId)
          );
          // Add new bulk assignments
          return [...filtered, ...newAssignments];
        });

        // Clear selection after assignment to end bulk assignment mode
        setSelectedTasks(new Set());
        setSelectedTasksOrder([]);

        toast.success(`Assigned ${selectedTasksArray.length} tasks to agent`);
      } else {
        // Individual assignment
        setTaskAssignments((prev) => {
          const filtered = prev.filter(
            (assignment) => assignment.taskId !== task.id
          );
          if (agentId) {
            return [...filtered, { taskId: task.id, agentId }];
          }
          return filtered;
        });

        // Clear selection after individual assignment
        setSelectedTasks(new Set());
        setSelectedTasksOrder([]);
      }
    };

    return (
      <Card
        className={`transition-all duration-300 transform hover:scale-[1.02] ${
          isSelected
            ? "ring-2 ring-blue-400 shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-300"
            : "hover:shadow-lg bg-gradient-to-br from-white via-gray-50 to-slate-50 border-gray-200 hover:border-gray-300"
        }`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  handleTaskSelection(task.id, checked as boolean)
                }
                className="w-5 h-5 rounded-md border-2 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500"
              />
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    siteTypeColors[siteType as keyof typeof siteTypeColors]
                  } shadow-sm`}
                >
                  <SiteIcon className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-bold text-gray-900 leading-tight">
                  {task.name}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                className={`text-xs font-bold shadow-sm ${
                  priorityColors[task.priority as keyof typeof priorityColors]
                }`}
              >
                {task.priority.toUpperCase()}
              </Badge>
              <Badge
                className={`text-xs font-bold shadow-sm ${
                  statusColors[task.status as keyof typeof statusColors]
                }`}
              >
                {task.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
          </div>
          {task.templateSiteAsset?.description && (
            <CardDescription className="text-xs text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-lg mt-3 border border-gray-200">
              {task.templateSiteAsset.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 px-3 py-1.5 rounded-lg shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-700" />
                  <span className="text-blue-800 font-bold">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
                {task.idealDurationMinutes && (
                  <div className="flex items-center space-x-1.5 bg-gradient-to-r from-violet-100 to-purple-100 px-3 py-1.5 rounded-lg shadow-sm">
                    <Clock className="h-3.5 w-3.5 text-violet-700" />
                    <span className="text-violet-800 font-bold">
                      {task.idealDurationMinutes}min
                    </span>
                  </div>
                )}
              </div>
              <Badge
                className={`text-xs font-bold shadow-sm ${
                  siteTypeColors[siteType as keyof typeof siteTypeColors]
                }`}
              >
                {siteType.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            {task.templateSiteAsset?.url && (
              <div className="text-xs bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-gray-700 font-bold">Target URL: </span>
                <a
                  href={task.templateSiteAsset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-900 font-bold hover:underline transition-colors"
                >
                  {task.templateSiteAsset.url}
                </a>
              </div>
            )}
            {task.assignedTo ? (
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-100 via-green-50 to-teal-100 rounded-xl border border-emerald-300 shadow-sm">
                <Avatar className="h-9 w-9 ring-3 ring-emerald-400 shadow-md">
                  <AvatarImage
                    src={task.assignedTo.image || "/placeholder.svg"}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-sm">
                    {task.assignedTo.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-900">
                    ✅ Assigned to {task.assignedTo.name}
                  </p>
                  <p className="text-xs text-emerald-700 font-medium">
                    {task.assignedTo.email}
                  </p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-emerald-700" />
              </div>
            ) : assignment ? (
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-100 rounded-xl border border-blue-300 shadow-sm">
                <Avatar className="h-9 w-9 ring-3 ring-blue-400 shadow-md">
                  <AvatarImage
                    src={
                      agents.find((a) => a.id === assignment.agentId)?.image ||
                      "/placeholder.svg"
                    }
                  />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm">
                    {agents
                      .find((a) => a.id === assignment.agentId)
                      ?.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900">
                    🎯 Will be assigned to{" "}
                    {agents.find((a) => a.id === assignment.agentId)?.name}
                  </p>
                  <p className="text-xs text-blue-700 font-medium">
                    {agents.find((a) => a.id === assignment.agentId)?.email}
                  </p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-blue-700" />
              </div>
            ) : isSelected ? (
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>
                    {isFirstSelectedTask && isMultipleSelected
                      ? `Assign ${selectedTasks.size} tasks to:`
                      : "Assign to Team Member:"}
                  </span>
                </label>
                <div className="relative">
                  <Select
                    value=""
                    onValueChange={handleAssignmentChange}
                    disabled={shouldDisableDropdown}
                  >
                    <SelectTrigger
                      className={`h-12 text-sm transition-all duration-200 rounded-xl shadow-sm ${
                        shouldDisableDropdown
                          ? "border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50 text-gray-500 cursor-not-allowed"
                          : "border-2 border-blue-300 hover:border-blue-500 bg-gradient-to-r from-white via-blue-50 to-indigo-50 hover:shadow-md"
                      }`}
                    >
                      <SelectValue
                        placeholder={
                          shouldDisableDropdown
                            ? "🔗 Controlled by first selected task..."
                            : "🎯 Choose the perfect agent..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 shadow-xl">
                      {filteredAgents.map((agent) => (
                        <SelectItem
                          key={agent.id}
                          value={agent.id}
                          className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 rounded-lg m-1"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-7 w-7 ring-2 ring-blue-300 shadow-sm">
                              <AvatarImage
                                src={agent.image || "/placeholder.svg"}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold">
                                {agent.name?.charAt(0) || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {agent.name}
                              </p>
                              <p className="text-xs text-gray-600 capitalize font-medium">
                                {agent.category} Team
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Bulk assignment indicator */}
                  {isFirstSelectedTask && isMultipleSelected && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg animate-pulse font-bold">
                      Bulk Control
                    </div>
                  )}

                  {/* Disabled indicator */}
                  {shouldDisableDropdown && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-gray-500 to-slate-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-bold">
                      Linked
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-100 via-slate-50 to-zinc-100 rounded-xl border border-gray-300 shadow-sm">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 font-medium">
                  Select task to assign an agent
                </span>
              </div>
            )}
            {task.templateSiteAsset?.isRequired && (
              <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-orange-100 via-red-50 to-rose-100 rounded-xl border border-orange-300 shadow-sm">
                <AlertCircle className="h-4 w-4 text-orange-700" />
                <span className="text-sm text-orange-900 font-bold">
                  ⚡ Required Task
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const TaskListItem = ({
    task,
    siteType,
    note,
    onNoteChange,
  }: {
    task: Task;
    siteType: string;
    note: string;
    onNoteChange: (note: string) => void;
  }) => {
    const isSelected = selectedTasks.has(task.id);
    const assignment = taskAssignments.find((a) => a.taskId === task.id);
    const filteredAgents = getFilteredAgents(siteType);
    const SiteIcon = siteTypeIcons[siteType as keyof typeof siteTypeIcons];

    // Get the first selected task ID for bulk assignment control
    const firstSelectedTaskId = selectedTasksOrder.find((id) =>
      selectedTasks.has(id)
    );
    const isFirstSelectedTask = firstSelectedTaskId === task.id;
    const isMultipleSelected = selectedTasks.size > 1;
    const shouldDisableDropdown =
      isMultipleSelected && isSelected && !isFirstSelectedTask;

    // Handle assignment change for bulk assignment
    const handleAssignmentChange = (agentId: string) => {
      if (isMultipleSelected && isFirstSelectedTask) {
        // Bulk assignment: assign the same agent to all currently selected tasks
        const selectedTasksArray = Array.from(selectedTasks);
        const newAssignments: TaskAssignment[] = selectedTasksArray.map(
          (taskId) => ({
            taskId,
            agentId,
          })
        );

        setTaskAssignments((prev) => {
          // Remove existing assignments for currently selected tasks
          const filtered = prev.filter(
            (assignment) => !selectedTasks.has(assignment.taskId)
          );
          // Add new bulk assignments
          return [...filtered, ...newAssignments];
        });

        // Clear selection after assignment to end bulk assignment mode
        setSelectedTasks(new Set());
        setSelectedTasksOrder([]);

        toast.success(`Assigned ${selectedTasksArray.length} tasks to agent`);
      } else {
        // Individual assignment
        setTaskAssignments((prev) => {
          const filtered = prev.filter(
            (assignment) => assignment.taskId !== task.id
          );
          if (agentId) {
            return [...filtered, { taskId: task.id, agentId }];
          }
          return filtered;
        });

        // Clear selection after individual assignment
        setSelectedTasks(new Set());
        setSelectedTasksOrder([]);
      }
    };

    return (
      <Card
        className={`transition-all duration-300 ${
          isSelected
            ? "ring-2 ring-blue-400 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-300 shadow-lg"
            : "hover:shadow-md bg-gradient-to-r from-white via-gray-50 to-slate-50 border-gray-200 hover:border-gray-300"
        }`}
      >
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                handleTaskSelection(task.id, checked as boolean)
              }
              className="w-5 h-5 rounded-md border-2 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-500"
            />

            <div
              className={`p-2.5 rounded-xl ${
                siteTypeColors[siteType as keyof typeof siteTypeColors]
              } shadow-sm`}
            >
              <SiteIcon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  {task.name}
                </h3>
                <div className="flex items-center space-x-2 ml-4">
                  <Badge
                    className={`text-xs font-bold shadow-sm ${
                      priorityColors[
                        task.priority as keyof typeof priorityColors
                      ]
                    }`}
                  >
                    {task.priority.toUpperCase()}
                  </Badge>
                  <Badge
                    className={`text-xs font-bold shadow-sm ${
                      statusColors[task.status as keyof typeof statusColors]
                    }`}
                  >
                    {task.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>

              {task.templateSiteAsset?.description && (
                <p className="text-xs text-gray-700 mt-1 truncate font-medium">
                  {task.templateSiteAsset.description}
                </p>
              )}

              <div className="flex items-center space-x-3 mt-2 text-xs">
                <div className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 px-2.5 py-1 rounded-lg shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-700" />
                  <span className="text-blue-800 font-bold">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
                {task.idealDurationMinutes && (
                  <div className="flex items-center space-x-1.5 bg-gradient-to-r from-violet-100 to-purple-100 px-2.5 py-1 rounded-lg shadow-sm">
                    <Clock className="h-3.5 w-3.5 text-violet-700" />
                    <span className="text-violet-800 font-bold">
                      {task.idealDurationMinutes}min
                    </span>
                  </div>
                )}
                {task.templateSiteAsset?.isRequired && (
                  <div className="flex items-center space-x-1.5 bg-gradient-to-r from-orange-100 to-red-100 px-2.5 py-1 rounded-lg shadow-sm">
                    <AlertCircle className="h-3.5 w-3.5 text-orange-700" />
                    <span className="text-orange-800 font-bold">Required</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-72">
              {task.assignedTo ? (
                <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-emerald-100 via-green-50 to-teal-100 rounded-xl border border-emerald-300 shadow-sm">
                  <Avatar className="h-7 w-7 ring-2 ring-emerald-400 shadow-sm">
                    <AvatarImage
                      src={task.assignedTo.image || "/placeholder.svg"}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs">
                      {task.assignedTo.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-900 truncate">
                      {task.assignedTo.name}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                </div>
              ) : assignment ? (
                <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-100 rounded-xl border border-blue-300 shadow-sm">
                  <Avatar className="h-7 w-7 ring-2 ring-blue-400 shadow-sm">
                    <AvatarImage
                      src={
                        agents.find((a) => a.id === assignment.agentId)
                          ?.image || "/placeholder.svg"
                      }
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs">
                      {agents
                        .find((a) => a.id === assignment.agentId)
                        ?.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-900 truncate">
                      {agents.find((a) => a.id === assignment.agentId)?.name}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-blue-700" />
                </div>
              ) : isSelected ? (
                <div className="relative">
                  <Select
                    value=""
                    onValueChange={handleAssignmentChange}
                    disabled={shouldDisableDropdown}
                  >
                    <SelectTrigger
                      className={`h-10 text-xs transition-all duration-200 rounded-xl shadow-sm ${
                        shouldDisableDropdown
                          ? "border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50 text-gray-500 cursor-not-allowed"
                          : "border-2 border-blue-300 hover:border-blue-500 bg-gradient-to-r from-white to-blue-50 hover:shadow-md"
                      }`}
                    >
                      <SelectValue
                        placeholder={
                          shouldDisableDropdown
                            ? "Controlled by first task..."
                            : isFirstSelectedTask && isMultipleSelected
                            ? `Choose agent for ${selectedTasks.size} tasks...`
                            : "Choose agent..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 shadow-xl">
                      {filteredAgents.map((agent) => (
                        <SelectItem
                          key={agent.id}
                          value={agent.id}
                          className="p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 rounded-lg m-1"
                        >
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6 ring-2 ring-blue-300 shadow-sm">
                              <AvatarImage
                                src={agent.image || "/placeholder.svg"}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold">
                                {agent.name?.charAt(0) || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-bold text-gray-900">
                                {agent.name}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Bulk assignment indicator */}
                  {isFirstSelectedTask && isMultipleSelected && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white text-xs px-2.5 py-1 rounded-full shadow-lg font-bold">
                      Bulk ({selectedTasks.size})
                    </div>
                  )}

                  {/* Disabled indicator */}
                  {shouldDisableDropdown && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-500 to-slate-500 text-white text-xs px-2.5 py-1 rounded-full shadow-lg font-bold">
                      Linked
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-gray-100 to-slate-100 rounded-xl border border-gray-300 shadow-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-700 font-medium">
                    Select to assign
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes field */}
          <div className="mt-3 relative group">
            <label
              htmlFor={`note-${task.id}`}
              className="text-xs font-semibold text-slate-900 mb-1 flex items-center gap-1"
            >
              <span className="bg-indigo-100 p-1 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </span>
              Task Notes
            </label>
            <div className="relative">
              <textarea
                id={`note-${task.id}`}
                rows={3}
                placeholder="✏️ Add your notes here..."
                className="w-full text-sm p-3 rounded-lg border-2 border-indigo-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 resize-none transition-all duration-200 group-hover:border-indigo-200 placeholder-indigo-200 text-indigo-800"
                 value={note}
                onChange={(e) => { e.target.value.length <= 500 && onNoteChange(e.target.value);
                  
                }}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <span className="text-xs text-indigo-300 font-medium">
                  {note?.length || 0}/500
                </span>
                <span className="text-indigo-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TabContent = ({
    siteType,
    tasks,
  }: {
    siteType: string;
    tasks: Task[];
  }) => {
    const selectedTasksInTab = tasks.filter((task) =>
      selectedTasks.has(task.id)
    ).length;
    const assignedTasksInTab = tasks.filter((task) =>
      taskAssignments.some((assignment) => assignment.taskId === task.id)
    ).length;

    const siteTypeConfig = {
      social_site: {
        title: "Social Media Tasks",
        description: "Manage social media content and engagement tasks",
        gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
        bgGradient: "from-violet-100 via-purple-50 to-fuchsia-100",
        iconBg: "from-violet-500 to-purple-600",
      },
      web2_site: {
        title: "Web2 Platform Tasks",
        description: "Handle web2 platform content and management",
        gradient: "from-blue-600 via-cyan-600 to-sky-600",
        bgGradient: "from-blue-100 via-cyan-50 to-sky-100",
        iconBg: "from-blue-500 to-cyan-600",
      },
      other_asset: {
        title: "Other Asset Tasks",
        description: "Manage miscellaneous assets and content",
        gradient: "from-slate-600 via-gray-600 to-zinc-600",
        bgGradient: "from-slate-100 via-gray-50 to-zinc-100",
        iconBg: "from-slate-500 to-gray-600",
      },
    };

    const config = siteTypeConfig[siteType as keyof typeof siteTypeConfig];

    return (
      <div className="space-y-6">
        <div
          className={`rounded-2xl bg-gradient-to-r ${config.bgGradient} p-8 border-2 border-white shadow-xl`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <div
                className={`p-4 rounded-2xl bg-gradient-to-r ${config.iconBg} text-white shadow-lg`}
              >
                {React.createElement(
                  siteTypeIcons[siteType as keyof typeof siteTypeIcons],
                  { className: "h-7 w-7" }
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {config.title}
                </h3>
                <p className="text-gray-700 font-medium">
                  {config.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {tasks.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Total Tasks
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {selectedTasksInTab}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Selected
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-700">
                  {assignedTasksInTab}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Assigned
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSelectAllTasks(
                    tasks.map((t) => t.id),
                    true
                  )
                }
                disabled={tasks.length === 0}
                className={`bg-gradient-to-r ${config.gradient} text-white border-0 hover:opacity-90 font-bold px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
              >
                ✅ Select All ({tasks.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSelectAllTasks(
                    tasks.map((t) => t.id),
                    false
                  )
                }
                disabled={selectedTasksInTab === 0}
                className="bg-white text-gray-800 border-2 border-gray-400 hover:bg-gray-50 font-bold px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                ❌ Deselect All
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold text-gray-800">
                View Mode:
              </span>
              <div className="flex items-center bg-white rounded-xl p-1.5 shadow-lg border-2 border-gray-200">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-9 px-4 font-bold"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-9 px-4 font-bold"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-gradient-to-br from-white via-gray-50 to-slate-100 rounded-2xl border-2 border-gray-200 shadow-xl">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div
                  className={`w-24 h-24 rounded-full bg-gradient-to-r ${config.iconBg} flex items-center justify-center mx-auto mb-8 shadow-2xl`}
                >
                  {React.createElement(
                    siteTypeIcons[siteType as keyof typeof siteTypeIcons],
                    {
                      className: "h-12 w-12 text-white",
                    }
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  No {config.title} Found
                </h3>
                <p className="text-gray-600 font-medium">
                  There are currently no tasks in this category for the selected
                  client.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {tasks.map((task) =>
              viewMode === "grid" ? (
                <TaskCard key={task.id} task={task} siteType={siteType} />
              ) : (
                <TaskListItem 
                key={task.id} 
                task={task} 
                siteType={siteType}
                note={taskNotes[task.id] || ""}
                onNoteChange={(note) =>
                   handleNoteChange(task.id, note)
                 }
                
                />
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100">
      <div className="container mx-auto p-8">
        {/* Main Parent Card */}
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-gray-50 to-slate-50 overflow-hidden">
          {/* Header Section */}
          <CardHeader className="bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-800 text-white p-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent">
                  Task Distribution Center
                </CardTitle>
                <CardDescription className="text-slate-200 text-xl font-medium">
                  Efficiently distribute tasks to your team members with smart
                  categorization and advanced management
                </CardDescription>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl">
                  <Users className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-10 space-y-10">
            {/* Client Selection Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border border-cyan-600 rounded-lg p-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  Client Selection
                </h3>
                <Button
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors"
                  onClick={() => setClientModalOpen(true)}
                  aria-label="Open client selection modal"
                >
                  <Users className="h-4 w-4" />
                  <span>Select Client</span>
                </Button>
              </div>

              {selectedClient && (
                <div className="flex items-center space-x-6 p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-md transition-all duration-300">
                  <Avatar className="h-16 w-16 ring-2 ring-blue-400">
                    <AvatarImage
                      src={selectedClient.avatar || "/placeholder.svg"}
                    />
                    <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
                      {selectedClient.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-blue-900">
                      {selectedClient.name}
                    </h2>
                    <p className="text-sm text-gray-700">
                      <Building2 className="inline-block h-4 w-4 mr-1 text-gray-500" />
                      {selectedClient.company || "N/A"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedClient.status && (
                        <Badge
                          variant="outline"
                          className={`${
                            selectedClient.status === "active"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          }`}
                        >
                          {selectedClient.status}
                        </Badge>
                      )}
                      {selectedClient.package?.name && (
                        <Badge
                          variant="secondary"
                          className="bg-indigo-100 text-indigo-800"
                        >
                          📦 {selectedClient.package.name}
                        </Badge>
                      )}
                      {selectedClient.location && (
                        <Badge
                          variant="outline"
                          className="bg-sky-100 text-sky-800 border-sky-300"
                        >
                          📍 {selectedClient.location}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      {selectedClient.startDate && (
                        <p>
                          🟢 Start:{" "}
                          <span className="font-medium">
                            {new Date(
                              selectedClient.startDate
                            ).toLocaleDateString()}
                          </span>
                        </p>
                      )}
                      {selectedClient.dueDate && (
                        <p>
                          🔚 Due:{" "}
                          <span className="font-medium">
                            {new Date(
                              selectedClient.dueDate
                            ).toLocaleDateString()}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <ClientSelectModal
                isOpen={clientModalOpen}
                onClose={() => setClientModalOpen(false)}
                onSelect={async (clientId) => {
                  setSelectedClientId(clientId);

                  const res = await fetch(`/api/clients/${clientId}`);
                  const data = await res.json();
                  setSelectedClient(data);
                }}
              />
            </div>

            {/* Task Distribution Interface */}
            {selectedClientId && (
              <div className="space-y-8">
                {/* Dashboard Header */}
                <div className="bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-800 text-white p-8 rounded-2xl shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-3">
                        Task Distribution Dashboard
                      </h3>
                      <p className="text-slate-200 text-lg font-medium">
                        Select tasks and assign them to the most suitable team
                        members with precision
                      </p>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="text-right z-10">
                        <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl p-4 backdrop-blur-sm border border-white/20 shadow-lg">
                          <div className="text-sm text-slate-100 font-medium">
                            Tasks Selected
                          </div>
                          <div className="text-3xl font-bold">
                            {selectedTasks.size}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-4 backdrop-blur-sm border border-white/20 shadow-lg">
                          <div className="text-sm text-slate-100 font-medium">
                            Ready to Assign
                          </div>
                          <div className="text-3xl font-bold">
                            {taskAssignments.length}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={submitTaskDistribution}
                        disabled={taskAssignments.length === 0 || submitting}
                        size="lg"
                        className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:via-teal-700 hover:to-green-700 text-white font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {submitting ? (
                          <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span className="text-lg">
                              Distributing Tasks...
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-lg">
                              Distribute {taskAssignments.length} Tasks
                            </span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tasks Content */}
                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6 shadow-lg"></div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
                      </div>
                      <p className="text-2xl font-bold text-gray-800 mb-3">
                        Loading Tasks
                      </p>
                      <p className="text-gray-600 font-medium">
                        Fetching client tasks and organizing by categories with
                        advanced sorting...
                      </p>
                    </div>
                  </div>
                ) : (
                  <Tabs defaultValue="social_site" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-200 to-slate-200 p-2 rounded-2xl h-16 shadow-lg">
                      <TabsTrigger
                        value="social_site"
                        className="flex items-center space-x-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:via-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white rounded-xl font-bold transition-all duration-300 transform data-[state=active]:scale-105 shadow-md"
                      >
                        <Users className="h-5 w-5" />
                        <span>Social Sites</span>
                        <Badge className="bg-violet-200 text-violet-900 ml-2 font-bold shadow-sm">
                          {categorizedTasks.social_site.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="web2_site"
                        className="flex items-center space-x-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-cyan-600 data-[state=active]:to-sky-600 data-[state=active]:text-white rounded-xl font-bold transition-all duration-300 transform data-[state=active]:scale-105 shadow-md"
                      >
                        <Globe className="h-5 w-5" />
                        <span>Web2 Sites</span>
                        <Badge className="bg-blue-200 text-blue-900 ml-2 font-bold shadow-sm">
                          {categorizedTasks.web2_site.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger
                        value="other_asset"
                        className="flex items-center space-x-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:via-gray-600 data-[state=active]:to-zinc-600 data-[state=active]:text-white rounded-xl font-bold transition-all duration-300 transform data-[state=active]:scale-105 shadow-md"
                      >
                        <Building2 className="h-5 w-5" />
                        <span>Other Assets</span>
                        <Badge className="bg-slate-200 text-slate-900 ml-2 font-bold shadow-sm">
                          {categorizedTasks.other_asset.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="social_site" className="mt-8">
                      <TabContent
                        siteType="social_site"
                        tasks={categorizedTasks.social_site}
                      />
                    </TabsContent>
                    <TabsContent value="web2_site" className="mt-8">
                      <TabContent
                        siteType="web2_site"
                        tasks={categorizedTasks.web2_site}
                      />
                    </TabsContent>
                    <TabsContent value="other_asset" className="mt-8">
                      <TabContent
                        siteType="other_asset"
                        tasks={categorizedTasks.other_asset}
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
