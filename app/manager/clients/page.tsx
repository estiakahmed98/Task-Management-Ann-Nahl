"use client"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ClientOverviewHeader } from "@/components/clients/client-overview-header"
import { ClientStatusSummary } from "@/components/clients/client-status-summary"
import { ClientGrid } from "@/components/clients/client-grid"
import { ClientList } from "@/components/clients/client-list"
import type { Client } from "@/types/client"

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [packageFilter, setPackageFilter] = useState("all")
  const [amFilter, setAmFilter] = useState("all")
  const [packages, setPackages] = useState<{ id: string; name: string }[]>([])
  // Details now shown on dedicated route: /admin/clients/[clientId]

  // Fetch all clients
  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error("Failed to fetch clients")
      const data: Client[] = await response.json()
      setClients(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast.error("Failed to load clients data.")
      setLoading(false)
    }
  }, [])

  // Fetch packages for names
  const fetchPackages = useCallback(async () => {
    try {
      const resp = await fetch("/api/packages")
      if (!resp.ok) throw new Error("Failed to fetch packages")
      const raw = await resp.json()
      const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
      const mapped: { id: string; name: string }[] = (list as any[]).map((p) => ({
        id: String(p.id),
        name: String(p.name ?? "Unnamed"),
      }))
      setPackages(mapped)
    } catch (e) {
      // fallback: derive from clients if API fails
      const derived = Array.from(
        clients.reduce((map, c) => {
          if (c.packageId) map.set(c.packageId, { id: c.packageId, name: c.package?.name ?? c.packageId })
          return map
        }, new Map<string, { id: string; name: string }>())
      ).map(([, v]) => v)
      setPackages(derived)
    }
  }, [clients])

  // Details are handled via navigation now

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const handleViewClientDetails = (client: Client) => {
    router.push(`/admin/clients/${client.id}`)
  }

  const handleAddNewClient = () => {
    router.push("clients/onboarding")
  }

  const filteredClients = clients.filter((client) => {
    if (statusFilter !== "all" && client.status !== statusFilter) return false
    if (packageFilter !== "all" && client.packageId !== packageFilter) return false
    if (amFilter !== "all" && (client.amId ?? client.accountManager?.id) !== amFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        client.name.toLowerCase().includes(q) ||
        client.company?.toLowerCase().includes(q) ||
        client.designation?.toLowerCase().includes(q) ||
        client.email?.toLowerCase().includes(q)
      )
    }
    return true
  })

  // packages come from API/state to ensure names are accurate

  // Build account managers list
  const accountManagers = Array.from(
    clients.reduce((map, c) => {
      const id = c.amId ?? c.accountManager?.id
      if (!id) return map
      const nm = c.accountManager?.name ?? null
      const label = nm || id
      if (!map.has(id)) map.set(id, { id, label })
      return map
    }, new Map<string, { id: string; label: string }>())
  ).map(([, v]) => v)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
          packages={packages}
          amFilter={amFilter}
          setAmFilter={setAmFilter}
          accountManagers={accountManagers}
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
        <ClientGrid
          clients={filteredClients}
          onViewDetails={handleViewClientDetails}
        />
      ) : (
        <ClientList
          clients={filteredClients}
          onViewDetails={handleViewClientDetails}
        />
      )}
    </div>
  )
}
