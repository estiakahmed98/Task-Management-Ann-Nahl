"use client"

import { useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ViewMode = "grid" | "list"

interface AmCeoClientOverviewHeaderProps {
  searchQuery: string
  setSearchQuery: (query: string) => void

  statusFilter: string
  setStatusFilter: (status: string) => void

  packageFilter: string
  setPackageFilter: (pkg: string) => void
  packages: { id: string; name: string }[]

  amFilter: string              // 'all' | stringified id
  setAmFilter: (amId: string) => void
  accountManagers: { id: string | number; label: string }[]

  currentUserId?: string | number
  currentUserRole?: string

  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  onAddNewClient: () => void
}

export function AmCeoClientOverviewHeader({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  packageFilter,
  setPackageFilter,
  packages,
  amFilter,
  setAmFilter,
  accountManagers,
  currentUserId,
  currentUserRole,
  viewMode,
  setViewMode,
}: AmCeoClientOverviewHeaderProps) {
  const isAM = (currentUserRole ?? "").trim().toLowerCase() === "am"
  const currentUserIdStr = currentUserId != null ? String(currentUserId) : undefined

  // AM হলে নিজেরটাই লক
  useEffect(() => {
    if (isAM && currentUserIdStr && amFilter !== currentUserIdStr) {
      setAmFilter(currentUserIdStr)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAM, currentUserIdStr])

  // 🔎 Debug helpers (চাইলে রাখুন, সমস্যা বোঝা সহজ হবে)
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[AM FILTER/HEADER] isAM:", isAM, "currentUserIdStr:", currentUserIdStr, "amFilter:", amFilter)
  }, [isAM, currentUserIdStr, amFilter])

  return (
    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
      <h1 className="text-3xl font-bold text-gray-800">ALL AM&apos;s Overview</h1>

      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search clients..."
            className="pl-9 w-[250px] border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter ?? "all"} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] border-gray-200 focus:border-cyan-500 focus:ring-cyan-500">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        {/* Account Manager filter — hidden for AM users */}
        {!isAM && (
          <Select value={amFilter ?? "all"} onValueChange={(v) => setAmFilter(v)}>
            <SelectTrigger className="w-[220px] border-gray-200 focus:border-cyan-500 focus:ring-cyan-500">
              <SelectValue placeholder="Filter by account manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Account Managers</SelectItem>
              {accountManagers.map((am) => (
                <SelectItem key={String(am.id)} value={String(am.id)}>
                  {am.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Package filter */}
        <Select value={packageFilter ?? "all"} onValueChange={setPackageFilter}>
          <SelectTrigger className="w-[180px] border-gray-200 focus:border-cyan-500 focus:ring-cyan-500">
            <SelectValue placeholder="Filter by package" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Packages</SelectItem>
            {packages.map((pkg) => (
              <SelectItem key={String(pkg.id)} value={String(pkg.id)}>
                {pkg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View mode */}
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          className="hidden md:block"
        >
          <TabsList className="h-10 bg-gray-100 rounded-lg p-1">
            <TabsTrigger
              value="grid"
              className="px-4 py-2 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
            >
              <div className="grid grid-cols-3 gap-0.5 h-4 w-4">
                {Array(9).fill(null).map((_, i) => (
                  <div key={i} className="bg-current rounded-sm" />
                ))}
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="px-4 py-2 data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
            >
              <div className="flex flex-col gap-0.5 h-4 w-4">
                {Array(3).fill(null).map((_, i) => (
                  <div key={i} className="bg-current rounded-sm h-1" />
                ))}
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
