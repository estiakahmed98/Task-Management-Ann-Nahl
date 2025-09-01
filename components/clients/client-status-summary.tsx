import type { Client } from "@/types/client"

interface ClientStatusSummaryProps {
  clients: Client[]
}

export function ClientStatusSummary({ clients }: ClientStatusSummaryProps) {
  return (
    <div className="flex items-center text-sm text-gray-600 mb-2 font-medium">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm"></div>
          <span>Pending: {clients.filter((c) => c.status === "pending").length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400 shadow-sm"></div>
          <span>Active: {clients.filter((c) => c.status === "active").length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400 shadow-sm"></div>
          <span>Inactive: {clients.filter((c) => c.status === "inactive").length}</span>
        </div>
      </div>
    </div>
  )
}
