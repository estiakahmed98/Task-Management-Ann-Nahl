// components/task-distribution/TaskTabs.tsx
"use client";

import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Building2 } from "lucide-react";
import { TabContent } from "./TabContent";
import {
  CategorizedTasks,
  Agent,
  TaskAssignment,
  Task,
} from "./distribution-types";

type AgentWithLoad = Agent & {
  displayLabel?: string;
  activeCount?: number;
  weightedScore?: number;
  byStatus?: Record<string, number>;
};

interface TaskTabsProps {
  // Standard (Asset Creation) 3-tab mode
  categorizedTasks?: CategorizedTasks;

  // Agents + shared state/handlers
  agents: AgentWithLoad[];
  selectedTasks: Set<string>;
  selectedTasksOrder: string[];
  taskAssignments: TaskAssignment[];
  taskNotes: Record<string, string>;
  viewMode: "list" | "grid";
  onTaskSelection: (taskId: string, checked: boolean) => void;
  onSelectAllTasks: (taskIds: string[], checked: boolean) => void;
  onTaskAssignment: (
    taskId: string,
    agentId: string,
    isMultipleSelected: boolean,
    isFirstSelectedTask: boolean
  ) => void;
  onNoteChange: (taskId: string, note: string) => void;
  onViewModeChange: (mode: "list" | "grid") => void;

  // ⭐ Single-tab mode (for non–Asset Creation categories)
  singleTabTasks?: Task[]; // if provided, TaskTabs renders one list using the SAME card design
  singleTabTitle?: string; // header label, e.g. "Graphics Design"
}

function agentDisplayName(a: Partial<AgentWithLoad>) {
  return (
    (a as any)?.name ||
    `${(a as any)?.firstName ?? ""} ${(a as any)?.lastName ?? ""}`.trim() ||
    (a as any)?.email ||
    "Agent"
  );
}

function formatLabel(a: AgentWithLoad) {
  if (a.displayLabel) return a.displayLabel;

  const name = agentDisplayName(a);
  const ac = a.activeCount ?? 0;
  const w = a.weightedScore ?? 0;
  const s = a.byStatus ?? {};
  const p = s["pending"] ?? 0;
  const ip = s["in_progress"] ?? 0;
  const o = s["overdue"] ?? 0;
  const r = s["reassigned"] ?? 0;

  return `${name} — ${ac} active (P:${p} | IP:${ip} | O:${o} | R:${r}) • W:${w}`;
}

