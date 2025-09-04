// components/clients/clientsID/client-dashboard.tsx
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building } from "lucide-react"
import { Profile } from "./profile"
import { Bio } from "./bio"
import { DriveImage } from "./drive-image"
import { SocialProfile } from "./social-profile"
import { Tasks } from "./task"
import { Client } from "@/types/client"

interface ClientDashboardProps {
  clientData: Client
}

export function ClientDashboard({ clientData }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState("profile")

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getDaysRemaining = () => {
    if (!clientData.dueDate) return 0
    const dueDate = new Date(clientData.dueDate)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getTotalDays = () => {
    if (!clientData.startDate || !clientData.dueDate) return 0
    const startDate = new Date(clientData.startDate)
    const dueDate = new Date(clientData.dueDate)
    const diffTime = dueDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Derived progress from tasks with normalized statuses (overall)
  const normalizeStatus = (raw?: string | null) => {
    const s = (raw ?? "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\-\s]+/g, "_")
    if (["done", "complete", "completed", "finished", "qc_approved", "approved"].includes(s)) return "completed"
    if (["in_progress", "in-progress", "progress", "doing", "working"].includes(s)) return "in_progress"
    if (["overdue", "late"].includes(s)) return "overdue"
    if (["pending", "todo", "not_started", "on_hold", "paused", "backlog"].includes(s)) return "pending"
    return s || "pending"
  }

  const totalTasks = clientData.tasks?.length || 0
  const completedTasks =
    clientData.tasks?.filter((t: any) => normalizeStatus(t?.status) === "completed").length || 0

  const derivedProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  // ---------------------------
  // This Month stats
  // ---------------------------
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1) // exclusive

  const parseDate = (v?: string | Date | null) => {
    if (!v) return null
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }

  // Prefer createdAt; fallback to startDate; then dueDate
  const getBestDate = (task: any): Date | null => {
    return parseDate(task?.createdAt) || parseDate(task?.startDate) || parseDate(task?.dueDate)
  }

  const inThisMonth = (task: any) => {
    const d = getBestDate(task)
    if (!d) return false
    return d >= monthStart && d < monthEnd
  }

  // Monthly filtered tasks
  const tasksThisMonth = (clientData.tasks ?? []).filter(inThisMonth)
  const totalThisMonth = tasksThisMonth.length

  // helper to keep raw (non-normalized) for approved detection
  const rawStatus = (raw?: string | null) =>
    (raw ?? "").toString().trim().toLowerCase().replace(/[\-\s]+/g, "_")

  // Monthly tallies
  let completedThisMonth = 0
  let approvedThisMonth = 0
  let pendingThisMonth = 0

  for (const t of tasksThisMonth) {
    const sRaw = rawStatus(t?.status)
    const sNorm = normalizeStatus(t?.status)
    const completedAt = parseDate(t?.completedAt)
    const dueDate = parseDate(t?.dueDate)

    // Completed if completedAt is in this month OR status says completed
    const isCompleted =
      (completedAt ? completedAt >= monthStart && completedAt < monthEnd : false) ||
      sNorm === "completed"

    // Approved if status explicitly qc_approved/approved
    const isApproved = sRaw === "qc_approved" || sRaw === "approved"

    // Pending if explicitly pending OR not completed/approved but tied to this month (due this month or no explicit dates)
    const isPending =
      sNorm === "pending" ||
      (!isCompleted && !isApproved && (!!dueDate ? dueDate >= monthStart && dueDate < monthEnd : true))

    if (isCompleted) completedThisMonth++
    if (isApproved) approvedThisMonth++
    if (isPending) pendingThisMonth++
  }

  // This month progress = (completed + approved) / totalThisMonth
  const derivedProgressThisMonth = totalThisMonth
    ? Math.round(((completedThisMonth + approvedThisMonth) / totalThisMonth) * 100)
    : 0

  // Clamp values for display
  const displayOverall = Math.min(100, Math.max(0, derivedProgress))
  const displayThisMonth = Math.min(100, Math.max(0, derivedProgressThisMonth))

  const totalAssets = totalTasks

  return (
    <div>
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 ring-4 ring-blue-100 dark:ring-blue-900">
                <AvatarImage src={clientData.avatar || undefined} alt={clientData.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                  {getInitials(clientData.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{clientData.name}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center text-slate-600 dark:text-slate-400">
                    <Building className="h-4 w-4 mr-1" />
                    <span className="text-sm">{clientData.company ?? ""}</span>
                  </div>
                  <div className="flex items-center text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{clientData.location ?? ""}</span>
                  </div>
                  <Badge variant={clientData.status === "active" ? "default" : "secondary"}>
                    {clientData.status ?? "inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Statistics (Overall) */}
            <div className="flex space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{displayOverall}%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400"> Overall Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{displayThisMonth}%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">This Month Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalAssets}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{getDaysRemaining()}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Days Left</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{getTotalDays()}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Days</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Profile
            </TabsTrigger>
            <TabsTrigger value="bio" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Bio
            </TabsTrigger>
            <TabsTrigger value="drive-image" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Drive Image
            </TabsTrigger>
            <TabsTrigger
              value="social-profile"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Social Profile
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Profile clientData={clientData} />
          </TabsContent>

          <TabsContent value="bio">
            <Bio clientData={clientData} />
          </TabsContent>

          <TabsContent value="drive-image">
            <DriveImage clientData={clientData} />
          </TabsContent>

          <TabsContent value="social-profile">
            <SocialProfile clientData={clientData} />
          </TabsContent>

          <TabsContent value="tasks">
            <Tasks clientData={clientData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
