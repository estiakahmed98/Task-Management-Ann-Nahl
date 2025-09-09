"use client"

import { useEffect, useState, useCallback } from "react"

type ActionType = "create" | "update" | "delete"
type Log = {
  id: string
  entityType: string
  entityId: string
  action: ActionType | string
  timestamp: string
  details: any
  user?: { id: string; name: string | null; email: string | null }
}

type PaginationInfo = {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
}

const TZ = "Asia/Dhaka"

function formatRelative(dateIso: string) {
  const dt = new Date(dateIso)
  const diffMs = Date.now() - dt.getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d ago`
  return dt.toLocaleString(undefined, { timeZone: TZ })
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters
  const [search, setSearch] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [actionFilter, setActionFilter] = useState<"all" | ActionType>("all")

  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchLogs = useCallback(
    async (page = 1) => {
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", "20")
      if (debouncedQ) params.set("q", debouncedQ)
      if (actionFilter !== "all") params.set("action", actionFilter)

      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/activity?${params.toString()}`)
        const data = await res.json()
        if (!res.ok || data.success === false) {
          throw new Error(data.error || "Failed to fetch activity logs")
        }
        setLogs(data.logs || [])
        setPagination(data.pagination)
        setCurrentPage(page)
      } catch (e: any) {
        setError(e?.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    },
    [debouncedQ, actionFilter],
  )

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      fetchLogs(page)
    }
  }

  const getPageNumbers = () => {
    if (!pagination) return []

    const { currentPage, totalPages } = pagination
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">📜 Activity Logs</h1>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="🔍 Search by user, entity, action, details..."
          className="border rounded px-3 py-2 w-full sm:w-1/2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 w-full sm:w-40"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as any)}
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
      </div>

      {pagination && !loading && (
        <div className="text-sm text-gray-600">
          Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} logs
        </div>
      )}

      {/* Error / Loading */}
      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2">{error}</div>}
      {loading && <div className="p-2 text-gray-600">Loading logs…</div>}

      {!loading && (
        <div className="overflow-x-auto border rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-500">
                    No matching logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50 align-top">
                    <td className="p-3">
                      {log.user?.name || "Unknown"} <br />
                      <span className="text-xs text-gray-500">{log.user?.email}</span>
                    </td>
                    <td className="p-3">
                      {log.entityType} <br />
                      <span className="text-xs text-gray-500">{log.entityId}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          log.action === "create"
                            ? "bg-green-100 text-green-700"
                            : log.action === "update"
                              ? "bg-blue-100 text-blue-700"
                              : log.action === "delete"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 max-w-[380px]">
                      {log.details && typeof log.details === "object" ? (
                        <pre className="text-xs border border-gray-200 rounded w-full max-h-40 overflow-auto p-2 whitespace-pre-wrap break-words">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div title={new Date(log.timestamp).toLocaleString(undefined, { timeZone: TZ })}>
                        {formatRelative(log.timestamp)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && !loading && (
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => (typeof page === "number" ? handlePageChange(page) : undefined)}
                  disabled={page === "..."}
                  className={`px-3 py-2 text-sm border rounded ${
                    page === currentPage
                      ? "bg-blue-500 text-white border-blue-500"
                      : page === "..."
                        ? "cursor-default border-transparent"
                        : "hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  )
}
