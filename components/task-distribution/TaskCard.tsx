"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Link,
  Lock,
  Pencil,
} from "lucide-react";
import { Agent, Task, TaskAssignment } from "./distribution-types";
import {
  priorityColors,
  siteTypeColors,
  siteTypeIcons,
  statusColors,
} from "./task-constants";
import { nameToColor, getInitialsFromName } from "@/utils/avatar";

interface TaskCardProps {
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

export function TaskCard({
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
}: TaskCardProps) {
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

  const displayName = (u: any) =>
    u?.name ||
    `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() ||
    u?.email ||
    "User";

  // Compact load indicator component
  const LoadIndicator = (a: any) => {
    const by = a?.byStatus || {};
    const P = by.pending ?? 0;
    const IP = by.in_progress ?? 0;
    const O = by.overdue ?? 0;
    const R = by.reassigned ?? 0;
    const active = a?.activeCount ?? P + IP + O + R;
    const W = a?.weightedScore ?? P * 1 + IP * 2 + O * 3 + R * 2;

    return (
      <div className="flex items-center gap-1.5 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-slate-400" />
          <span className="font-medium text-slate-700">{P}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-indigo-500" />
          <span className="font-medium text-slate-700">{IP}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-rose-500" />
          <span className="font-medium text-slate-700">{O}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="font-medium text-slate-700">{R}</span>
        </div>
        <div className="h-3 w-px bg-slate-300 mx-1" />
        <span className="font-semibold text-slate-900">{active}</span>
        <span className="text-slate-500">active</span>
        <div className="h-3 w-px bg-slate-300 mx-1" />
        <span className="font-semibold text-amber-700">W:{W}</span>
      </div>
    );
  };

  return (
    <Card
      className={`group transition-all duration-300 overflow-hidden ${
        isSelected
          ? "ring-2 ring-blue-500 shadow-md bg-blue-50 border-blue-200"
          : "hover:shadow-md bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                onTaskSelection(task.id, checked as boolean)
              }
              className="mt-1 w-5 h-5 rounded-md border-2 data-[state=checked]:bg-blue-600"
            />
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2.5 rounded-lg ${
                  siteTypeColors[siteType as keyof typeof siteTypeColors]
                }`}
              >
                <SiteIcon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900 leading-tight line-clamp-1">
                  {task.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium px-1.5 py-0 h-5 ${
                      siteTypeColors[siteType as keyof typeof siteTypeColors]
                    }`}
                  >
                    {siteType.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium px-1.5 py-0 h-5 ${
                      priorityColors[
                        task.priority as keyof typeof priorityColors
                      ]
                    }`}
                  >
                    {task.priority.toUpperCase()}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium px-1.5 py-0 h-5 ${
                      statusColors[task.status as keyof typeof statusColors]
                    }`}
                  >
                    {task.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {task.templateSiteAsset?.description && (
          <CardDescription className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-200">
            {task.templateSiteAsset.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* details */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-md">
              <CalendarDays className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-slate-800 font-medium">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
            {task.idealDurationMinutes && (
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-md">
                <Clock className="h-3.5 w-3.5 text-slate-600" />
                <span className="text-slate-800 font-medium">
                  {task.idealDurationMinutes}min
                </span>
              </div>
            )}
          </div>
        </div>

        {/* url */}
        {task.templateSiteAsset?.url && (
          <div className="text-xs bg-slate-50 p-2.5 rounded-md border border-slate-200">
            <span className="text-slate-700 font-medium">URL: </span>
            <a
              href={task.templateSiteAsset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors truncate inline-block max-w-[180px]"
            >
              {task.templateSiteAsset.url}
            </a>
          </div>
        )}

        {/* assignment */}
        {task.assignedTo ? (
          (() => {
            const dn = displayName(task.assignedTo);
            return (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-md border border-emerald-200">
                <Avatar className="h-8 w-8 ring-1 ring-emerald-300">
                  <AvatarImage
                    src={task.assignedTo.image || undefined}
                    alt={dn}
                  />
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ backgroundColor: nameToColor(dn) }}
                  >
                    {getInitialsFromName(dn)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-900 truncate">
                    Assigned to {dn}
                  </p>
                  {task.assignedTo.email && (
                    <p className="text-xs text-emerald-700 truncate">
                      {task.assignedTo.email}
                    </p>
                  )}
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              </div>
            );
          })()
        ) : assignment ? (
          (() => {
            const ag: any = (agents as any).find(
              (a: any) => a.id === assignment.agentId
            );
            const dn = displayName(ag);
            return (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                <Avatar className="h-8 w-8 ring-1 ring-blue-300">
                  <AvatarImage src={ag?.image || undefined} alt={dn} />
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ backgroundColor: nameToColor(dn) }}
                  >
                    {getInitialsFromName(dn)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-900 truncate">
                    Will assign to {dn}
                  </p>
                  {ag?.email && (
                    <p className="text-xs text-blue-700 truncate">{ag.email}</p>
                  )}
                </div>
                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
              </div>
            );
          })()
        ) : isSelected ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-blue-600" />
              <span>
                {isFirstSelectedTask && isMultipleSelected
                  ? `Assign ${isMultipleSelected ? "multiple" : ""} tasks to:`
                  : "Assign to:"}
              </span>
            </label>

            <div className="relative">
              <Select
                value=""
                onValueChange={handleAssignmentChange}
                disabled={shouldDisableDropdown}
              >
                <SelectTrigger
                  className={`h-10 text-xs rounded-md ${
                    shouldDisableDropdown
                      ? "border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed"
                      : "border-blue-300 hover:border-blue-400 bg-white focus:ring-1 focus:ring-blue-400"
                  }`}
                >
                  <SelectValue
                    placeholder={
                      shouldDisableDropdown
                        ? "Controlled by first selected task..."
                        : "Select an agent..."
                    }
                  />
                </SelectTrigger>

                <SelectContent className="rounded-md border shadow-lg p-1.5 max-h-[300px]">
                  {filteredAgents.map((agent: any) => {
                    const dn = displayName(agent);
                    return (
                      <SelectItem
                        key={agent.id}
                        value={agent.id}
                        className="p-2 hover:bg-slate-100 rounded-md text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-6 w-6 ring-1 ring-slate-300">
                            <AvatarImage
                              src={agent.image || undefined}
                              alt={dn}
                            />
                            <AvatarFallback
                              className="text-xs font-semibold"
                              style={{ backgroundColor: nameToColor(dn) }}
                            >
                              {getInitialsFromName(dn)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate">
                              {dn}
                            </div>
                            <LoadIndicator agent={agent} />
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {shouldDisableDropdown && (
                <div className="absolute -top-1.5 -right-1.5 bg-slate-600 text-white text-xs px-2 py-0.5 rounded-full">
                  <Lock className="h-2.5 w-2.5" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-md border border-slate-200">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-slate-700">
              Select task to assign
            </span>
          </div>
        )}

        {task.templateSiteAsset?.isRequired && (
          <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-md border border-amber-200">
            <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
            <span className="text-xs font-semibold text-amber-900">
              Required Task
            </span>
          </div>
        )}

        {/* notes */}
        <div>
          <label
            htmlFor={`note-${task.id}`}
            className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-600" />
            Notes
          </label>

          <div className="relative">
            <textarea
              id={`note-${task.id}`}
              rows={2}
              placeholder="Add task notes..."
              className="w-full text-xs p-2.5 rounded-md border border-slate-300 bg-white 
                focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 
                resize-none transition-colors duration-150 placeholder-slate-400 text-slate-800"
              value={note}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  onNoteChange(e.target.value);
                }
              }}
            />
            <div className="absolute bottom-1.5 right-1.5">
              <span className="text-xs text-slate-400 bg-white pl-1">
                {note?.length || 0}/200
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
