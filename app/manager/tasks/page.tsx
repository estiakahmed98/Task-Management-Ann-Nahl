"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { format, subDays } from "date-fns"
import { toast } from "sonner"
import {
  Search,
  Users,
  List,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Flag,
  Calendar, ExternalLink 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type Task = {
  id: string
  name: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled" | "qc_approved"
  dueDate: string | null
  createdAt: string
  assignedTo?: { id: string; name?: string | null }
  client?: { id: string; name: string; packageId: string }
  category?: { id: string; name: string } | null
  completionLink?: string | null   // 👈 NEW
}

type ClientStats = {
  id: string
  name: string
  packageId: string
  totalTasks: number
  completed: number
  inProgress: number
  pending: number
  overdue: number
}

type DashboardStats = {
  totalClients: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  overdueTasks: number
}

export default function TasksPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [modalTasks, setModalTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<ClientStats[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  })
  const [loading, setLoading] = useState(true)

  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [selectedClientName, setSelectedClientName] = useState<string>("")
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [clientModalLoading, setClientModalLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))

  // ---------- helpers
  const calculateStats = (tasks: Task[]) => {
    const clientMap: Record<string, ClientStats> = {}
    const s: DashboardStats = {
      totalClients: 0,
      totalTasks: tasks.length,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
    }

    for (const t of tasks) {
      if (t.status === "completed" || t.status === "qc_approved") s.completedTasks++
      else if (t.status === "in_progress") s.inProgressTasks++
      else if (t.status === "pending") s.pendingTasks++
      else if (t.status === "overdue") s.overdueTasks++

      if (t.client) {
        const id = t.client.id
        if (!clientMap[id]) {
          clientMap[id] = {
            id,
            name: t.client.name,
            packageId: t.client.packageId,
            totalTasks: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            overdue: 0,
          }
        }
        const c = clientMap[id]
        c.totalTasks++
        if (t.status === "completed" || t.status === "qc_approved") c.completed++
        else if (t.status === "in_progress") c.inProgress++
        else if (t.status === "pending") c.pending++
        else if (t.status === "overdue") c.overdue++
      }
    }

    s.totalClients = Object.keys(clientMap).length
    setStats(s)
    setClients(Object.values(clientMap))
  }

  const fetchAllTasks = useCallback(async () => {
    try {
      setLoading(true)
      const url = `/api/tasks?${startDate ? `startDate=${startDate}&` : ""}${endDate ? `endDate=${endDate}` : ""}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch tasks")
      const data: Task[] = await res.json()
      setAllTasks(data)
      calculateStats(data)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  const fetchTasksForClient = useCallback(
    async (clientId: string) => {
      try {
        setClientModalLoading(true)
        const url = `/api/tasks?${startDate ? `startDate=${startDate}&` : ""}${endDate ? `endDate=${endDate}&` : ""}clientId=${clientId}`
        const res = await fetch(url)
        if (!res.ok) throw new Error("Failed to fetch client tasks")
        const data: Task[] = await res.json()
        setModalTasks(data)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load client tasks")
      } finally {
        setClientModalLoading(false)
      }
    },
    [startDate, endDate]
  )

  useEffect(() => {
    fetchAllTasks()
  }, [fetchAllTasks])

  // ---------- filtering for Clients list
  const filteredClients = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [clients, searchQuery]
  )

  // ---------- grouping for modal
  const STATUS_ORDER: Task["status"][] = ["qc_approved", "completed", "in_progress", "pending", "overdue", "cancelled"]

  const prettyStatus = (s: Task["status"]) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const statusBadgeClass = (status: Task["status"]) =>
    status === "completed"
      ? "bg-green-600 text-white hover:bg-green-700 transition-colors"
      : status === "qc_approved"
      ? "bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
      : status === "in_progress"
      ? "bg-sky-600 text-white hover:bg-sky-700 transition-colors"
      : status === "pending"
      ? "bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
      : status === "overdue"
      ? "bg-red-600 text-white hover:bg-red-700 transition-colors"
      : "bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"

  const normalizeCategory = (t: Task): "Social Asset" | "Web 2.0" | "Additional Asset" | "Other" => {
    const name = t.category?.name || null
    if (!name) return "Additional Asset"
    if (/^social activity$/i.test(name)) return "Social Asset"
    if (/^web 2\.0 creation$/i.test(name)) return "Web 2.0"
    return "Other"
  }

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    for (const t of modalTasks) {
      const key = normalizeCategory(t)
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    }
    // sort each category by status (Completed → In Progress → Pending → Overdue → Cancelled), then by due date asc
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        const sa = STATUS_ORDER.indexOf(a.status)
        const sb = STATUS_ORDER.indexOf(b.status)
        if (sa !== sb) return sa - sb
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY
        return da - db
      })
    }
    return groups
  }, [modalTasks])

  const orderedCategories: Array<keyof typeof groupedByCategory> = [
    "Social Asset" as any,
    "Web 2.0" as any,
    "Additional Asset" as any,
    "Other" as any,
  ]

  // ---------- UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4 md:px-6">
      {/* Header / Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg mb-8 border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Task Dashboard
          </h1>
          <div className="hidden md:flex gap-6">
            <Kpi title="Total Clients" value={stats.totalClients} icon={<Users className="h-6 w-6" />} color="text-blue-600" bg="bg-blue-50" />
            <Kpi title="Total Tasks" value={stats.totalTasks} icon={<List className="h-6 w-6" />} color="text-purple-600" bg="bg-purple-50" />
            <Kpi title="Completed" value={stats.completedTasks} icon={<CheckCircle className="h-6 w-6" />} color="text-emerald-600" bg="bg-emerald-50" />
            <Kpi title="In Progress" value={stats.inProgressTasks} icon={<ClockIcon className="h-6 w-6" />} color="text-amber-600" bg="bg-amber-50" />
            <Kpi title="Pending" value={stats.pendingTasks} icon={<AlertCircle className="h-6 w-6" />} color="text-orange-600" bg="bg-orange-50" />
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search clients…"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 items-center">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[150px]"
            />
            <span className="text-slate-500">–</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[150px]"
            />
            <Button variant="outline" onClick={fetchAllTasks}>
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Clients */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-700/60">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" /> Clients ({filteredClients.length})
        </h2>

        {filteredClients.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg font-medium mb-2">No clients found.</p>
            <p className="text-sm">Try adjusting filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={async () => {
                  setSelectedClient(client.id)
                  setSelectedClientName(client.name)
                  setClientModalOpen(true)
                  await fetchTasksForClient(client.id)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* No "All Tasks" section per your request */}

      {/* Client Tasks Modal */}
      <Dialog open={clientModalOpen} onOpenChange={(o) => { setClientModalOpen(o); if (!o) { setSelectedClient(null); setModalTasks([]) }}}>
        <DialogContent className="max-w-4xl md:max-w-5xl lg:max-w-6xl h-[85vh] overflow-y-auto p-0">
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between w-full">
                  <span className="text-xl">
                    Tasks for <span className="font-bold">{selectedClientName || "Client"}</span>
                    {modalTasks.length ? <span className="text-slate-500 font-normal"> — {modalTasks.length} total</span> : null}
                  </span>
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {clientModalLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : modalTasks.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  No tasks for this client in the selected date range.
                </div>
              ) : (
                <div className="space-y-8">
                  {orderedCategories
                    .filter((key) => groupedByCategory[key as any]?.length)
                    .map((key) => {
                      const list = groupedByCategory[key as any] || []
                      // further split by status order
                      const byStatus: Record<Task["status"], Task[]> = {
                        qc_approved: [],
                        completed: [],
                        in_progress: [],
                        pending: [],
                        overdue: [],
                        cancelled: [],
                      }
                      for (const t of list) byStatus[t.status].push(t)

                      const nonEmptyStatuses = STATUS_ORDER.filter((s) => byStatus[s].length > 0)

                      return (
                        <section key={String(key)}>
                          <header className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">
                              {String(key)} <span className="text-slate-500 font-normal">({list.length})</span>
                            </h3>
                          </header>

                          <div className="space-y-5">
                            {nonEmptyStatuses.map((s) => (
                              <div key={s}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={statusBadgeClass(s)}>{prettyStatus(s)}</Badge>
                                  <span className="text-sm text-slate-500">{byStatus[s].length}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                  {byStatus[s].map((task) => (
                                    <TaskMiniCard key={task.id} task={task} />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )
                    })}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-900">
              <Button variant="outline" onClick={() => setClientModalOpen(false)}>Close</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------- small, elegant UI bits ---------- */

function Kpi({
  title,
  value,
  icon,
  color,
  bg,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  bg: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-10 w-10 ${bg} ${color} rounded-xl grid place-items-center`}>{icon}</div>
      <div>
        <div className="text-xs text-slate-500">{title}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  )
}

