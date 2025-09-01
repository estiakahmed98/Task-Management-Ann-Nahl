// component/task-distribution/TaskStats.tsx
"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { TaskAssignment } from "./distribution-types";

interface TaskStatsProps {
  selectedTasks: Set<string>;
  taskAssignments: TaskAssignment[];
  onSubmit: () => void;
  submitting: boolean;
}

export function TaskStats({
  selectedTasks,
  taskAssignments,
  onSubmit,
  submitting,
}: TaskStatsProps) {
  return (
    <div className="bg-gradient-to-r from-cyan-600 via-cyan-700 to-cyan-800 text-white p-8 rounded-2xl shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-3">
            Task Distribution Dashboard
          </h3>
          <p className="text-slate-200 text-lg font-medium">
            Select tasks, then assign to agents — dropdowns show each agent’s
            workload.
          </p>
        </div>
        <div className="flex items-center space-x-8">
          <div className="text-right z-10">
            <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl p-4 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="text-sm text-slate-100 font-medium">
                Tasks Selected
              </div>
              <div className="text-3xl font-bold">{selectedTasks.size}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-4 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="text-sm text-slate-100 font-medium">
                Ready to Assign
              </div>
              <div className="text-3xl font-bold">{taskAssignments.length}</div>
            </div>
          </div>
          <Button
            onClick={onSubmit}
            disabled={taskAssignments.length === 0 || submitting}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:via-teal-700 hover:to-green-700 text-white font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="text-lg">Distributing Tasks...</span>
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
  );
}
