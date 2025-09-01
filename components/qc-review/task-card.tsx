"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, User, Clock, ExternalLink, CheckCircle, RotateCcw, Star } from "lucide-react"

interface TaskCardProps {
  task: any // Using any for now since the TaskRow type is complex
  approvedMap: Record<string, boolean>
  onApprove: (task: any) => void // Now passes the full task object instead of just ID
  onReject: (task: any) => void // This will handle reassign functionality
}

const priorityConfig = {
  low: {
    color: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700",
    icon: "🟢",
  },
  medium: {
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
    icon: "🔵",
  },
  high: {
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700",
    icon: "🟡",
  },
  urgent: {
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
    icon: "🔴",
  },
}

const performanceGradients = {
  Excellent: "from-emerald-400 via-green-500 to-teal-600",
  Good: "from-blue-400 via-indigo-500 to-purple-600",
  Average: "from-amber-400 via-orange-500 to-red-500",
  Lazy: "from-red-400 via-pink-500 to-rose-600",
}

const performanceConfig = {
  Excellent: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300",
    icon: "🏆",
    score: 100,
  },
  Good: {
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300",
    icon: "⭐",
    score: 80,
  },
  Average: {
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300",
    icon: "🎯",
    score: 60,
  },
  Lazy: {
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300",
    icon: "⚠️",
    score: 30,
  },
}

const getDurationEfficiency = (ideal: number | null, actual: number | null) => {
  if (!ideal || !actual) return { percentage: 0, status: "N/A" }
  const efficiency = (ideal / actual) * 100
  const roundedEfficiency = Math.min(efficiency, 150)

  let status = "Efficient"
  if (roundedEfficiency < 70) {
    status = "Inefficient"
  } else if (roundedEfficiency < 90) {
    status = "Acceptable"
  }

  return {
    percentage: Math.round(roundedEfficiency),
    status: status,
  }
}

const priorityBadge = (p: string) => {
  const config = priorityConfig[p as keyof typeof priorityConfig]
  return (
    <Badge variant="outline" className={`${config.color} font-medium`}>
      <span className="mr-1">{config.icon}</span>
      {p.charAt(0).toUpperCase() + p.slice(1)}
    </Badge>
  )
}

export function TaskCard({ task, approvedMap, onApprove, onReject }: TaskCardProps) {
  const efficiency = getDurationEfficiency(task.idealDurationMinutes, task.actualDurationMinutes)
  const isApproved = approvedMap[task.id]
  const cardGradient =
    performanceGradients[task.performanceRating as keyof typeof performanceGradients] ||
    "from-slate-400 via-slate-500 to-slate-600"

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.005] bg-white dark:bg-slate-900 border-0 shadow-md group">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cardGradient}`} />
      <div
        className={`absolute inset-0 bg-gradient-to-br ${cardGradient} opacity-2 group-hover:opacity-4 transition-opacity duration-300`}
      />

      <CardContent className="relative p-5">
        <div className="flex flex-col xl:flex-row xl:items-start gap-5">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  {task.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {priorityBadge(task.priority)}
                  {task.category && (
                    <Badge
                      variant="outline"
                      className={`text-xs border bg-gradient-to-r ${cardGradient} text-white border-transparent font-medium px-2 py-1 shadow-sm`}
                    >
                      {task.category.name}
                    </Badge>
                  )}
                  {task.templateSiteAsset && (
                    <Badge
                      variant="outline"
                      className="text-xs border bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent font-medium px-2 py-1 shadow-sm"
                    >
                      {task.templateSiteAsset.name}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                  ID: {task.id}
                </div>
              </div>

              {task.performanceRating && (
                <div className="flex flex-col items-end gap-2">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400 text-right font-medium">
                      Admin Rating
                    </div>
                    <div
                      className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                        performanceConfig[task.performanceRating as keyof typeof performanceConfig]?.color
                      } flex items-center gap-2`}
                    >
                      <Star className="h-3 w-3" />
                      <span>{performanceConfig[task.performanceRating as keyof typeof performanceConfig]?.icon}</span>
                      <span>{task.performanceRating}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 bg-gradient-to-r ${cardGradient} rounded-md`}>
                    <Building2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Client</span>
                </div>
                {task.client ? (
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{task.client.name}</div>
                    {task.client.company && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {task.client.company}
                      </div>
                    )}
                    {task.assignment?.template && (
                      <Badge variant="secondary" className="text-xs mt-1 bg-white dark:bg-slate-800 shadow-sm">
                        {task.assignment.template.name}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-xs">Not assigned</span>
                )}
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 bg-gradient-to-r ${cardGradient} rounded-md`}>
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Agent</span>
                </div>
                {task.assignedTo ? (
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {task.assignedTo.name ||
                        `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.trim() ||
                        "Unnamed"}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {task.assignedTo.email}
                    </div>
                    {task.assignedTo.category && (
                      <Badge
                        variant="outline"
                        className="text-xs mt-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                      >
                        {task.assignedTo.category}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-xs">Unassigned</span>
                )}
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 bg-gradient-to-r ${cardGradient} rounded-md`}>
                    <Clock className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Timeline</span>
                </div>
                <div className="space-y-1">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Created</div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {task.completedAt && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completed</div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                        {new Date(task.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:w-72 space-y-3">
            <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-md">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center">
                  <div className={`text-xl font-black bg-gradient-to-r ${cardGradient} bg-clip-text text-transparent`}>
                    {efficiency.percentage}%
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Efficiency</div>
                  <div
                    className={`text-xs font-bold mt-1 ${
                      efficiency.status === "Efficient"
                        ? "text-green-600"
                        : efficiency.status === "Acceptable"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {efficiency.status}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-black bg-gradient-to-r ${cardGradient} bg-clip-text text-transparent`}>
                    {Math.round((task.actualDurationMinutes / 60) * 10) / 10}h
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Actual</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    vs {Math.round((task.idealDurationMinutes / 60) * 10) / 10}h ideal
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <span>Progress</span>
                  <span className="font-bold">{task.completionPercentage}%</span>
                </div>
                <div className="relative">
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${cardGradient} rounded-full transition-all duration-1000 shadow-sm`}
                      style={{ width: `${task.completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {task.completionLink && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <Button
                  onClick={() => window.open(task.completionLink, "_blank")}
                  className="w-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-600 hover:via-teal-600 hover:to-emerald-600 text-white font-bold text-xs border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Completion
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => onApprove(task)}
                disabled={isApproved}
                size="sm"
                className={`flex-1 font-bold text-xs py-2 ${
                  isApproved
                    ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 shadow-md"
                    : `bg-gradient-to-r ${cardGradient} hover:opacity-90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`
                }`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {isApproved ? "Approved" : "Approve"}
              </Button>

              <Button
                onClick={() => onReject(task)}
                variant="outline"
                size="sm"
                className="flex-1 border border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30 font-bold text-xs py-2 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reassign
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