function ClientCard({
  client,
  onClick,
}: {
  client: ClientStats
  onClick: () => void
}) {
  return (
    <Card
      className="cursor-pointer bg-gradient-to-br from-sky-100 to-purple-100 hover:from-sky-200 hover:to-purple-200 shadow-sm hover:shadow-md transition-all duration-200 ease-out"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">{client.name}</h3>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">Package: {client.packageId}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span>{client.completed}</span>
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4 text-amber-600" />
            <span>{client.inProgress}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span>{client.pending}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flag className="h-4 w-4 text-red-600" />
            <span>{client.overdue}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Badge variant="outline" className="text-xs">
          Total Tasks: {client.totalTasks}
        </Badge>
      </CardFooter>
    </Card>
  )
}

function TaskMiniCard({ task }: { task: Task }) {
  const href =
    task.completionLink && /^https?:\/\//i.test(task.completionLink)
      ? task.completionLink
      : undefined
  const clickable = Boolean(href)

  const handleClick = () => {
    if (href) window.open(href, "_blank", "noopener,noreferrer")
  }

  const due = task.dueDate ? (
    <span className="text-xs text-slate-500">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
  ) : (
    <span className="text-xs text-slate-400">No due date</span>
  )

  const priorityBadge =
    task.priority === "urgent" ? (
      <Badge className="bg-red-100 text-red-800">Urgent</Badge>
    ) : task.priority === "high" ? (
      <Badge className="bg-pink-100 text-pink-800">High</Badge>
    ) : task.priority === "medium" ? (
      <Badge className="bg-indigo-100 text-indigo-800">Medium</Badge>
    ) : (
      <Badge className="bg-slate-100 text-slate-800">Low</Badge>
    )

  const statusAccent =
    task.status === "completed"
      ? "border-emerald-400"
      : task.status === "in_progress"
      ? "border-sky-400"
      : task.status === "pending"
      ? "border-yellow-400"
      : task.status === "overdue"
      ? "border-red-400"
      : "border-slate-300"

  return (
    <Card
      onClick={handleClick}
      role={clickable ? "button" : undefined}
      aria-label={clickable ? `Open ${task.name}` : undefined}
      className={`relative border border-slate-200/70 dark:border-slate-700/70 shadow-sm transition-all 
        ${clickable ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5" : ""} 
        pl-3 border-l-4 ${statusAccent}`}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
        {/* Header text ONLY, in capitals */}
        <h4 className="font-semibold leading-snug pr-8 uppercase tracking-wide">
          {task.name}
        </h4>
        {priorityBadge}
      </CardHeader>

      <CardContent className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          {due}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Users className="h-4 w-4 text-slate-400" />
          <span>{task.assignedTo?.name || "Unassigned"}</span>
        </div>

        {/* Raw ("nude") completion link below */}
        {href && (
          <div className="mt-2">
            <span className="text-xs font-bold">Link: </span>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 break-all hover:underline"
              onClick={(e) => e.stopPropagation()}
              title="Open completion link"
            >
              {href}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


