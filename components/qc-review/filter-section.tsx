"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, User, Building2, FileText, Calendar, RotateCcw, Search } from "lucide-react"

interface FilterSectionProps {
  agentId: string
  setAgentId: (value: string) => void
  clientId: string
  setClientId: (value: string) => void
  categoryId: string
  setCategoryId: (value: string) => void
  startDate: string
  setStartDate: (value: string) => void
  endDate: string
  setEndDate: (value: string) => void
  q: string
  setQ: (value: string) => void
  agents: Array<{ id: string; name: string | null; firstName?: string; lastName?: string; email: string }>
  clients: Array<{ id: string; name: string; company?: string }>
  categories: Array<{ id: string; name: string }>
  filtered: any[]
  tasks: any[]
  clearFilters: () => void
}

export function FilterSection({
  agentId,
  setAgentId,
  clientId,
  setClientId,
  categoryId,
  setCategoryId,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  q,
  setQ,
  agents,
  clients,
  categories,
  filtered,
  tasks,
  clearFilters,
}: FilterSectionProps) {
  const hasActiveFilters = agentId !== 'all' || clientId !== 'all' || categoryId !== 'all' || startDate || endDate || q

  return (
    <Card className="relative overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl shadow-slate-200/60 dark:shadow-slate-950/60">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="relative">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-white border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <div className="relative p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Filter className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white tracking-tight">
                  Advanced Filters
                </CardTitle>
                <CardDescription className="text-slate-300 mt-1.5 font-medium">
                  Refine and customize your task view with precision
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1.5 bg-amber-500/90 text-amber-50 border-amber-400/30 font-semibold text-xs shadow-lg"
                >
                  Filters Active
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="px-4 py-2 bg-white/10 backdrop-blur-md text-white border-white/20 font-semibold shadow-lg"
              >
                {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-10">
          {/* Primary Filters */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Primary Filters
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group space-y-4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  Agent Assignment
                </label>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger className="h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm hover:shadow-md focus:shadow-lg">
                    <SelectValue placeholder="Select an agent..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="all" className="font-medium">All Agents</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name || `${a.firstName} ${a.lastName}`.trim() || a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="group space-y-4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                    <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Client Organization
                </label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm hover:shadow-md focus:shadow-lg">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="all" className="font-medium">All Clients</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.company && <span className="text-slate-500">({c.company})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="group space-y-4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  Task Category
                </label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm hover:shadow-md focus:shadow-lg">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="all" className="font-medium">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Date Range & Search
              </h3>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50/80 via-white to-slate-50/50 dark:from-slate-800/50 dark:via-slate-800/80 dark:to-slate-800/50 rounded-2xl p-8 border-2 border-slate-100 dark:border-slate-700/50 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <div className="md:col-span-2 group space-y-4">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
                      <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                </div>
                
                <div className="md:col-span-2 group space-y-4">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
                      <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-12 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                </div>
                
                <div className="md:col-span-3 group space-y-4">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                      <Search className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    Global Search
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Search tasks, clients, agents, or descriptions..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="h-12 pl-11 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm hover:shadow-md focus:shadow-lg"
                    />
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Actions & Summary */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="h-11 px-6 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
              
              {hasActiveFilters && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Active filters applied
                </div>
              )}
            </div>
            
            <div className="text-right space-y-1">
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Displaying Results
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                <span className="text-blue-600 dark:text-blue-400">{filtered.length}</span>
                {" "}<span className="text-slate-400 font-normal">of</span>{" "}
                <span>{tasks.length}</span>
                {" "}<span className="text-sm text-slate-500 font-normal">tasks</span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}