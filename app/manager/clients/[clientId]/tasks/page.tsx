"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Search,
  Plus,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Type Definitions
type TaskStatus = "pending" | "inProgress" | "completed" | "unassigned"
type TaskCategory = "social" | "content" | "design"
type TaskPriority = "high" | "medium" | "low"

type Task = {
  id: string
  name: string
  category: TaskCategory
  priority: TaskPriority
  dueDate: string
  assignedTo: {
    id: string
    name: string
    avatar: string
    role: string
  } | null
  status: TaskStatus // Added status field
  comments: {
    id: string
    text: string
    author: string
    date: string
    avatar: string
  }[]
  reports: {
    id: string
    text: string
    author: string
    date: string
    avatar: string
    severity: "high" | "medium" | "low"
  }[]
}

type TeamMember = {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  team: string
  assignedDate: string
  assignedTasks: number
  completedTasks: number
  lateTasks: number
}

type ClientTasks = {
  pending: Task[]
  inProgress: Task[]
  completed: Task[]
  unassigned: Task[]
}

// Updated ClientData type to reflect nested tasks
type ClientData = {
  id: string // Renamed from clientId for consistency with backend Client type
  name: string // Renamed from clientName
  company: string // Renamed from companyName
  designation: string
  package: string // Renamed from packageName
  startDate: string
  dueDate: string
  isOverdue: boolean
  progress: number
  tasks: ClientTasks // Now directly nested
  teamMembers: TeamMember[]
}

