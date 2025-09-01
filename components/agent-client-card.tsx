//app/components/agent-client-card.tsx

"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Eye, Edit, Package, FileText, Clock, CheckCircle, AlertCircle, Play, XCircle } from "lucide-react"

interface TaskCounts {
  total: number
  pending: number
  in_progress: number
  completed: number
  overdue: number
  cancelled: number
}

interface ClientData {
  id: string
  name: string
  company: string | null
  designation: string | null
  avatar: string | null
  status: string | null
  progress: number
  package: {
    id: string
    name: string
  } | null
  taskCounts: TaskCounts
}

interface AgentClientCardProps {
  client: ClientData
  onViewTasks: (clientId: string, clientName: string) => void
  onViewDetails: (clientId: string) => void
}

export function AgentClientCard({ client, onViewTasks, onViewDetails }: AgentClientCardProps) {
  const getStatusBadgeStyle = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }

  const getTaskStatusIcon = (type: string) => {
    switch (type) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  return (
    <Card className="group overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1 dark:border-slate-800/60 dark:bg-slate-900 dark:hover:shadow-slate-900/40">
      {/* Header */}
      <CardHeader className="relative p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-3 border-white shadow-lg ring-2 ring-slate-100 dark:border-slate-700 dark:ring-slate-800 flex-shrink-0">
              <AvatarImage
                src={client.avatar || undefined}
                alt={client.name}
                className="object-cover"
              />
              <AvatarFallback
                name={client.name}
                className="text-white text-lg sm:text-2xl font-bold"
              />
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{client.name}</h2>
              {client.company && (
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">{client.company}</p>
              )}
              {client.designation && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">{client.designation}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Badge
              className={`text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm ${getStatusBadgeStyle(
                client.status,
              )}`}
            >
              {client.status || "Pending"}
            </Badge>
            <Badge
              variant="outline"
              className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border-slate-200 dark:border-slate-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm shadow-sm flex items-center gap-1"
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span>{client.package?.name || "No Package"}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Overall Progress</span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{client.progress}%</span>
          </div>
          <div className="relative">
            <Progress
              value={client.progress}
              className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full pointer-events-none" />
          </div>
        </div>

        {/* Task Summary */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 p-4 sm:p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Task Summary</h3>
          </div>

          {client.taskCounts.total > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex justify-between sm:flex-col sm:justify-start">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Tasks</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    {client.taskCounts.total}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col sm:justify-start">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Completed</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                    {client.taskCounts.completed}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col sm:justify-start">
                  <span className="text-sm text-slate-600 dark:text-slate-400">In Progress</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                    {client.taskCounts.in_progress}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col sm:justify-start">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Pending</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">
                    {client.taskCounts.pending}
                  </span>
                </div>
              </div>

              {/* Quick Status Overview */}
              {(client.taskCounts.overdue > 0 || client.taskCounts.cancelled > 0) && (
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                  {client.taskCounts.overdue > 0 && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                      {getTaskStatusIcon("overdue")}
                      <span className="font-medium">{client.taskCounts.overdue} overdue</span>
                    </div>
                  )}
                  {client.taskCounts.cancelled > 0 && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      {getTaskStatusIcon("cancelled")}
                      <span className="font-medium">{client.taskCounts.cancelled} cancelled</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No tasks assigned yet</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="border-t border-slate-100 dark:border-slate-800 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 font-semibold text-sm sm:text-base group-hover:scale-[1.02]"
            onClick={() => onViewTasks(client.id, client.name)}
            disabled={client.taskCounts.total === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">View Tasks</span>
            <span className="sm:hidden">Tasks</span>
            <span className="ml-1">({client.taskCounts.total})</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => onViewDetails(client.id)}
            className="sm:w-auto w-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 font-semibold text-sm sm:text-base"
          >
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit Details</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