export function TaskTabs({
  categorizedTasks,
  singleTabTasks,
  singleTabTitle,
  agents,
  selectedTasks,
  selectedTasksOrder,
  taskAssignments,
  taskNotes,
  viewMode,
  onTaskSelection,
  onSelectAllTasks,
  onTaskAssignment,
  onNoteChange,
  onViewModeChange,
}: TaskTabsProps) {
  // Prepare labels and sort (least → most load)
  const agentsWithLabels: AgentWithLoad[] = useMemo(() => {
    const enriched = (agents || []).map((a) => ({
      ...a,
      displayLabel: formatLabel(a),
      activeCount: a.activeCount ?? 0,
      weightedScore: a.weightedScore ?? 0,
      byStatus: a.byStatus ?? {},
    }));
    enriched.sort(
      (x, y) =>
        (x.weightedScore ?? 0) - (y.weightedScore ?? 0) ||
        (x.activeCount ?? 0) - (y.activeCount ?? 0) ||
        agentDisplayName(x).localeCompare(agentDisplayName(y))
    );
    return enriched;
  }, [agents]);

  // -----------------------------
  // SINGLE-TAB MODE (non–Asset Creation)
  // -----------------------------
  if (singleTabTasks) {
    const title = singleTabTitle ?? "Tasks";

    return (
      <div className="w-full">
        {/* Header bar (no pills), matching your aesthetics */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-base md:text-lg font-semibold text-slate-800">
            {title}
          </div>
          <Badge className="rounded-full bg-cyan-100 text-cyan-900 ring-1 ring-inset ring-cyan-300/50">
            {singleTabTasks.length}
          </Badge>
        </div>

        <div className="mt-6">
          <TabContent
            // siteType here is just a tag; card design comes from TabContent
            siteType="single"
            tasks={singleTabTasks}
            agents={agentsWithLabels}
            selectedTasks={selectedTasks}
            selectedTasksOrder={selectedTasksOrder}
            taskAssignments={taskAssignments}
            taskNotes={taskNotes}
            viewMode={viewMode}
            onTaskSelection={onTaskSelection}
            // Bulk select is scoped to the visible list
            onSelectAllTasks={onSelectAllTasks}
            onTaskAssignment={onTaskAssignment}
            onNoteChange={onNoteChange}
            onViewModeChange={onViewModeChange}
            // 🔹 make header dynamic
            titleOverride={`${singleTabTitle ?? "Tasks"} Tasks`}
            descriptionOverride={`Manage ${singleTabTitle ?? "these"} tasks`}
          />
        </div>
      </div>
    );
  }

  // -----------------------------
  // 3-TAB MODE (Asset Creation)
  // -----------------------------
  const safe = {
    social_site: categorizedTasks?.social_site ?? [],
    web2_site: categorizedTasks?.web2_site ?? [],
    other_asset: categorizedTasks?.other_asset ?? [],
  };

  return (
    <Tabs defaultValue="social_site" className="w-full">
      {/* Water drop Tabs */}
      <TabsList className="grid grid-cols-3 gap-3">
        {/* Social Sites */}
        <TabsTrigger
          value="social_site"
          className="group relative overflow-visible px-5 py-3 rounded-[28px] font-semibold
                 text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white shadow-sm
                 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md
                 ring-1 ring-slate-200/70 transition-all duration-300
                 data-[state=active]:text-slate-900
                 data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-100 data-[state=active]:via-blue-100 data-[state=active]:to-indigo-100
                 data-[state=active]:shadow-lg data-[state=active]:ring-cyan-300/60"
        >
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 opacity-80 group-data-[state=active]:opacity-100" />
            <span>Social Sites</span>
            <Badge className="ml-1 rounded-full bg-cyan-100 text-cyan-900 ring-1 ring-inset ring-cyan-300/50">
              {safe.social_site.length}
            </Badge>
          </span>
        </TabsTrigger>

        {/* Web2 Sites */}
        <TabsTrigger
          value="web2_site"
          className="group relative overflow-visible px-5 py-3 rounded-[28px] font-semibold
                 text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white shadow-sm
                 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md
                 ring-1 ring-slate-200/70 transition-all duration-300
                 data-[state=active]:text-slate-900
                 data-[state=active]:bg-gradient-to-br data-[state=active]:from-sky-100 data-[state=active]:via-blue-100 data-[state=active]:to-cyan-100
                 data-[state=active]:shadow-lg data-[state=active]:ring-sky-300/60"
        >
          <span className="flex items-center gap-2">
            <Globe className="h-5 w-5 opacity-80 group-data-[state=active]:opacity-100" />
            <span>Web2 Sites</span>
            <Badge className="ml-1 rounded-full bg-sky-100 text-sky-900 ring-1 ring-inset ring-sky-300/50">
              {safe.web2_site.length}
            </Badge>
          </span>
        </TabsTrigger>

        {/* Other Assets */}
        <TabsTrigger
          value="other_asset"
          className="group relative overflow-visible px-5 py-3 rounded-[28px] font-semibold
                 text-slate-700 hover:text-slate-900 bg-white/70 hover:bg-white shadow-sm
                 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md
                 ring-1 ring-slate-200/70 transition-all duration-300
                 data-[state=active]:text-slate-900
                 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-100 data-[state=active]:via-violet-100 data-[state=active]:to-fuchsia-100
                 data-[state=active]:shadow-lg data-[state=active]:ring-violet-300/60"
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5 opacity-80 group-data-[state=active]:opacity-100" />
            <span>Other Assets</span>
            <Badge className="ml-1 rounded-full bg-violet-100 text-violet-900 ring-1 ring-inset ring-violet-300/50">
              {safe.other_asset.length}
            </Badge>
          </span>
        </TabsTrigger>
      </TabsList>

      {/* Tab panes */}
      <TabsContent value="social_site" className="mt-8">
        <TabContent
          siteType="social_site"
          tasks={safe.social_site}
          agents={agentsWithLabels}
          selectedTasks={selectedTasks}
          selectedTasksOrder={selectedTasksOrder}
          taskAssignments={taskAssignments}
          taskNotes={taskNotes}
          viewMode={viewMode}
          onTaskSelection={onTaskSelection}
          onSelectAllTasks={onSelectAllTasks}
          onTaskAssignment={onTaskAssignment}
          onNoteChange={onNoteChange}
          onViewModeChange={onViewModeChange}
        />
      </TabsContent>

      <TabsContent value="web2_site" className="mt-8">
        <TabContent
          siteType="web2_site"
          tasks={safe.web2_site}
          agents={agentsWithLabels}
          selectedTasks={selectedTasks}
          selectedTasksOrder={selectedTasksOrder}
          taskAssignments={taskAssignments}
          taskNotes={taskNotes}
          viewMode={viewMode}
          onTaskSelection={onTaskSelection}
          onSelectAllTasks={onSelectAllTasks}
          onTaskAssignment={onTaskAssignment}
          onNoteChange={onNoteChange}
          onViewModeChange={onViewModeChange}
        />
      </TabsContent>

      <TabsContent value="other_asset" className="mt-8">
        <TabContent
          siteType="other_asset"
          tasks={safe.other_asset}
          agents={agentsWithLabels}
          selectedTasks={selectedTasks}
          selectedTasksOrder={selectedTasksOrder}
          taskAssignments={taskAssignments}
          taskNotes={taskNotes}
          viewMode={viewMode}
          onTaskSelection={onTaskSelection}
          onSelectAllTasks={onSelectAllTasks}
          onTaskAssignment={onTaskAssignment}
          onNoteChange={onNoteChange}
          onViewModeChange={onViewModeChange}
        />
      </TabsContent>
    </Tabs>
  );
}
