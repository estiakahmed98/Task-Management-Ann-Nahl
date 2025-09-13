// app/admin/clients/[clientId]/page.tsx
import { headers, cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ClientDashboard } from "@/components/clients/clientsID/client-dashboard";
import type { Client } from "@/types/client";

const UNCATEGORIZED = { id: "uncategorized", name: "Uncategorized", description: "" };

function normalizeClientData(apiData: any): Client {
  return {
    ...apiData,
    companywebsite:
      apiData?.companywebsite && typeof apiData.companywebsite === "string"
        ? apiData.companywebsite
        : "",
    tasks: (apiData?.tasks ?? []).map((t: any) => ({
      ...t,
      categoryId: t?.category?.id ?? t?.categoryId ?? "uncategorized",
      category: t?.category ?? UNCATEGORIZED,
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
  };
}

async function fetchClient(clientId: string): Promise<Client | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;

  // forward cookies so protected API works
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${base}/api/clients/${encodeURIComponent(clientId)}`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  });

  if (!res.ok) return null;

  const raw = await res.json();
  const data = raw?.client ?? raw; // handle {client: {...}} or plain object
  return normalizeClientData(data);
}

export default async function ClientPage({
  params,
}: {
  params: { clientId: string }; // <-- Promise নয়
}) {
  const clientData = await fetchClient(params.clientId);

  if (!clientData) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <ClientDashboard clientData={clientData} />
    </div>
  );
}
