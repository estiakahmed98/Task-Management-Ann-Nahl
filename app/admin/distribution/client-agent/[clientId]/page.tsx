"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Users,
  Building2,
  Repeat,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getInitialsFromName, nameToColor } from "@/utils/avatar";

import type {
  Agent,
  Client,
  Task,
} from "@/components/task-distribution/distribution-types";
import { LoadingSpinner } from "@/components/task-distribution/LoadingSpinner";
import { TaskTabs } from "@/components/task-distribution/TaskTabs";
import { Textarea } from "@/components/ui/textarea";

/* =========================
   Helpers (hoisted)
   ========================= */

// Asset-type enum → human-facing label (existing logic)
function mapSiteAssetTypeToCategory(type: string | undefined): string {
  if (!type) return "Other";
  if (type === "graphics_design") return "Graphics Design";
  if (["social_site", "web2_site", "other_asset"].includes(type)) {
    return "Asset Creation";
  }
  const labels: Record<string, string> = {
    content_studio: "Content Studio",
    content_writing: "Content Writing",
    backlinks: "Backlinks",
    completed_com: "Completed Communication",
    youtube_video_optimization: "YouTube Video Optimization",
    monitoring: "Monitoring",
    review_removal: "Review Removal",
    summary_report: "Summary Report",
  };
  return labels[type] ?? type;
}

// ✅ NEW: Posting categories to show (order matters; after Asset Creation)
const POSTING_CATEGORIES = ["Social Activity", "Blog Posting"] as const;

// --- Team routing maps (ids from your Team table) ---
const TEAM_ID_BY_CATEGORY: Record<string, string> = {
  "Asset Creation": "asset-team",
  "Graphics Design": "graphics-design-team",
  // ✅ NEW: both go to social-team
  "Social Activity": "social-team",
  "Blog Posting": "social-team",

  "Content Studio": "content-studio-team",
  "Content Writing": "content-writing",
  Backlinks: "backlinks-team",
  "Completed Communication": "completedcom-",
  "YouTube Video Optimization": "youtube-video-optimizer-",
  Monitoring: "monitoring-team",
  "Review Removal": "review-removal-team",
  "Summary Report": "summary-report-team",
};

// Optional pretty names
const TEAM_NAME_BY_ID: Record<string, string> = {
  "social-team": "Social Team",
  "graphics-design-team": "Graphics Design Team",
  "content-studio-team": "Content Studio Team",
  "content-writing": "Content Writing",
  "backlinks-team": "Backlinks Team",
  "completedcom-": "Completed.com Team",
  "youtube-video-optimizer-": "YouTube Video Optimizer",
  "monitoring-team": "Monitoring Team",
  "review-removal-team": "Review Removal Team",
  "summary-report-team": "Summary Report Team",
  "asset-team": "Asset Team",
  "design-team": "Design Team",
  "developer-team": "Developer Team",
  "qc-team": "QC Team",
};

// ✅ Dropdown options (Asset Creation, then new posting categories)
const CATEGORY_LABELS = [
  "Graphics Design",
  "Asset Creation",
  ...POSTING_CATEGORIES,
  "Content Studio",
  "Content Writing",
  "Backlinks",
  "Completed Communication",
  "YouTube Video Optimization",
  "Monitoring",
  "Review Removal",
  "Summary Report",
];

function teamIdForCategory(cat: string) {
  return TEAM_ID_BY_CATEGORY[cat] ?? "social-team";
}
function teamNameForCategory(cat: string) {
  const id = teamIdForCategory(cat);
  return TEAM_NAME_BY_ID[id] ?? id;
}

// Weighted load helpers (existing)
type AgentWithLoad = Agent & {
  byStatus?: Record<string, number>;
  activeCount?: number;
  weightedScore?: number;
  displayLabel?: string;
};
const WEIGHTS = { P: 1, IP: 2, O: 3, R: 2 };

