"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ClientOverviewHeader } from "@/components/clients/client-overview-header"
import { ClientStatusSummary } from "@/components/clients/client-status-summary"
import { ClientGrid } from "@/components/clients/client-grid"
import { ClientList } from "@/components/clients/client-list"
import type { Client } from "@/types/client"
import { useSession } from "@/lib/auth-client"

export default function ClientsPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [packageFilter, setPackageFilter] = useState("all")
  const [amFilter, setAmFilter] = useState("all")

  const [packages, setPackages] = useState<{ id: string; name: string }[]>([])

  const currentUserId = (session as any)?.user?.id as string | undefined
  const currentUserRole =
    ((session as any)?.user?.role?.name as string | undefined) ??
    ((session as any)?.user?.role as string | undefined)
  const isAM = (currentUserRole ?? "").toLowerCase() === "am"

  // If user is an AM, force amFilter to their id (so list is scoped immediately)
  useEffect(() => {
    if (isAM && currentUserId && amFilter !== currentUserId) {
      setAmFilter(currentUserId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAM, currentUserId])

  // --- Fetch clients (optionally server-side filter by AM for efficiency) ---
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const url = new URL("/api/clients", window.location.origin)
      // If AM, fetch only their clients from the API directly
      if (isAM && currentUserId) url.searchParams.set("amId", currentUserId)

      const response = await fetch(url.toString(), { cache: "no-store" })
      if (!response.ok) throw new Error("Failed to fetch clients")
      const data: Client[] = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast.error("Failed to load clients data.")
    } finally {
      setLoading(false)
    }
  }, [isAM, currentUserId])

  // --- Fetch packages (for names in filter) ---
  const fetchPackages = useCallback(async () => {
    try {
      const resp = await fetch("/api/packages", { cache: "no-store" })
      if (!resp.ok) throw new Error("Failed to fetch packages")
      const raw = await resp.json()
      const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
      const mapped: { id: string; name: string }[] = (list as any[]).map((p) => ({
        id: String(p.id),
        name: String(p.name ?? "Unnamed"),
      }))
      setPackages(mapped)
    } catch (e) {
      // fallback from current clients state
      const derived = Array.from(
        clients.reduce((map, c) => {
          if (c.packageId) map.set(c.packageId, { id: c.packageId, name: c.package?.name ?? c.packageId })
          return map
        }, new Map<string, { id: string; name: string }>())
      ).map(([, v]) => v)
      setPackages(derived)
    }
  }, [clients])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  // Navigate to details
  const handleViewClientDetails = (client: Client) => {
    router.push(`/am/clients/${client.id}`)
  }

  const handleAddNewClient = () => {
    router.push("/am/clients/onboarding")
  }

  // Build account manager options from data we have
  const accountManagers = useMemo(
    () =>
      Array.from(
        clients.reduce((map, c) => {
          const id = c.amId ?? c.accountManager?.id
          if (!id) return map
          const nm = c.accountManager?.name ?? null
          const email = c.accountManager?.email ?? null
          const label = nm ? (email ? `${nm} (${email})` : nm) : id
          if (!map.has(id)) map.set(id, { id, label })
          return map
        }, new Map<string, { id: string; label: string }>())
      ).map(([, v]) => v),
    [clients]
  )

  // Client-side filtering (in addition to server-side when AM)
  const filteredClients = clients.filter((client) => {
    if (statusFilter !== "all" && (client.status ?? "").toLowerCase() !== statusFilter.toLowerCase()) return false
    if (packageFilter !== "all" && client.packageId !== packageFilter) return false

    // If AM is logged in, force scope even if header hasn't set it yet (safety)
    const effectiveAmFilter = isAM && currentUserId ? currentUserId : amFilter
    if (effectiveAmFilter !== "all" && (client.amId ?? client.accountManager?.id) !== effectiveAmFilter) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const hit =
        client.name?.toLowerCase().includes(q) ||
        client.company?.toLowerCase().includes(q) ||
        client.designation?.toLowerCase().includes(q) ||
        client.email?.toLowerCase().includes(q)
      if (!hit) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4 md:px-6">
      {/* Header + Summary */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-100">
        <ClientOverviewHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          packageFilter={packageFilter}
          setPackageFilter={setPackageFilter}
          packages={packages}                         // [{ id, name }]
          amFilter={amFilter}
          setAmFilter={setAmFilter}
          accountManagers={accountManagers}           // [{ id, label }]
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}           // e.g. "am"
          viewMode={viewMode}
          setViewMode={setViewMode}
          onAddNewClient={handleAddNewClient}
        />
        <ClientStatusSummary clients={clients} />
      </div>

      {/* Clients Grid or List */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-lg border border-gray-100">
          <p className="text-lg font-medium mb-2">No clients found matching your criteria.</p>
          <p className="text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <ClientGrid clients={filteredClients} onViewDetails={handleViewClientDetails} />
      ) : (
        <ClientList clients={filteredClients} onViewDetails={handleViewClientDetails} />
      )}
    </div>
  )
}
