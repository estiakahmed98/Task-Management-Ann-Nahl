////components/clients/clientsID/task.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  TrendingUp,
  Target,
  Calendar,
  BarChart3,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader,
  Link as LinkIcon,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Client } from "@/types/client"

interface TasksProps {
  clientData: Client
}

export function Tasks({ clientData }: TasksProps) {
  type TaskItem = NonNullable<Client["tasks"]>[number]

  // ---------- Aggregates ----------
  // normalize status variations to canonical keys
  const normalizeStatus = (raw?: string | null) => {
    const s = (raw ?? "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[-\s]+/g, "_")
    if (["done", "complete", "completed", "finished", "qc_approved", "approved"].includes(s)) return "completed"
    if (["in_progress", "in-progress", "progress", "doing", "working"].includes(s)) return "in_progress"
    if (["overdue", "late"].includes(s)) return "overdue"
    if (["pending", "todo", "not_started", "on_hold", "paused", "backlog"].includes(s)) return "pending"
    return s || "pending"
  }

  const totalTasks = clientData.tasks?.length || 0
  const completedTasks = clientData.tasks?.filter((t) => normalizeStatus((t as any).status) === "completed").length || 0
  const inProgressTasks = clientData.tasks?.filter((t) => normalizeStatus((t as any).status) === "in_progress").length || 0
  const pendingTasks = clientData.tasks?.filter((t) => normalizeStatus((t as any).status) === "pending").length || 0
  const overdueTasks = clientData.tasks?.filter((t) => normalizeStatus((t as any).status) === "overdue").length || 0

  // Define QC approval types and helpers
  type TaskWithQC = TaskItem & {
    reviewStatus?: string | null
    qcApproved?: boolean | string | null
    review?: { status?: string | null }
  }

  const isQcApproved = (t: TaskWithQC) => {
    // normalize string statuses
    const norm = (s?: string | null) =>
      (s ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_")

    // consider reviewStatus, nested review.status, and the task's own status
    const statusFromTask = norm((t as any).status)
    const status = norm(t.reviewStatus) || norm(t.review?.status) || statusFromTask

    // accept common variants
    const approvedVariants = new Set([
      "qc_approved",
      "approved_by_qc",
      "approved",
      "qa_approved",
    ])

    // handle boolean or "true" string
    const flag = t.qcApproved === true || t.qcApproved === "true"

    return flag || approvedVariants.has(status)
  }

  // Count QC approved tasks using the helper
  const qcApprovedTasks = clientData.tasks?.filter((t) => isQcApproved(t as TaskWithQC)).length ?? 0
  console.log("qcApprovedTasks", qcApprovedTasks)

  const derivedProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  // ---------- Dates ----------
  const getDaysElapsed = () => {
    if (!clientData.startDate) return 0
    const start = new Date(clientData.startDate).getTime()
    const today = Date.now()
    return Math.max(0, Math.ceil((today - start) / (1000 * 60 * 60 * 24)))
  }

  const getDaysRemaining = () => {
    if (!clientData.dueDate) return 0
    const due = new Date(clientData.dueDate).getTime()
    const today = Date.now()
    return Math.max(0, Math.ceil((due - today) / (1000 * 60 * 60 * 24)))
  }

  const getTotalDays = () => {
    if (!clientData.startDate || !clientData.dueDate) return 0
    const start = new Date(clientData.startDate).getTime()
    const due = new Date(clientData.dueDate).getTime()
    return Math.max(0, Math.ceil((due - start) / (1000 * 60 * 60 * 24)))
  }

  // ---------- UI helpers ----------
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600 dark:text-green-400"
    if (progress >= 50) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getStatusIcon = (status: string) => {
    const s = normalizeStatus(status)
    switch (s) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    const s = normalizeStatus(status)
    switch (s) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const ColoredProgress = ({ value, gradient }: { value: number; gradient: string }) => (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )

  // ---------- Grouping & Sorting ----------
  // Normalize category names to canonical labels matching the desired order
  const canonicalCategory = (raw?: string | null) => {
    const name = (raw ?? "").trim()
    if (!name || /^uncategorized$/i.test(name)) return "Additional Asset Creation"

    const lower = name.toLowerCase()
    // Web 2.0 variations
    if (/^web\s*2(\.0)?/.test(lower) || /web2/.test(lower) || /web\s*2\.0\s*platform/.test(lower)) {
      return "Web 2.0 Creation"
    }
    // Additional Asset variations
    if (/additional\s*asset/.test(lower)) return "Additional Asset Creation"
    // Graphics Design variations
    if (/graphics?\s*design/.test(lower)) return "Graphics Design"
    // Social Asset Creation variations
    if (/social\s*asset\s*creation/.test(lower)) return "Social Asset Creation"
    // Social Activity stays as-is
    if (/social\s*activity/.test(lower)) return "Social Activity"
    // Content Studio
    if (/content\s*studio/.test(lower)) return "Content Studio"
    // YouTube Video Optimization variations
    if (/youtube.*(optimization|optimi[sz]ation|seo)/.test(lower)) return "YouTube Video Optimization"
    // Backlinks
    if (/backlinks?/.test(lower)) return "Backlinks"
    // Blog Posting
    if (/blog\s*posting/.test(lower)) return "Blog Posting"

    return name
  }

  // Build groups
  const grouped: Record<string, TaskItem[]> =
    clientData.tasks?.reduce((acc, task) => {
      const key = canonicalCategory(task?.category?.name)
      if (!acc[key]) acc[key] = []
      acc[key].push(task as TaskItem)
      return acc
    }, {} as Record<string, TaskItem[]>) || {}

  // Sort tasks: Completed → In Progress → Pending → Overdue, then priority, then due date
  const STATUS_ORDER = ["completed", "in_progress", "pending", "overdue"]
  const PRIORITY_ORDER = ["high", "medium", "low"]

  const sortTasks = (tasks: TaskItem[]) =>
    [...tasks].sort((a, b) => {
      const sA = STATUS_ORDER.indexOf(normalizeStatus((a as any).status))
      const sB = STATUS_ORDER.indexOf(normalizeStatus((b as any).status))
      if (sA !== sB) return sA - sB

      const pA = PRIORITY_ORDER.indexOf((a.priority || "low") as any)
      const pB = PRIORITY_ORDER.indexOf((b.priority || "low") as any)
      if (pA !== pB) return pA - pB

      const dA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const dB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      return dA - dB
    })

  // Category flow per request; others follow alphabetically
  const CATEGORY_FLOW = [
    "Graphics Design",
    "Social Asset Creation",
    "Web 2.0 Creation",
    "Additional Asset Creation",
    "Blog Posting",
    "Social Activity",
    "Backlinks",
    "Content Studio",
    "YouTube Video Optimization",
  ]

  const orderedCategories = Object.entries(grouped).sort(([a], [b]) => {
    const ia = CATEGORY_FLOW.indexOf(a)
    const ib = CATEGORY_FLOW.indexOf(b)
    const aIn = ia !== -1
    const bIn = ib !== -1
    if (aIn && bIn) return ia - ib
    if (aIn) return -1
    if (bIn) return 1
    return a.localeCompare(b)
  })

  // Pick a pleasant header accent per category
  const headerGradient = (category: string) => {
    if (category === "Graphics Design") return "from-fuchsia-500/10 to-rose-500/10 dark:from-fuchsia-500/20 dark:to-rose-500/20"
    if (category === "Social Asset Creation") return "from-pink-500/10 to-rose-500/10 dark:from-pink-500/20 dark:to-rose-500/20"
    if (category === "Web 2.0 Creation") return "from-indigo-500/10 to-cyan-500/10 dark:from-indigo-500/20 dark:to-cyan-500/20"
    if (category === "Additional Asset" || category === "Additional Asset Creation") return "from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20"
    if (category === "Backlinks") return "from-amber-500/10 to-yellow-500/10 dark:from-amber-500/20 dark:to-yellow-500/20"
    if (category === "Blog Posting") return "from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20"
    if (category === "Social Activity") return "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20"
    if (category === "Content Studio") return "from-sky-500/10 to-blue-500/10 dark:from-sky-500/20 dark:to-blue-500/20"
    if (category === "YouTube Video Optimization") return "from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20"
    return "from-slate-500/10 to-slate-500/10 dark:from-slate-500/20 dark:to-slate-500/20"
  }

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overall Progress</p>
                <p className={`text-2xl font-bold ${getProgressColor(derivedProgress)}`}>{derivedProgress}%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {completedTasks} completed / {inProgressTasks} in progress / {pendingTasks + overdueTasks} pending
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <ColoredProgress value={derivedProgress} gradient="from-blue-500 to-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalTasks}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {completedTasks} completed, {pendingTasks + overdueTasks} pending
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Days Elapsed</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{getDaysElapsed()}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">out of {getTotalDays()} total days</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Days Remaining</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{getDaysRemaining()}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">until completion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Breakdown (color-coded) */}
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
        <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
          <CardTitle className="flex items-center">
            <BarChart3 className="text-indigo-600" />
            <span>Task Breakdown - {clientData.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">QC Approved</h4>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {qcApprovedTasks}
                </Badge>
              </div>
              <ColoredProgress
                value={completedTasks > 0 ? (qcApprovedTasks / completedTasks) * 100 : 0}
                gradient="from-green-500 to-emerald-600"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {qcApprovedTasks} of {completedTasks} tasks QC approved
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Completed</h4>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {completedTasks}
                </Badge>
              </div>
              <ColoredProgress value={totalTasks ? (completedTasks / totalTasks) * 100 : 0} gradient="from-green-500 to-emerald-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">In Progress</h4>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {inProgressTasks}
                </Badge>
              </div>
              <ColoredProgress value={totalTasks ? (inProgressTasks / totalTasks) * 100 : 0} gradient="from-blue-500 to-cyan-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {inProgressTasks} of {totalTasks} tasks in progress
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Pending</h4>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {pendingTasks + overdueTasks}
                </Badge>
              </div>
              <ColoredProgress value={totalTasks ? ((pendingTasks + overdueTasks) / totalTasks) * 100 : 0} gradient="from-amber-400 to-yellow-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {pendingTasks + overdueTasks} of {totalTasks} tasks pending
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories in an Accordion (flow enforced) */}
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
        <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            <span>Tasks by Category</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          <Accordion
            type="multiple"
            className="w-full"
            defaultValue={orderedCategories.slice(0, 2).map(([name]) => name)}
          >
            {orderedCategories.map(([categoryName, rawTasks]) => {
              const tasks = sortTasks(rawTasks)
              return (
                <AccordionItem key={categoryName} value={categoryName} className="border-slate-200 dark:border-slate-700">
                  <AccordionTrigger className={`px-4 py-3 rounded-md hover:no-underline group`}>
                    <div className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 bg-gradient-to-r ${headerGradient(categoryName)}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{categoryName}</span>
                        <Badge variant="secondary">{tasks.length}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {tasks.filter((t) => normalizeStatus((t as any).status) === "completed").length} done
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {tasks.filter((t) => normalizeStatus((t as any).status) === "in_progress").length} doing
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-1 md:px-2 pb-4">
                    <div className="space-y-4 pt-3">
                      {tasks.map((task) => {
                        const platform = task.templateSiteAsset?.name || "Platform"
                        const duration = task.idealDurationMinutes ?? 0
                        const link = (task as any).completionLink?.trim?.() || task.templateSiteAsset?.url || ""
                        return (
                          <div
                            key={task.id}
                            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200/70 dark:border-slate-700/70"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-100">{task.name}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-300">
                                  {platform} • {duration} min
                                </p>
                                {link && (
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 break-all"
                                  >
                                    <LinkIcon className="h-3.5 w-3.5" />
                                    {link}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                              <Badge className={getStatusColor((task as any).status)}>{normalizeStatus((task as any).status).replace(/_/g, " ")}</Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Package Information */}
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
        <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-violet-600" />
            <span>Current Package</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{clientData.package?.name ?? ""}</h4>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{clientData.package?.description ?? ""}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</p>
                <Badge variant={clientData.status === "active" ? "default" : "secondary"} className="mt-1">
                  {clientData.status ?? "inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Timeline</p>
                <p className="text-slate-900 dark:text-slate-100 mt-1">{getTotalDays()} days total</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tasks</p>
                <p className="text-slate-900 dark:text-slate-100 mt-1">{totalTasks} total tasks</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
