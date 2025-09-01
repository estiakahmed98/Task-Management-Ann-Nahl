// components/task-distribution/TaskListItem.tsx
"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Agent, Task, TaskAssignment } from "./distribution-types";
import {
  priorityColors,
  siteTypeColors,
  siteTypeIcons,
  statusColors,
} from "./task-constants";

// ✅ avatar helpers
import {
  nameToColor,
  getInitialsFromName,
  getInitialsFromParts,
} from "@/utils/avatar";

interface TaskListItemProps {
  task: Task;
  siteType: string;
  agents: Agent[];
  isSelected: boolean;
  assignment: TaskAssignment | undefined;
  isFirstSelectedTask: boolean;
  isMultipleSelected: boolean;
  note: string;
  onTaskSelection: (taskId: string, checked: boolean) => void;
  onTaskAssignment: (
    taskId: string,
    agentId: string,
    isMultipleSelected: boolean,
    isFirstSelectedTask: boolean
  ) => void;
  onNoteChange: (note: string) => void;
}

export const TaskListItem = memo(function TaskListItem({
  task,
  siteType,
  agents,
  isSelected,
  assignment,
  isFirstSelectedTask,
  isMultipleSelected,
  note,
  onTaskSelection,
  onTaskAssignment,
  onNoteChange,
}: TaskListItemProps) {
  const filteredAgents = agents.filter((agent: any) => {
    const categoryMap: { [key: string]: string } = {
      social_site: "social",
      web2_site: "web2",
      other_asset: "general",
    };
    const targetCategory = categoryMap[siteType] || "general";
    return (
      agent.category?.toLowerCase() === targetCategory ||
      agent.role?.name?.toLowerCase() === "agent"
    );
  });

  const SiteIcon = siteTypeIcons[siteType as keyof typeof siteTypeIcons];
  const shouldDisableDropdown =
    isMultipleSelected && isSelected && !isFirstSelectedTask;

  const handleAssignmentChange = (agentId: string) => {
    onTaskAssignment(task.id, agentId, isMultipleSelected, isFirstSelectedTask);
  };

  const LoadChips = (a: any) => {
    const by = a?.byStatus || {};
    const P = by.pending ?? 0;
    const IP = by.in_progress ?? 0;
    const O = by.overdue ?? 0;
    const R = by.reassigned ?? 0;
    const active = a?.activeCount ?? P + IP + O + R;
    const W = a?.weightedScore ?? P * 1 + IP * 2 + O * 3 + R * 2;

    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className="bg-emerald-100/70 text-emerald-900 border-emerald-300"
        >
          {active} active
        </Badge>
        <Badge
          variant="outline"
          className="bg-amber-100/70 text-amber-900 border-amber-300"
        >
          W:{W}
        </Badge>
        <div className="mx-1 h-3.5 w-px bg-slate-200" />
        <Badge
          variant="outline"
          className="bg-slate-100 text-slate-900 border-slate-300"
        >
          P:{P}
        </Badge>
        <Badge
          variant="outline"
          className="bg-indigo-100 text-indigo-900 border-indigo-300"
        >
          IP:{IP}
        </Badge>
        <Badge
          variant="outline"
          className="bg-rose-100 text-rose-900 border-rose-300"
        >
          O:{O}
        </Badge>
        <Badge
          variant="outline"
          className="bg-orange-100 text-orange-900 border-orange-300"
        >
          R:{R}
        </Badge>
      </div>
    );
  };

  // ---------- small helpers for avatar rendering ----------
  function AvatarWithFallback({
    name,
    image,
    size = "h-7 w-7",
    ring = "ring-2 ring-blue-400",
    textClass = "text-xs",
  }: {
    name: string;
    image?: string | null;
    size?: string;
    ring?: string;
    textClass?: string;
  }) {
    const bg = nameToColor(name || "user");
    const initials = getInitialsFromName(name || "U");
    return (
      <Avatar className={`${size} ${ring} shadow-sm`}>
        {image ? <AvatarImage src={image} alt={name} /> : null}
        <AvatarFallback
          style={{ backgroundColor: bg }}
          className={`text-white font-bold ${textClass}`}
        >
          {initials || "U"}
        </AvatarFallback>
      </Avatar>
    );
  }
  // --------------------------------------------------------

  return (
    <Card
      className={`transition-all duration-300 ${
        isSelected
          ? "ring-2 ring-blue-400 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-300 shadow-lg"
          : "hover:shadow-md bg-gradient-to-r from-white via-gray-50 to-slate-50 border-gray-200 hover:border-gray-300"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              onTaskSelection(task.id, checked as boolean)
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
              // ✅ already assigned
              <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-emerald-100 via-green-50 to-teal-100 rounded-xl border border-emerald-300 shadow-sm">
                <AvatarWithFallback
                  name={
                    task.assignedTo.name ||
                    `${(task.assignedTo as any)?.firstName ?? ""} ${
                      (task.assignedTo as any)?.lastName ?? ""
                    }`.trim() ||
                    "Agent"
                  }
                  image={task.assignedTo.image || undefined}
                  ring="ring-2 ring-emerald-400"
                  size="h-7 w-7"
                  textClass="text-xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-900 truncate">
                    {task.assignedTo.name}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
            ) : assignment ? (
              // ✅ assigned in this session (preview)
              <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-100 rounded-xl border border-blue-300 shadow-sm">
                {(() => {
                  const ag: any = (agents as any).find(
                    (a: any) => a.id === assignment.agentId
                  );
                  const display =
                    ag?.name ||
                    `${ag?.firstName ?? ""} ${ag?.lastName ?? ""}`.trim() ||
                    ag?.email ||
                    "Agent";
                  return (
                    <>
                      <AvatarWithFallback
                        name={display}
                        image={ag?.image || undefined}
                        ring="ring-2 ring-blue-400"
                        size="h-7 w-7"
                        textClass="text-xs"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-blue-900 truncate">
                          {display}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-blue-700" />
                    </>
                  );
                })()}
              </div>
            ) : isSelected ? (
              // chooser
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
                          ? "Choose agent for multiple tasks..."
                          : "Choose agent..."
                      }
                    />
                  </SelectTrigger>

                  <SelectContent className="rounded-xl border-2 shadow-xl p-2">
                    <div className="px-3 py-2 mb-1 text-[11px] text-slate-600 bg-slate-50 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-slate-400" />{" "}
                          P
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />{" "}
                          IP
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />{" "}
                          O
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-orange-500" />{" "}
                          R
                        </span>
                        <span className="ml-auto">Active / W</span>
                      </div>
                    </div>

                    {filteredAgents.map((agent: any) => {
                      const display =
                        agent.name ||
                        `${agent.firstName ?? ""} ${
                          agent.lastName ?? ""
                        }`.trim() ||
                        agent.email ||
                        "Agent";
                      const initials = getInitialsFromParts(
                        agent.firstName,
                        agent.lastName,
                        agent.name || agent.email
                      );
                      const bg = nameToColor(display);

                      return (
                        <SelectItem
                          key={agent.id}
                          value={agent.id}
                          className="p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 rounded-lg m-1"
                        >
                          <div className="flex items-start gap-2">
                            <Avatar className="h-6 w-6 ring-2 ring-blue-300 shadow-sm">
                              {agent.image ? (
                                <AvatarImage src={agent.image} alt={display} />
                              ) : null}
                              <AvatarFallback
                                style={{ backgroundColor: bg }}
                                className="text-white text-[10px] font-bold"
                              >
                                {initials || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-slate-900">
                                {display}
                              </div>
                              {LoadChips(agent)}
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {isFirstSelectedTask && isMultipleSelected && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white text-[10px] px-2.5 py-1 rounded-full shadow-lg font-bold">
                    Bulk
                  </div>
                )}
                {shouldDisableDropdown && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-500 to-slate-500 text-white text-[10px] px-2.5 py-1 rounded-full shadow-lg font-bold">
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

        {/* notes */}
        <div className="mt-4 relative group">
          <label
            htmlFor={`note-${task.id}`}
            className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-2"
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
              className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-white shadow-sm 
               focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 
               resize-none transition-all duration-200 group-hover:border-slate-400 
               placeholder-slate-400 text-slate-800"
              value={note}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  onNoteChange(e.target.value);
                }
              }}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <span className="text-xs text-slate-400 font-medium">
                {note?.length || 0}/500
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
