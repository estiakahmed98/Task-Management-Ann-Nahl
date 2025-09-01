////components/clients/clientsID/social-profile.tsx
"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Globe, Share2, Plus, ExternalLink, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Client } from "@/types/client"

interface SocialProfileProps {
  clientData: Client
}

export function SocialProfile({ clientData }: SocialProfileProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  /** Extend task type locally to include credential fields coming from the API */
  type BaseTask = NonNullable<Client["tasks"]>[number]
  type TaskItem = BaseTask & {
    completionLink?: string | null
    username?: string | null
    email?: string | null
    password?: string | null
  }

  const tasks: TaskItem[] = (clientData.tasks ?? []) as TaskItem[]
  const socialSites: TaskItem[] = tasks.filter((t) => t.templateSiteAsset?.type === "social_site")
  const web2Sites: TaskItem[] = tasks.filter((t) => t.templateSiteAsset?.type === "web2_site")
  const otherAssets: TaskItem[] = tasks.filter((t) => t.templateSiteAsset?.type === "other_asset")

  const mask = (value?: string | null, visible?: boolean) => {
    if (!value) return "—"
    const plain = value.trim()
    // Show "Gmail Login" or any non-secret note as-is
    if (/gmail\s*login/i.test(plain)) return plain
    if (visible) return plain
    return "•".repeat(Math.min(plain.length, 10))
  }

  const linkFor = (task: TaskItem) => {
    return (task.completionLink && task.completionLink.trim()) ||
      (task.templateSiteAsset?.url && task.templateSiteAsset.url.trim()) ||
      ""
  }

  // Order: qc approved -> completed -> in_progress -> others
  const statusRank: Record<string, number> = {
    "qc_approved": 0,
    completed: 1,
    in_progress: 2,
    pending: 3,
    cancelled: 4,
    overdue: 5,
  }
  const compareByStatus = (a: TaskItem, b: TaskItem) => {
    const ra = statusRank[(a.status ?? "").toLowerCase()] ?? 99
    const rb = statusRank[(b.status ?? "").toLowerCase()] ?? 99
    if (ra !== rb) return ra - rb
    // tie-breaker by platform/name for stable-ish order
    const an = (a.templateSiteAsset?.name ?? a.name ?? "").toLowerCase()
    const bn = (b.templateSiteAsset?.name ?? b.name ?? "").toLowerCase()
    return an.localeCompare(bn)
  }

  const statusBadgeClass = (status?: string) => {
    switch (status) {
      case "qc_approved":
        return "bg-emerald-400 text-white font-bold  dark:bg-emerald-900 dark:text-emerald-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
    }
  }

  const renderTableSection = (
    title: string,
    tasks: TaskItem[],
    icon: React.ReactNode,
    headerGradient: string
  ) => {
    return (
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-800">
        <CardHeader className={`bg-gradient-to-r ${headerGradient}`}>
          <CardTitle className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
            <Badge variant="secondary">{tasks.length}</Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No {title.toLowerCase()} found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-violet-50 dark:bg-violet-900/20 text-left text-slate-700 dark:text-slate-200">
                    <th className="px-4 py-3 font-semibold">LINK</th>
                    <th className="px-4 py-3 font-semibold">USERNAME</th>
                    <th className="px-4 py-3 font-semibold">EMAIL</th>
                    <th className="px-4 py-3 font-semibold">PASSWORD</th>
                    <th className="px-4 py-3 font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {[...tasks].sort(compareByStatus).map((task) => {
                    const link = linkFor(task)
                    const show = !!showPasswords[task.id]
                    const isRevealable = !!task.password && !/gmail\s*login/i.test(task.password)

                    return (
                      <tr
                        key={task.id}
                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      >
                        <td className="px-4 py-3">
                          {link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all inline-flex items-center gap-1"
                            >
                              {link}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">{task.username ?? "—"}</td>
                        <td className="px-4 py-3 font-mono">{task.email ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{mask(task.password, show)}</span>
                            {isRevealable && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => togglePasswordVisibility(task.id)}
                                title={show ? "Hide password" : "Show password"}
                              >
                                {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusBadgeClass(task.status)}>{task.status?.replace(/_/g, " ")}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {renderTableSection(
        "Social Assets",
        socialSites,
        <Share2 className="h-5 w-5 text-blue-600" />,
        "from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20"
      )}

      {renderTableSection(
        "Web 2.0 Assets",
        web2Sites,
        <Globe className="h-5 w-5 text-green-600" />,
        "from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20"
      )}

      {renderTableSection(
        "Additional Supporting Assets",
        otherAssets,
        <Plus className="h-5 w-5 text-purple-600" />,
        "from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20"
      )}
    </div>
  )
}