function safeName(a: Partial<Agent>) {
  return (
    (a as any)?.name ||
    `${(a as any)?.firstName ?? ""} ${(a as any)?.lastName ?? ""}`.trim() ||
    (a as any)?.email ||
    "Agent"
  );
}
function computeWeighted(byStatus: Record<string, number> = {}) {
  const P = byStatus["pending"] ?? 0;
  const IP = byStatus["in_progress"] ?? 0;
  const O = byStatus["overdue"] ?? 0;
  const R = byStatus["reassigned"] ?? 0;
  return {
    activeCount: P + IP + O + R,
    weightedScore:
      P * WEIGHTS.P + IP * WEIGHTS.IP + O * WEIGHTS.O + R * WEIGHTS.R,
    P,
    IP,
    O,
    R,
  };
}
function makeDisplayLabel(
  a: Partial<Agent>,
  active: number,
  weight: number,
  s: { P: number; IP: number; O: number; R: number }
) {
  return `${safeName(a)} — ${active} active (P:${s.P} | IP:${s.IP} | O:${
    s.O
  } | R:${s.R}) • W:${weight}`;
}
async function fetchOverallForAgent(a: Agent): Promise<AgentWithLoad> {
  try {
    const res = await fetch(`/api/tasks/agents/${a.id}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("agent fetch failed");
    const data = await res.json();

    const byStatus: Record<string, number> = {};
    for (const t of (data.tasks as Task[]) ?? []) {
      byStatus[(t as any).status] = (byStatus[(t as any).status] ?? 0) + 1;
    }

    const { activeCount, weightedScore, P, IP, O, R } =
      computeWeighted(byStatus);
    return {
      ...a,
      byStatus: { pending: P, in_progress: IP, overdue: O, reassigned: R },
      activeCount,
      weightedScore,
      displayLabel: makeDisplayLabel(a, activeCount, weightedScore, {
        P,
        IP,
        O,
        R,
      }),
    };
  } catch {
    return {
      ...a,
      byStatus: { pending: 0, in_progress: 0, overdue: 0, reassigned: 0 },
      activeCount: 0,
      weightedScore: 0,
      displayLabel: makeDisplayLabel(a, 0, 0, { P: 0, IP: 0, O: 0, R: 0 }),
    };
  }
}
async function enrichAgentsWithOverallLoad(
  base: Agent[]
): Promise<AgentWithLoad[]> {
  const enriched = await Promise.all(base.map(fetchOverallForAgent));
  enriched.sort(
    (x, y) =>
      (x.weightedScore ?? 0) - (y.weightedScore ?? 0) ||
      (x.activeCount ?? 0) - (y.activeCount ?? 0) ||
      safeName(x).localeCompare(safeName(y))
  );
  return enriched;
}

/* ------------------- Category stats ------------------- */

type CategoryStats = {
  total: number;
  assigned: number;
  fullyAssigned: boolean;
  agents: Record<string, number>;
  dueMin?: string;
  dueMax?: string;
  allDueSame: boolean;
};

function buildCategoryStats(list: Task[] = []): CategoryStats {
  const res: CategoryStats = {
    total: 0,
    assigned: 0,
    fullyAssigned: false,
    agents: {},
    allDueSame: true,
  };

  for (const t of list) {
    res.total += 1;

    const agentId = (t as any).assignedToId as string | undefined;
    if (agentId) {
      res.assigned += 1;
      res.agents[agentId] = (res.agents[agentId] ?? 0) + 1;
    }

    const dueRaw = (t as any).dueDate;
    if (dueRaw) {
      const due = new Date(dueRaw);
      if (!isNaN(due.getTime())) {
        const iso = due.toISOString();
        if (!res.dueMin || new Date(iso) < new Date(res.dueMin))
          res.dueMin = iso;
        if (!res.dueMax || new Date(iso) > new Date(res.dueMax))
          res.dueMax = iso;
        if (res.dueMin && res.dueMax && res.dueMin !== res.dueMax)
          res.allDueSame = false;
      }
    }
  }

  res.fullyAssigned = res.total > 0 && res.assigned === res.total;
  return res;
}

type SimpleCategoryStats = { total: number; assigned: number };

// ✅ NEW: decide which UI category a task belongs to
function getUICategoryForTask(t: Task): string {
  const enumType = (t as any)?.templateSiteAsset?.type as string | undefined;

  // Asset Creation (from enum)
  if (["social_site", "web2_site", "other_asset"].includes(enumType ?? "")) {
    return "Asset Creation";
  }

  // Posting categories (from t.category.name)
  const catName = (t as any)?.category?.name as string | undefined;
  if (catName && (POSTING_CATEGORIES as readonly string[]).includes(catName)) {
    return catName;
  }

  // Fallback to existing enum->label map
  return mapSiteAssetTypeToCategory(enumType);
}

function buildStatsByCategory(
  list: Task[] = []
): Record<string, SimpleCategoryStats> {
  const map: Record<string, SimpleCategoryStats> = {};
  for (const t of list) {
    const label = getUICategoryForTask(t);
    if (!map[label]) map[label] = { total: 0, assigned: 0 };
    map[label].total += 1;
    if ((t as any)?.assignedToId) map[label].assigned += 1;
  }
  return map;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDaysSafe(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* =========================
   Component
   ========================= */

interface CategoryAssignment {
  taskId: string;
  agentId: string;
  assetType: string | undefined; // enum string for asset-creation; undefined for posting
}

export default function TaskDistributionForClient() {
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId;

  const [client, setClient] = useState<Client | null>(null);

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // filtered by category

  const [agents, setAgents] = useState<AgentWithLoad[]>([]);

  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedTasksOrder, setSelectedTasksOrder] = useState<string[]>([]);
  const [categoryAssignments, setCategoryAssignments] = useState<
    CategoryAssignment[]
  >([]);
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // default category
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Graphics Design");
  const [categoryDueDate, setCategoryDueDate] = useState<Date>();
  const [duePickerOpen, setDuePickerOpen] = useState(false);

  // -------- Data fetchers --------

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch client");
      const data = await res.json();
      setClient(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load client profile");
    }
  };

  const fetchAgentsOverall = async (teamId?: string) => {
    try {
      const url = teamId
        ? `/api/tasks/agents?teamId=${encodeURIComponent(teamId)}`
        : `/api/tasks/agents`;
      const response = await fetch(url, { cache: "no-store" });
      const baseAgents: Agent[] = await response.json();
      const enriched = await enrichAgentsWithOverallLoad(baseAgents);
      setAgents(enriched);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    }
  };

  const fetchClientTasks = async (cid: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/client/${cid}`, {
        cache: "no-store",
      });
      const data = await response.json();
      setAllTasks(data);

      const notesMap: Record<string, string> = {};
      (data as Task[]).forEach((task) => {
        if ((task as any).notes) notesMap[task.id] = (task as any).notes;
      });
      setTaskNotes(notesMap);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load client tasks");
    } finally {
      setLoading(false);
    }
  };

  // -------- Effects --------

  useEffect(() => {
    if (!clientId) return;
    fetchClient();
    // default to Graphics Design => fetch agents for that category
    fetchAgentsOverall(teamIdForCategory("Graphics Design"));
    fetchClientTasks(clientId);
  }, [clientId]);

  useEffect(() => {
    // ✅ use the new helper to include posting categories
    const filtered = (allTasks ?? []).filter(
      (t) => getUICategoryForTask(t) === selectedCategory
    );
    setTasks(filtered);
  }, [allTasks, selectedCategory]);

  // -------- Derived / helpers --------

  const formatISO = (iso?: string) =>
    iso ? format(new Date(iso), "PPP") : undefined;

  // Buckets for Asset Creation only
  const categorizedTasksForAssetCreation = {
    social_site: tasks.filter(
      (task) => (task as any)?.templateSiteAsset?.type === "social_site"
    ),
    web2_site: tasks.filter(
      (task) => (task as any)?.templateSiteAsset?.type === "web2_site"
    ),
    other_asset: tasks.filter(
      (task) => (task as any)?.templateSiteAsset?.type === "other_asset"
    ),
  };

  const getAgentName = (id: string | undefined) => {
    if (!id) return "Unassigned";
    const a = agents.find((x) => (x as any).id === id);
    return (
      a?.name ||
      `${(a as any)?.firstName ?? ""} ${(a as any)?.lastName ?? ""}`.trim() ||
      "Unknown"
    );
  };

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (checked) newSet.add(taskId);
      else {
        newSet.delete(taskId);
        setCategoryAssignments((assignments) =>
          assignments.filter((assignment) => assignment.taskId !== taskId)
        );
      }
      return newSet;
    });

    setSelectedTasksOrder((prev) =>
      checked
        ? prev.includes(taskId)
          ? prev
          : [...prev, taskId]
        : prev.filter((id) => id !== taskId)
    );
  };

  const handleSelectAllTasks = (taskIds: string[], checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(taskIds));
      setSelectedTasksOrder(taskIds);
      toast.info(`Selected ${taskIds.length} tasks from current view`);
    } else {
      const currentViewTaskIds = new Set(taskIds);
      const preserved = Array.from(selectedTasks).filter(
        (id) => !currentViewTaskIds.has(id)
      );
      setSelectedTasks(new Set(preserved));
      setSelectedTasksOrder((prev) =>
        prev.filter((id) => !currentViewTaskIds.has(id))
      );
      setCategoryAssignments((assignments) =>
        assignments.filter((a) => !currentViewTaskIds.has(a.taskId))
      );
    }
  };

  const handleTaskAssignment = (
    taskId: string,
    agentId: string,
    isMultipleSelected: boolean,
    isFirstSelectedTask: boolean
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    const assetType = (task as any)?.templateSiteAsset?.type as
      | string
      | undefined;

    // bulk apply if multiple selected
    if (isMultipleSelected && isFirstSelectedTask) {
      const selectedArray = Array.from(selectedTasks);
      const newAssignments: CategoryAssignment[] = selectedArray.map((id) => {
        const t = tasks.find((x) => x.id === id);
        return {
          taskId: id,
          agentId,
          assetType: (t as any)?.templateSiteAsset?.type,
        };
      });

      setCategoryAssignments((prev) => {
        const filtered = prev.filter((a) => !selectedTasks.has(a.taskId));
        return [...filtered, ...newAssignments];
      });

      setSelectedTasks(new Set());
      setSelectedTasksOrder([]);
      toast.success(`Assigned ${selectedArray.length} tasks to agent`);
    } else {
      setCategoryAssignments((prev) => {
        const filtered = prev.filter((a) => a.taskId !== taskId);
        if (agentId) return [...filtered, { taskId, agentId, assetType }];
        return filtered;
      });

      setSelectedTasks(new Set());
      setSelectedTasksOrder([]);
    }
  };

  const handleNoteChange = (taskId: string, note: string) => {
    setTaskNotes((prev) => ({ ...prev, [taskId]: note }));
  };

  const submitTaskDistribution = async () => {
    if (categoryAssignments.length === 0) {
      toast.warning("⚠️ No Assignments", {
        description:
          "Please assign at least one task to an agent before distributing",
      });
      return;
    }

    if (!categoryDueDate) {
      toast.warning("⚠️ Due Date Required", {
        description: "Please select a due date for this category’s tasks",
      });
      return;
    }

    setSubmitting(true);
    try {
      const endOfDay = new Date(categoryDueDate);
      endOfDay.setHours(23, 59, 59, 999);
      const formattedDueDate = endOfDay.toISOString();

      const requestBody = {
        clientId,
        category: selectedCategory, // optional logging context
        assignments: categoryAssignments.map((assignment) => ({
          taskId: assignment.taskId,
          agentId: assignment.agentId,
          note: taskNotes[assignment.taskId] || "",
          dueDate: formattedDueDate,
        })),
      };

      const response = await fetch("/api/tasks/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("🎉 Tasks Distributed Successfully!", {
          description: `${categoryAssignments.length} tasks have been assigned for ${selectedCategory}. Notifications sent.`,
          duration: 5000,
        });

        await fetchClientTasks(clientId!);
        await fetchAgentsOverall(teamIdForCategory(selectedCategory));

        setCategoryAssignments([]);
        setSelectedTasks(new Set());
        setSelectedTasksOrder([]);
        setCategoryDueDate(undefined);
      } else {
        console.error("[category] API error response:", result);
        throw new Error(result.message || "Failed to distribute tasks");
      }
    } catch (error) {
      console.error("[category] Error distributing tasks:", error);
      toast.error("❌ Task Distribution Failed", {
        description: "Please try again or contact support.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // -------- Render --------

  const stats = buildCategoryStats(tasks);
  const statsByCategory = useMemo(
    () => buildStatsByCategory(allTasks),
    [allTasks]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100">
      <div className="container mx-auto p-8">
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-gray-50 to-slate-50 overflow-hidden">
          <CardHeader className="relative overflow-hidden bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 text-slate-800 p-6 rounded-t-xl border-b border-slate-200">
            <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_0%_0%,rgba(59,130,246,0.10),transparent_60%)]" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-2xl font-bold mb-1 bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Category-Based Task Distribution
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Asset Creation first, then Social Activity & Blog Posting —
                  both go to Social Team.
                </CardDescription>
              </div>

              <div className="hidden md:flex items-center">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-cyan-100 via-blue-100 to-indigo-100 ring-1 ring-slate-200 shadow-sm flex items-center justify-center">
                  <Repeat className="h-7 w-7 text-blue-700" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 lg:p-10 space-y-10">
            {/* CLIENT HEADER */}
            {client && (
              <div className="flex items-center gap-5 p-5 md:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <Avatar className="h-16 w-16 ring-2 ring-blue-500/60">
                  {client.avatar && (
                    <AvatarImage
                      src={client.avatar}
                      alt={client.name || "Client avatar"}
                    />
                  )}
                  <AvatarFallback
                    className="text-white text-xl font-bold"
                    style={{
                      backgroundColor: nameToColor(client.name || client.id),
                    }}
                  >
                    {getInitialsFromName(client.name || client.id)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 truncate">
                      {client.name || "Unnamed Client"}
                    </h2>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">
                    <Building2 className="inline-block h-4 w-4 mr-1 text-slate-500" />
                    {client.company || "N/A"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {client.status && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "border px-2.5 py-1 rounded-full text-xs",
                          client.status === "active"
                            ? "bg-green-50 text-green-800 border-green-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        )}
                      >
                        {client.status}
                      </Badge>
                    )}
                    {client.package?.name && (
                      <Badge
                        variant="secondary"
                        className="rounded-full text-xs bg-indigo-50 text-indigo-800 px-2.5 py-1"
                      >
                        📦 {client.package.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY CONTROLS & SUMMARY */}
            <section
              aria-labelledby="category-assignment-heading"
              className="space-y-6"
            >
              <div className="border rounded-2xl p-6 md:p-7 bg-gradient-to-br from-purple-50 to-white border-purple-200/70">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Category Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Select Category to Assign
                    </label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(label) => {
                        setSelectedCategory(label);
                        setCategoryAssignments([]);
                        setSelectedTasks(new Set());
                        setSelectedTasksOrder([]);
                        setCategoryDueDate(undefined);
                        // ✅ route to the right team (Social Team for Social Activity & Blog Posting)
                        fetchAgentsOverall(teamIdForCategory(label));
                      }}
                    >
                      <SelectTrigger className="w-full h-11 rounded-xl border-slate-300">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>

                      <SelectContent className="rounded-xl shadow-lg border border-slate-200 bg-white">
                        {CATEGORY_LABELS.map((label) => {
                          const s = statsByCategory[label];
                          const fully =
                            !!s && s.total > 0 && s.assigned === s.total;
                          const teamName = teamNameForCategory(label);

                          return (
                            <SelectItem
                              key={label}
                              value={label}
                              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-800">
                                  {label}
                                </span>
                                <span className="text-[10px] uppercase tracking-wide bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                                  {teamName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {s ? (
                                  fully ? (
                                    <span className="flex items-center text-emerald-600 text-xs font-semibold">
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      All Assigned
                                    </span>
                                  ) : (
                                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                      {s.assigned}/{s.total}
                                    </span>
                                  )
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    No tasks
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Due Date for All Tasks in {selectedCategory}
                    </label>
                    <Popover
                      open={duePickerOpen}
                      onOpenChange={setDuePickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-10 justify-start text-left font-medium rounded-xl border-slate-300",
                            !categoryDueDate && "text-muted-foreground"
                          )}
                          aria-label="Open date picker"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {categoryDueDate
                            ? format(categoryDueDate, "PPP")
                            : "Select due date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        align="start"
                        sideOffset={8}
                        className="p-0 w-[350px] overflow-hidden rounded-2xl border border-slate-200 shadow-2xl bg-white"
                      >
                        <div className="px-3 py-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500">
                          <div className="text-[10px] uppercase tracking-wide text-white/80">
                            Due date
                          </div>
                          <div className="text-lg font-semibold text-white leading-5">
                            {categoryDueDate
                              ? format(categoryDueDate, "EEE, MMM d")
                              : "Pick a date"}
                          </div>
                        </div>

                        <div className="p-2">
                          <Calendar
                            mode="single"
                            selected={categoryDueDate}
                            onSelect={(d) => {
                              if (!d) return;
                              d.setHours(0, 0, 0, 0);
                              setCategoryDueDate(d);
                              setDuePickerOpen(false);
                            }}
                            disabled={(date) => date < startOfToday()}
                            initialFocus
                            className="rounded-lg"
                          />
                        </div>

                        <div className="px-2 py-2 border-t bg-white flex flex-wrap gap-1.5">
                          <button
                            className="h-7 px-3 text-xs rounded-full bg-slate-100 hover:bg-slate-200 text-cyan-600 font-semibold"
                            onClick={() => {
                              const d = startOfToday();
                              setCategoryDueDate(d);
                              setDuePickerOpen(false);
                            }}
                          >
                            Today
                          </button>
                          <button
                            className="h-7 px-3 text-xs rounded-full bg-slate-100 hover:bg-slate-200 text-cyan-600 font-semibold"
                            onClick={() => {
                              const d = addDaysSafe(new Date(), 1);
                              setCategoryDueDate(d);
                              setDuePickerOpen(false);
                            }}
                          >
                            Tomorrow
                          </button>
                          <button
                            className="h-7 px-3 text-xs rounded-full bg-slate-100 hover:bg-slate-200 text-cyan-600 font-semibold"
                            onClick={() => {
                              const d = addDaysSafe(new Date(), 7);
                              setCategoryDueDate(d);
                              setDuePickerOpen(false);
                            }}
                          >
                            +7 days
                          </button>

                          <div className="flex-1" />
                          <button
                            className="h-7 px-3 text-xs bg-slate-100 rounded-full text-cyan-600 hover:bg-slate-100 font-semibold"
                            onClick={() => {
                              setCategoryDueDate(undefined);
                              setDuePickerOpen(false);
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <h3
                  id="category-assignment-heading"
                  className="text-lg md:text-xl font-semibold text-slate-800 mb-4"
                >
                  {selectedCategory} Assignment
                </h3>

                {/* Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-2xl p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base md:text-lg font-semibold text-blue-900">
                      Assignment Summary
                    </h4>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-3 py-1 text-xs",
                        stats.fullyAssigned
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      )}
                      aria-live="polite"
                    >
                      {`${stats.assigned}/${stats.total} assigned`}
                      {stats.fullyAssigned ? " • All Set ✓" : ""}
                    </Badge>
                  </div>

                  {(categoryDueDate || categoryAssignments.length > 0) && (
                    <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                      <p className="text-sm text-cyan-900">
                        {categoryDueDate && (
                          <>
                            <CalendarIcon className="inline h-4 w-4 mr-1" />
                            Planned due date:{" "}
                            <strong>{format(categoryDueDate, "PPP")}</strong>
                          </>
                        )}
                        {categoryAssignments.length > 0 && (
                          <>
                            {categoryDueDate ? " • " : ""}
                            Pending to distribute now:{" "}
                            <strong>{categoryAssignments.length}</strong>{" "}
                            {categoryAssignments.length > 1 ? "tasks" : "task"}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Distribute button */}
                  <div className="mt-2">
                    <Button
                      onClick={submitTaskDistribution}
                      disabled={
                        submitting ||
                        categoryAssignments.length === 0 ||
                        !categoryDueDate
                      }
                      className={cn(
                        "w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600",
                        (submitting ||
                          categoryAssignments.length === 0 ||
                          !categoryDueDate) &&
                          "opacity-60 cursor-not-allowed"
                      )}
                      aria-disabled={
                        submitting ||
                        categoryAssignments.length === 0 ||
                        !categoryDueDate
                      }
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Distributing Tasks...
                        </div>
                      ) : (
                        `Distribute ${categoryAssignments.length} Task${
                          categoryAssignments.length !== 1 ? "s" : ""
                        } for ${selectedCategory}`
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* TASKS AREA */}
            {tasks.length > 0 ? (
              <section aria-labelledby="tasks-heading" className="space-y-8">
                <h3 id="tasks-heading" className="sr-only">
                  Tasks
                </h3>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : selectedCategory === "Asset Creation" ? (
                  // Tabs (Asset Creation)
                  <TaskTabs
                    categorizedTasks={categorizedTasksForAssetCreation}
                    agents={agents}
                    selectedTasks={selectedTasks}
                    selectedTasksOrder={selectedTasksOrder}
                    taskAssignments={categoryAssignments.map((ca) => ({
                      taskId: ca.taskId,
                      agentId: ca.agentId,
                    }))}
                    taskNotes={taskNotes}
                    viewMode={viewMode}
                    onTaskSelection={handleTaskSelection}
                    onSelectAllTasks={handleSelectAllTasks}
                    onTaskAssignment={handleTaskAssignment}
                    onNoteChange={handleNoteChange}
                    onViewModeChange={setViewMode}
                  />
                ) : (
                  // Single-tab view for posting/new/other categories
                  <TaskTabs
                    singleTabTitle={selectedCategory}
                    singleTabTasks={tasks}
                    agents={agents}
                    selectedTasks={selectedTasks}
                    selectedTasksOrder={selectedTasksOrder}
                    taskAssignments={categoryAssignments.map((ca) => ({
                      taskId: ca.taskId,
                      agentId: ca.agentId,
                    }))}
                    taskNotes={taskNotes}
                    viewMode={viewMode}
                    onTaskSelection={handleTaskSelection}
                    onSelectAllTasks={(ids, checked) =>
                      handleSelectAllTasks(
                        tasks.map((t) => t.id),
                        checked
                      )
                    }
                    onTaskAssignment={handleTaskAssignment}
                    onNoteChange={handleNoteChange}
                    onViewModeChange={setViewMode}
                  />
                )}
              </section>
            ) : (
              // EMPTY STATE
              <section
                aria-live="polite"
                className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-center"
              >
                <h3 className="text-base md:text-lg font-semibold text-yellow-900 mb-1.5">
                  No Tasks Available for {selectedCategory}
                </h3>
                <p className="text-sm text-yellow-800/90">
                  Either all tasks in this category are completed or none exist
                  yet.
                </p>
              </section>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
