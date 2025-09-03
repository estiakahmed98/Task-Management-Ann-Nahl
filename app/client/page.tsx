"use client"
// app/client/page.tsx
import { useEffect, useState } from "react"
import { ClientDashboard } from "@/components/clients/clientsID/client-dashboard"
import { Client } from "@/types/client"

function normalizeClientData(apiData: any): Client {
  const uncategorized = { id: "uncategorized", name: "Uncategorized", description: "" }

  return {
    ...apiData,
    companywebsite:
      apiData?.companywebsite && typeof apiData.companywebsite === "string"
        ? apiData.companywebsite
        : "",
    tasks: (apiData?.tasks ?? []).map((t: any) => ({
      ...t,
      categoryId: t?.category?.id ?? t?.categoryId ?? "uncategorized",
      category: t?.category ?? uncategorized,
      name: String(t?.name ?? ""),
      priority: String(t?.priority ?? "medium"),
      status: String(t?.status ?? "pending"),
      templateSiteAsset: {
        ...t?.templateSiteAsset,
        type: String(t?.templateSiteAsset?.type ?? ""),
        name: String(t?.templateSiteAsset?.name ?? ""),
        url: String(t?.templateSiteAsset?.url ?? ""),
      },
    })),
  }
}

export default function ClientPage() {
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientData, setClientData] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function run() {
      try {
        setLoading(true)
        // Fetch session to get clientId
        const sRes = await fetch("/api/auth/get-session", { cache: "no-store" })
        if (!sRes.ok) throw new Error("Failed to fetch session")
        const sData = await sRes.json()
        const cid: string | null = sData?.user?.clientId ?? null
        if (!mounted) return
        setClientId(cid)

        if (!cid) {
          setClientData(null)
          return
        }
        // Fetch client by id
        const cRes = await fetch(`/api/clients/${cid}`, { cache: "no-store" })
        if (!cRes.ok) throw new Error("Failed to fetch client")
        const raw = await cRes.json()
        if (!mounted) return
        setClientData(normalizeClientData(raw))
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || "Something went wrong")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen p-6">
      <div className="space-y-4">
        <div className="bg-white rounded-lg border p-4">
          {loading ? (
            <p className="text-sm text-gray-600">Loading session...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : clientId && clientData ? (
            <ClientDashboard clientData={clientData} />
          ) : clientId && !clientData ? (
            <p className="text-sm text-gray-600">Loading client data...</p>
          ) : (
            <p className="text-sm text-gray-600">No client is associated with your session.</p>
          )}
        </div>
      </div>
    </div>
  )
}
