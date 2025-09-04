"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Filter,
  User,
  Building2,
  FileText,
  Calendar,
  RotateCcw,
  Search,
  ChevronsUpDown,
  Check,
} from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import * as React from "react"

interface AgentItem {
  id: string
  name: string | null
  firstName?: string
  lastName?: string
  email: string
}

interface ClientItem {
  id: string
  name: string
  company?: string
}

interface CategoryItem {
  id: string
  name: string
}

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
  agents: Array<AgentItem>
  clients: Array<ClientItem>
  categories: Array<CategoryItem>
  filtered: any[]
  tasks: any[]
  clearFilters: () => void
}

/** ---------- Reusable Searchable Select (Combobox) ---------- */
type SearchableSelectItem = {
  value: string
  label: string
  subLabel?: string
}

function SearchableSelect({
  value,
  onChange,
  placeholder = "Select an option...",
  items,
  emptyText = "No matching results.",
  triggerClassName,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  items: SearchableSelectItem[]
  emptyText?: string
  triggerClassName?: string
}) {
  const [open, setOpen] = React.useState(false)

  const selected = items.find((i) => i.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between bg-white border border-gray-200 hover:border-gray-300 focus:border-blue-500",
            triggerClassName
          )}
        >
          {selected ? (
            <div className="flex items-center gap-2">
              <span className="truncate">{selected.label}</span>
              {selected.subLabel && (
                <span className="text-xs text-gray-500 truncate">({selected.subLabel})</span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput placeholder="Type to search..." />
          <CommandList>
            <CommandEmpty className="py-3 text-gray-500">{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${item.label} ${item.subLabel ?? ""}`}
                  onSelect={() => {
                    onChange(item.value)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{item.label}</span>
                    {item.subLabel && (
                      <span className="text-xs text-gray-500 truncate">{item.subLabel}</span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 flex-none",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** --------------------------- Main Component --------------------------- */
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
  const hasActiveFilters =
    agentId !== "all" || clientId !== "all" || categoryId !== "all" || startDate || endDate || q

  // Build searchable items
  const agentItems: SearchableSelectItem[] = React.useMemo(() => {
    const mapped = agents.map((a) => {
      const full = a.name || `${(a.firstName || "").trim()} ${(a.lastName || "").trim()}`.trim() || a.email
      return {
        value: a.id,
        label: full,
        subLabel: a.email,
      }
    })
    return [{ value: "all", label: "All Agents" }, ...mapped]
  }, [agents])

  const clientItems: SearchableSelectItem[] = React.useMemo(() => {
    const mapped = clients.map((c) => ({
      value: c.id,
      label: c.name,
      subLabel: c.company,
    }))
    return [{ value: "all", label: "All Clients" }, ...mapped]
  }, [clients])

  const categoryItems: SearchableSelectItem[] = React.useMemo(() => {
    const mapped = categories.map((c) => ({
      value: c.id,
      label: c.name,
    }))
    return [{ value: "all", label: "All Categories" }, ...mapped]
  }, [categories])

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4 space-y-0 border-b bg-gradient-to-r from-sky-50 to-sky-100 border-gray-100">
        <div className="text-lg font-semibold">
          Filters
          <p className="text-gray-600 text-xs">Refine your task view</p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
              Active
            </Badge>
          )}
          <Badge variant="outline" className="text-gray-600">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-5">
        {/* Primary Filters */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Agent Assignment */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Agent
              </label>
              <SearchableSelect
                value={agentId}
                onChange={setAgentId}
                placeholder="Select an agent..."
                items={agentItems}
              />
            </div>

            {/* Client Organization */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Client
              </label>
              <SearchableSelect
                value={clientId}
                onChange={setClientId}
                placeholder="Select a client..."
                items={clientItems}
              />
            </div>

            {/* Task Category */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Category
              </label>
              <SearchableSelect
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Select a category..."
                items={categoryItems}
              />
            </div>
          </div>
        </div>

        {/* Date Range & Search */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Date Range & Search</h3>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 bg-white border border-gray-200"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 bg-white border border-gray-200"
              />
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                Search
              </label>
              <div className="relative">
                <Input
                  placeholder="Search tasks, clients, agents..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-10 pl-9 bg-white border border-gray-200"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Actions & Summary */}
        <div className="flex items-center justify-between border-t border-gray-100">
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="h-9 px-4 text-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            Clear Filters
          </Button>

          <div className="text-right">
            <div className="text-xs text-gray-500">
              Showing {filtered.length} of {tasks.length} tasks
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}