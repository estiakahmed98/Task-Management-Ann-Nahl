// app/admin/clients/[clientId]/page.tsx
import { headers } from "next/headers"
import { notFound } from "next/navigation"
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

async function fetchClient(clientId: string): Promise<Client | null> {
  const h = await headers()
  const host = h.get("host")
  const protocol =
    process.env.NODE_ENV === "development" || (host && host.startsWith("localhost")) ? "http" : "https"
  const base = `${protocol}://${host ?? "localhost:3000"}`
  const url = `${base}/api/clients/${clientId}`

  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null
  const raw = await res.json()
  return normalizeClientData(raw)
}

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const clientData = await fetchClient(clientId)

  if (!clientData) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <ClientDashboard clientData={clientData} />
    </div>
  )
}