export default function TasksPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string // Ensure clientId is string

  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeTeamTab, setActiveTeamTab] = useState("all")
  const [agentSearchQuery, setAgentSearchQuery] = useState("")
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>("social")
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false)
  const [loading, setLoading] = useState(true) // New loading state
  const [error, setError] = useState<string | null>(null) // New error state

  // tasks state is now derived from clientData.tasks
  const tasks = clientData?.tasks || {
    pending: [],
    inProgress: [],
    completed: [],
    unassigned: [],
  }

  const fetchData = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tasks/${clientId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: ClientData = await response.json()
      setClientData(data)
    } catch (e: any) {
      console.error("Failed to fetch client data:", e)
      setError("Failed to load client data. Please try again.")
      toast.error("Failed to load client data.")
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateTasksOnServer = useCallback(
    async (updatedTasks: ClientTasks) => {
      try {
        const response = await fetch(`/api/tasks/${clientId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTasks),
        })
        if (!response.ok) {
          throw new Error(`Failed to update tasks on server: ${response.statusText}`)
        }
        // Removed fetchData() from here to prevent full page refresh on success
      } catch (e: any) {
        console.error("Failed to update tasks:", e)
        toast.error("Failed to save changes. Please try again.")
        // Revert local state if server update fails (optional, but good for UX)
        fetchData() // Re-fetch to revert to server's state
      }
    },
    [clientId, fetchData],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-lg text-gray-600">Loading client data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-lg text-red-600">{error}</p>
        <Button onClick={fetchData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  if (!clientData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-lg text-gray-600">No client data available.</p>
      </div>
    )
  }

  const handleAssignTask = (task: Task) => {
    setSelectedTask(task)
    setIsAssignModalOpen(true)
  }

  const handleViewComments = (task: Task) => {
    setSelectedTask(task)
    setIsCommentModalOpen(true)
  }

  const handleViewReports = (task: Task) => {
    setSelectedTask(task)
    setIsReportModalOpen(true)
  }

  const handleGoBack = () => {
    router.push("/admin/clients") // Assuming this is the correct path
  }

  const filteredTeamMembers =
    activeTeamTab === "all"
      ? clientData.teamMembers
      : clientData.teamMembers.filter((member: TeamMember) => member.team === activeTeamTab)

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.id)
    e.dataTransfer.setData("taskStatus", task.status)
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")
    const sourceStatus = e.dataTransfer.getData("taskStatus") as TaskStatus

    if (!taskId || !sourceStatus || sourceStatus === targetStatus) return

    const sourceList = tasks[sourceStatus]
    const taskIndex = sourceList.findIndex((t) => t.id === taskId)

    if (taskIndex === -1) return

    const taskToMove = { ...sourceList[taskIndex], status: targetStatus }

    const newTasks: ClientTasks = { ...tasks }
    newTasks[sourceStatus] = newTasks[sourceStatus].filter((t) => t.id !== taskId)
    newTasks[targetStatus] = [...newTasks[targetStatus], taskToMove]

    // Update local state immediately for responsiveness
    setClientData((prev) => (prev ? { ...prev, tasks: newTasks } : null))
    toast.info(`Task "${taskToMove.name}" moved to ${targetStatus.replace(/([A-Z])/g, " $1").toLowerCase()}`)
    setDraggedTask(null)

    // Send update to server
    await updateTasksOnServer(newTasks)
  }

  const assignTaskToMember = async (taskId: string, member: TeamMember) => {
    const newTasks: ClientTasks = { ...tasks }
    let taskToAssign: Task | undefined
    let sourceStatus: TaskStatus | undefined

    // Find the task and its current status in the most up-to-date state
    for (const statusKey in newTasks) {
      const listKey = statusKey as TaskStatus
      const foundTask = newTasks[listKey].find((t) => t.id === taskId)
      if (foundTask) {
        taskToAssign = { ...foundTask } // Make a copy to modify
        sourceStatus = listKey
        // Remove from current list
        newTasks[listKey] = newTasks[listKey].filter((t) => t.id !== taskId)
        break
      }
    }

    if (!taskToAssign || !sourceStatus) {
      console.error("Task not found for assignment:", taskId)
      return
    }

    // Update assignedTo
    taskToAssign.assignedTo = {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      role: member.role,
    }

    // Determine target status: if unassigned, move to pending; otherwise, keep original status
    if (sourceStatus === "unassigned") {
      taskToAssign.status = "pending"
      newTasks.pending.push(taskToAssign)
    } else {
      taskToAssign.status = sourceStatus // Keep original status if not unassigned
      newTasks[sourceStatus].push(taskToAssign)
    }

    // Update local state immediately
    setClientData((prev) => (prev ? { ...prev, tasks: newTasks } : null))
    toast.info(`Task assigned to ${member.name}`)
    setIsAssignModalOpen(false)

    // Send update to server
    await updateTasksOnServer(newTasks)
  }

  const handleCreateNewTask = async () => {
    if (!newTaskName || !newTaskDueDate) {
      toast.error("Please fill in all required fields.")
      return
    }

    const newId = `task-${Date.now()}`
    const taskToAdd: Task = {
      id: newId,
      name: newTaskName,
      category: newTaskCategory,
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      assignedTo: null,
      status: "unassigned",
      comments: [],
      reports: [],
    }

    try {
      const response = await fetch(`/api/tasks/${clientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskToAdd),
      })

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`)
      }

      const createdTask: Task = await response.json()

      // Update local state immediately
      setClientData((prev) => {
        if (!prev) return null
        const updatedTasks = {
          ...prev.tasks,
          unassigned: [...prev.tasks.unassigned, createdTask],
        }
        return { ...prev, tasks: updatedTasks }
      })

      toast.success(`Task "${createdTask.name}" created and added to Unassigned.`)
      setIsNewTaskModalOpen(false)
      setNewTaskName("")
      setNewTaskCategory("social")
      setNewTaskPriority("medium")
      setNewTaskDueDate("")
    } catch (e: any) {
      console.error("Error creating new task:", e)
      toast.error("Failed to create new task. Please try again.")
    }
  }

  const handleMarkAsCompleted = async (taskId: string) => {
    const newTasks: ClientTasks = { ...tasks }
    let taskToComplete: Task | undefined
    let sourceStatus: TaskStatus | undefined

    // Find the task and its current status in the most up-to-date state
    for (const statusKey in newTasks) {
      const listKey = statusKey as TaskStatus
      const foundTask = newTasks[listKey].find((t) => t.id === taskId)
      if (foundTask) {
        taskToComplete = { ...foundTask } // Make a copy to modify
        sourceStatus = listKey
        // Remove from current list
        newTasks[listKey] = newTasks[listKey].filter((t) => t.id !== taskId)
        break
      }
    }

    if (!taskToComplete || !sourceStatus) {
      console.error("Task not found for completion:", taskId)
      return
    }

    taskToComplete.status = "completed" as const

    newTasks.completed.push(taskToComplete) // Add to completed

    // Update local state immediately
    setClientData((prev) => (prev ? { ...prev, tasks: newTasks } : null))
    toast.success(`Task "${taskToComplete.name}" marked as completed!`)

    // Send update to server
    await updateTasksOnServer(newTasks)
  }

  const handleChangeStatus = async (taskId: string, newStatus: TaskStatus) => {
    const newTasks: ClientTasks = { ...tasks }
    let taskToChange: Task | undefined
    let sourceStatus: TaskStatus | undefined

    // Find the task and its current status in the most up-to-date state
    for (const statusKey in newTasks) {
      const listKey = statusKey as TaskStatus
      const foundTask = newTasks[listKey].find((t) => t.id === taskId)
      if (foundTask) {
        taskToChange = { ...foundTask } // Make a copy to modify
        sourceStatus = listKey
        // Remove from current list
        newTasks[listKey] = newTasks[listKey].filter((t) => t.id !== taskId)
        break
      }
    }

    if (!taskToChange || !sourceStatus) {
      console.error("Task not found for status change:", taskId)
      return
    }

    taskToChange.status = newStatus

    newTasks[newStatus].push(taskToChange) // Add to new status list

    // Update local state immediately
    setClientData((prev) => (prev ? { ...prev, tasks: newTasks } : null))
    toast.info(`Task "${taskToChange.name}" status changed to ${newStatus.replace(/([A-Z])/g, " $1").toLowerCase()}.`)
    setIsChangeStatusModalOpen(false)
    setSelectedTask(null)

    // Send update to server
    await updateTasksOnServer(newTasks)
  }

  // Apply filters to each category
  const applyFilters = (taskList: Task[]) => {
    return taskList.filter((task) => {
      // Filter by category
      if (categoryFilter !== "all" && task.category !== categoryFilter) {
        return false
      }
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return task.name.toLowerCase().includes(query)
      }
      return true
    })
  }

  const filteredTasks = {
    pending: applyFilters(tasks.pending),
    inProgress: applyFilters(tasks.inProgress),
    completed: applyFilters(tasks.completed),
    unassigned: applyFilters(tasks.unassigned),
  }

  // Only show the lists that match the status filter
  const visibleTasks = {
    pending: statusFilter === "all" || statusFilter === "pending" ? filteredTasks.pending : [],
    inProgress: statusFilter === "all" || statusFilter === "inProgress" ? filteredTasks.inProgress : [],
    completed: statusFilter === "all" || statusFilter === "completed" ? filteredTasks.completed : [],
    unassigned: statusFilter === "all" || statusFilter === "unassigned" ? filteredTasks.unassigned : [],
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 bg-gray-50 min-h-screen">
      <Card className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
          <div>
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-3 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">{clientData.name}</h1>
            <p className="text-gray-500 text-lg mt-1">
              {clientData.company} • {clientData.designation}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1 text-sm font-medium"
                >
                  {clientData.package}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Start Date: {clientData.startDate}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Due Date: {clientData.dueDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn("h-4 w-4", clientData.isOverdue ? "text-red-500" : "text-gray-500")} />
                <span className={cn("font-medium", clientData.isOverdue ? "text-red-500" : "text-gray-600")}>
                  {clientData.isOverdue ? "Overdue by 3 days" : "On Schedule"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search tasks..."
                className="pl-9 w-[250px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] border-gray-300">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] border-gray-300">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="design">Design</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-[#00b894] hover:bg-[#00a382] text-white px-5 py-2 rounded-md shadow-sm transition-colors"
              onClick={() => setIsNewTaskModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-600 mt-4 border-t pt-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span>Pending: {tasks.pending.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span>In Progress: {tasks.inProgress.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span>Completed: {tasks.completed.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span>Unassigned: {tasks.unassigned.length}</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Progress
                value={clientData.progress}
                className="h-2 w-[120px] bg-gray-200 [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-green-400 [&::-webkit-progress-value]:to-emerald-500"
              />
              <span className="font-semibold text-gray-700">{clientData.progress}% Complete</span>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
        {/* Unassigned Column */}
        <div
          className="flex flex-col h-full rounded-xl shadow-md overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "unassigned")}
        >
          <div className="bg-red-100 border-b-2 border-red-300 rounded-t-xl p-4 flex justify-between items-center">
            <h3 className="font-bold text-red-800 text-lg">Unassigned</h3>
            <Badge variant="outline" className="bg-red-200 text-red-900 px-3 py-1 text-sm font-semibold">
              {visibleTasks.unassigned.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto bg-red-50 p-4 space-y-4">
            {visibleTasks.unassigned.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No unassigned tasks found</p>
              </div>
            ) : (
              visibleTasks.unassigned.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAssign={() => handleAssignTask(task)}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onViewComments={() => handleViewComments(task)}
                  onViewReports={() => handleViewReports(task)}
                  onMarkAsCompleted={() => handleMarkAsCompleted(task.id)}
                  onChangeStatus={(newStatus) => {
                    setSelectedTask(task)
                    setIsChangeStatusModalOpen(true)
                  }}
                />
              ))
            )}
          </div>
        </div>
        {/* Pending Column */}
        <div
          className="flex flex-col h-full rounded-xl shadow-md overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "pending")}
        >
          <div className="bg-amber-100 border-b-2 border-amber-300 rounded-t-xl p-4 flex justify-between items-center">
            <h3 className="font-bold text-amber-800 text-lg">Pending</h3>
            <Badge variant="outline" className="bg-amber-200 text-amber-900 px-3 py-1 text-sm font-semibold">
              {visibleTasks.pending.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto bg-amber-50 p-4 space-y-4">
            {visibleTasks.pending.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No pending tasks found</p>
              </div>
            ) : (
              visibleTasks.pending.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAssign={() => handleAssignTask(task)}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onViewComments={() => handleViewComments(task)}
                  onViewReports={() => handleViewReports(task)}
                  onMarkAsCompleted={() => handleMarkAsCompleted(task.id)}
                  onChangeStatus={(newStatus) => {
                    setSelectedTask(task)
                    setIsChangeStatusModalOpen(true)
                  }}
                />
              ))
            )}
          </div>
        </div>
        {/* In Progress Column */}
        <div
          className="flex flex-col h-full rounded-xl shadow-md overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "inProgress")}
        >
          <div className="bg-blue-100 border-b-2 border-blue-300 rounded-t-xl p-4 flex justify-between items-center">
            <h3 className="font-bold text-blue-800 text-lg">In Progress</h3>
            <Badge variant="outline" className="bg-blue-200 text-blue-900 px-3 py-1 text-sm font-semibold">
              {visibleTasks.inProgress.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto bg-blue-50 p-4 space-y-4">
            {visibleTasks.inProgress.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No in-progress tasks found</p>
              </div>
            ) : (
              visibleTasks.inProgress.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAssign={() => handleAssignTask(task)}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onViewComments={() => handleViewComments(task)}
                  onViewReports={() => handleViewReports(task)}
                  onMarkAsCompleted={() => handleMarkAsCompleted(task.id)}
                  onChangeStatus={(newStatus) => {
                    setSelectedTask(task)
                    setIsChangeStatusModalOpen(true)
                  }}
                />
              ))
            )}
          </div>
        </div>
        {/* Completed Column */}
        <div
          className="flex flex-col h-full rounded-xl shadow-md overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, "completed")}
        >
          <div className="bg-emerald-100 border-b-2 border-emerald-300 rounded-t-xl p-4 flex justify-between items-center">
            <h3 className="font-bold text-emerald-800 text-lg">Completed</h3>
            <Badge variant="outline" className="bg-emerald-200 text-emerald-900 px-3 py-1 text-sm font-semibold">
              {visibleTasks.completed.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto bg-emerald-50 p-4 space-y-4">
            {visibleTasks.completed.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No completed tasks found</p>
              </div>
            ) : (
              visibleTasks.completed.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAssign={() => handleAssignTask(task)}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onViewComments={() => handleViewComments(task)}
                  onViewReports={() => handleViewReports(task)}
                  onMarkAsCompleted={() => handleMarkAsCompleted(task.id)}
                  onChangeStatus={(newStatus) => {
                    setSelectedTask(task)
                    setIsChangeStatusModalOpen(true)
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
      {/* Assign Task Modal */}
      {selectedTask && (
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogContent className="max-w-[800px] max-h-[90vh] w-[95vw] flex flex-col">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl font-bold">Assign Task</DialogTitle>
              <DialogDescription className="text-gray-600">
                Assign &quot;{selectedTask.name}&quot; to a team member.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 flex-1 overflow-y-auto">
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Task Details</h3>
                  <Badge
                    className={cn(
                      "px-3 py-1 text-xs font-semibold",
                      selectedTask.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : selectedTask.priority === "medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800",
                    )}
                  >
                    {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)} Priority
                  </Badge>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-semibold text-lg text-gray-800">{selectedTask.name}</div>
                    <Badge
                      className={cn(
                        "px-3 py-1 text-xs font-semibold",
                        selectedTask.category === "social"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedTask.category === "content"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800",
                      )}
                    >
                      {selectedTask.category.charAt(0).toUpperCase() + selectedTask.category.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {selectedTask.assignedTo
                          ? `Currently assigned to: ${selectedTask.assignedTo.name}`
                          : "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search team members..."
                    className="pl-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={agentSearchQuery}
                    onChange={(e) => setAgentSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Tabs value={activeTeamTab} onValueChange={setActiveTeamTab}>
                <TabsList className="mb-5 w-full justify-start overflow-x-auto bg-gray-100 rounded-lg p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    All Teams
                  </TabsTrigger>
                  <TabsTrigger value="social" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Social
                  </TabsTrigger>
                  <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="assets" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Assets
                  </TabsTrigger>
                  <TabsTrigger
                    value="management"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Management
                  </TabsTrigger>
                </TabsList>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2">
                  {filteredTeamMembers
                    .filter(
                      (member: TeamMember) =>
                        member.name.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
                        member.email.toLowerCase().includes(agentSearchQuery.toLowerCase()),
                    )
                    .map((member: TeamMember) => (
                      <div
                        key={member.id}
                        className={cn(
                          "flex flex-col p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
                          selectedTask.assignedTo?.id === member.id
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200",
                        )}
                        onClick={() => assignTaskToMember(selectedTask.id, member)}
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-gray-200">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-semibold text-lg truncate text-gray-800">{member.name}</div>
                            <div className="text-sm text-gray-500 truncate">{member.email}</div>
                            <div className="text-xs text-gray-500 mt-1">{member.role}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-800 border-blue-200 px-2 py-0.5 text-xs font-medium"
                          >
                            {member.assignedTasks} Tasks
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-800 border-emerald-200 px-2 py-0.5 text-xs font-medium"
                          >
                            {member.completedTasks} Completed
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#00b894] hover:bg-[#00a382] text-white w-full mt-auto rounded-md shadow-sm"
                          onClick={() => assignTaskToMember(selectedTask.id, member)}
                        >
                          Assign to {member.name.split(" ")[0]}
                        </Button>
                      </div>
                    ))}
                </div>
              </Tabs>
            </div>
            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 rounded-md">
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* New Task Modal */}
      <Dialog open={isNewTaskModalOpen} onOpenChange={setIsNewTaskModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-bold">Create New Task</DialogTitle>
            <DialogDescription className="text-gray-600">Enter the details for your new task.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium text-gray-700">
                Task Name
              </label>
              <Input
                id="name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="col-span-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Prepare Q2 Report"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right text-sm font-medium text-gray-700">
                Category
              </label>
              <Select value={newTaskCategory} onValueChange={(value: TaskCategory) => setNewTaskCategory(value)}>
                <SelectTrigger className="col-span-3 border-gray-300">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="priority" className="text-right text-sm font-medium text-gray-700">
                Priority
              </label>
              <Select value={newTaskPriority} onValueChange={(value: TaskPriority) => setNewTaskPriority(value)}>
                <SelectTrigger className="col-span-3 border-gray-300">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="dueDate" className="text-right text-sm font-medium text-gray-700">
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="col-span-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsNewTaskModalOpen(false)} className="px-4 py-2 rounded-md">
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewTask}
              className="bg-[#00b894] hover:bg-[#00a382] text-white px-4 py-2 rounded-md shadow-sm"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Change Status Modal */}
      {selectedTask && (
        <Dialog open={isChangeStatusModalOpen} onOpenChange={setIsChangeStatusModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl font-bold">Change Task Status</DialogTitle>
              <DialogDescription className="text-gray-600">
                Change the status for &quot;{selectedTask.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="status" className="text-right text-sm font-medium text-gray-700">
                  New Status
                </label>
                <Select
                  value={selectedTask.status}
                  onValueChange={(value: TaskStatus) => handleChangeStatus(selectedTask.id, value)}
                >
                  <SelectTrigger className="col-span-2 border-gray-300">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned" disabled={selectedTask.assignedTo !== null}>
                      Unassigned
                    </SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inProgress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsChangeStatusModalOpen(false)}
                className="px-4 py-2 rounded-md"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Comments Modal */}
      {selectedTask && (
        <Dialog open={isCommentModalOpen} onOpenChange={setIsCommentModalOpen}>
          <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl font-bold">Comments</DialogTitle>
              <DialogDescription className="text-gray-600">
                Comments for &quot;{selectedTask.name}&quot;
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 flex-1 overflow-y-auto">
              {selectedTask.comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No comments yet</div>
              ) : (
                <div className="space-y-4">
                  {selectedTask.comments.map((comment) => (
                    <div key={comment.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-9 w-9 border border-gray-200">
                          <AvatarImage src={comment.avatar || "/placeholder.svg"} alt={comment.author} />
                          <AvatarFallback>{comment.author.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-sm text-gray-800">{comment.author}</div>
                          <div className="text-xs text-gray-500">{new Date(comment.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setIsCommentModalOpen(false)} className="px-4 py-2 rounded-md">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Reports Modal */}
      {selectedTask && (
        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
          <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl font-bold text-red-700">Issues Reported</DialogTitle>
              <DialogDescription className="text-gray-600">
                Issues for &quot;{selectedTask.name}&quot;
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 flex-1 overflow-y-auto">
              {selectedTask.reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No issues reported</div>
              ) : (
                <div className="space-y-4">
                  {selectedTask.reports.map((report) => (
                    <div key={report.id} className="p-4 border border-red-200 rounded-lg bg-red-50 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-9 w-9 border border-red-200">
                          <AvatarImage src={report.avatar || "/placeholder.svg"} alt={report.author} />
                          <AvatarFallback>{report.author.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-800">{report.author}</div>
                          <div className="text-xs text-gray-500">{new Date(report.date).toLocaleDateString()}</div>
                        </div>
                        <Badge
                          className={cn(
                            "px-3 py-1 text-xs font-semibold",
                            report.severity === "high"
                              ? "bg-red-100 text-red-800"
                              : report.severity === "medium"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800",
                          )}
                        >
                          {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{report.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 rounded-md">
                Close
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm">
                Resolve All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function TaskCard({
  task,
  onAssign,
  onDragStart,
  onViewComments,
  onViewReports,
  onMarkAsCompleted,
  onChangeStatus,
}: {
  task: Task
  onAssign: () => void
  onDragStart: (e: React.DragEvent) => void
  onViewComments: () => void
  onViewReports: () => void
  onMarkAsCompleted: (taskId: string) => void // Updated prop type
  onChangeStatus: (newStatus: TaskStatus) => void
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200",
        "cursor-grab",
      )}
      draggable={true}
      onDragStart={onDragStart}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-base text-gray-800">{task.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                className={cn(
                  "px-2 py-0.5 text-xs font-medium",
                  task.category === "social"
                    ? "bg-emerald-100 text-emerald-800"
                    : task.category === "content"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800",
                )}
              >
                {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
              </Badge>
              <Badge
                className={cn(
                  "px-2 py-0.5 text-xs font-medium",
                  task.priority === "high"
                    ? "bg-red-100 text-red-800"
                    : task.priority === "medium"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-800",
                )}
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onAssign}>
                <Users className="h-4 w-4 mr-2 text-gray-600" />
                {task.assignedTo ? "Reassign Task" : "Assign Task"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMarkAsCompleted(task.id)} disabled={task.status === "completed"}>
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChangeStatus(task.status)}>
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                Change Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
          {task.assignedTo ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 border border-gray-200">
                <AvatarImage src={task.assignedTo.avatar || "/placeholder.svg"} alt={task.assignedTo.name} />
                <AvatarFallback>{task.assignedTo.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <span className="text-gray-600 font-medium hidden sm:block">{task.assignedTo.name.split(" ")[0]}</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-3 py-1 rounded-md border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent"
              onClick={onAssign}
            >
              Assign
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          {task.comments.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-transparent text-xs font-medium"
              onClick={onViewComments}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              <span>{task.comments.length} Comments</span>
            </Button>
          )}
          {task.reports.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 p-0 text-red-600 hover:text-red-800 hover:bg-transparent text-xs font-medium"
              onClick={onViewReports}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              <span>{task.reports.length} Issues</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
