"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ClientOverviewHeader } from "@/components/clients/client-overview-header";
import { ClientStatusSummary } from "@/components/clients/client-status-summary";
import { ClientGrid } from "@/components/clients/client-grid";
import { ClientList } from "@/components/clients/client-list";
import type { Client } from "@/types/client";
import { useUserSession } from "@/lib/hooks/use-user-session";

export default function ClientsPage() {
  const router = useRouter();

  // ✅ হুক থেকে user / loading সঠিকভাবে নাও
  const { user, loading: sessionLoading } = useUserSession();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [amFilter, setAmFilter] = useState("all");

  const [packages, setPackages] = useState<{ id: string; name: string }[]>([]);

  const currentUserId = user?.id ?? undefined;
  const currentUserRole = user?.role ?? undefined; // hook এ role string আসে
  const isAM = (currentUserRole ?? "").toLowerCase() === "am";

  // ✅ AM হলে UI ফিল্টারও জোর করে নিজের amId-তে সেট করো
  useEffect(() => {
    if (!sessionLoading && isAM && currentUserId && amFilter !== currentUserId) {
      setAmFilter(currentUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, isAM, currentUserId]);

  // --- Clients ফেচ (AM হলে server-side স্কোপিং) ---
  const fetchClients = useCallback(async () => {
    if (sessionLoading) return; // session না আসা পর্যন্ত অপেক্ষা
    setLoading(true);
    try {
      const url =
        isAM && currentUserId
          ? `/api/clients?amId=${encodeURIComponent(currentUserId)}`
          : "/api/clients";

      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch clients");

      const raw = await response.json();

      // 🔒 shape-agnostic extract: [], {clients:[]}, {data:[]}, {data:{clients:[]}}
      const list =
        (Array.isArray(raw) && raw) ||
        (Array.isArray(raw?.clients) && raw.clients) ||
        (Array.isArray(raw?.data) && raw.data) ||
        (Array.isArray(raw?.data?.clients) && raw.data.clients) ||
        [];

      // 🔧 id-গুলো string normalize করে নাও (amId, packageId, accountManager.id)
      const normalized: Client[] = (list as any[]).map((c) => ({
        ...c,
        id: String(c.id),
        amId: c?.amId != null ? String(c.amId) : c?.amId,
        packageId: c?.packageId != null ? String(c.packageId) : c?.packageId,
        accountManager: c?.accountManager
          ? {
              ...c.accountManager,
              id:
                c.accountManager.id != null
                  ? String(c.accountManager.id)
                  : c.accountManager.id,
            }
          : c?.accountManager,
      }));

      setClients(normalized);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients data.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [sessionLoading, isAM, currentUserId]);

  // --- Packages ফেচ (shape-agnostic) ---
  const fetchPackages = useCallback(async () => {
    try {
      const resp = await fetch("/api/packages", { cache: "no-store" });
      if (!resp.ok) throw new Error("Failed to fetch packages");

      const raw = await resp.json();
      const list =
        (Array.isArray(raw) && raw) ||
        (Array.isArray(raw?.data) && raw.data) ||
        [];

      const mapped: { id: string; name: string }[] = (list as any[]).map((p) => ({
        id: String(p.id),
        name: String(p.name ?? "Unnamed"),
      }));
      setPackages(mapped);
    } catch {
      // fallback: বর্তমান clients থেকে derive করো
      const derived = Array.from(
        clients.reduce((map, c) => {
          if (c.packageId)
            map.set(String(c.packageId), {
              id: String(c.packageId),
              name: c.package?.name ?? String(c.packageId),
            });
          return map;
        }, new Map<string, { id: string; name: string }>())
      ).map(([, v]) => v);
      setPackages(derived);
    }
  }, [clients]);

  // session লোড হওয়ার পরেই ফেচ করো
  useEffect(() => {
    if (!sessionLoading) fetchClients();
  }, [sessionLoading, fetchClients]);

  useEffect(() => {
    if (!sessionLoading) fetchPackages();
  }, [sessionLoading, fetchPackages]);

  // Navigate to details
  const handleViewClientDetails = (client: Client) => {
    router.push(`/am/clients/${client.id}`);
  };

  const handleAddNewClient = () => {
    router.push("/am/clients/onboarding");
  };

  // Account manager options build (AM হলে নিজেরটাই থাকবে)
  const accountManagers = useMemo(
    () =>
      Array.from(
        clients.reduce((map, c) => {
          const id = c.amId ?? c.accountManager?.id;
          if (!id) return map;
          const nm = c.accountManager?.name ?? null;
          const email = c.accountManager?.email ?? null;
          const label = nm ? (email ? `${nm} (${email})` : nm) : String(id);
          if (!map.has(String(id))) map.set(String(id), { id: String(id), label });
          return map;
        }, new Map<string, { id: string; label: string }>())
      ).map(([, v]) => v),
    [clients]
  );

  // Client-side নিরাপত্তা ফিল্টার (server-side ছাড়াও)
  const filteredClients = clients.filter((client) => {
    // status filter
    if (
      statusFilter !== "all" &&
      (client.status ?? "").toLowerCase() !== statusFilter.toLowerCase()
    ) {
      return false;
    }

    // package filter (string compare)
    const clientPkgId = client.packageId != null ? String(client.packageId) : null;
    if (packageFilter !== "all" && clientPkgId !== String(packageFilter)) {
      return false;
    }

    // AM scope (string compare)
    const effectiveAmFilter =
      isAM && currentUserId ? String(currentUserId) : (amFilter === "all" ? "all" : String(amFilter));
    const clientAm = client.amId ?? client.accountManager?.id ?? null;
    if (effectiveAmFilter !== "all" && String(clientAm ?? "") !== effectiveAmFilter) {
      return false;
    }

    // search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hit =
        client.name?.toLowerCase().includes(q) ||
        client.company?.toLowerCase().includes(q) ||
        client.designation?.toLowerCase().includes(q) ||
        client.email?.toLowerCase().includes(q);
      if (!hit) return false;
    }
    return true;
  });

  // Loading UI: session বা data যেকোনওটা লোডিং হলে
  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
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
          packages={packages} // [{ id, name }]
          amFilter={amFilter}
          setAmFilter={setAmFilter}
          accountManagers={accountManagers} // [{ id, label }]
          currentUserId={currentUserId}
          currentUserRole={currentUserRole} // e.g. "am"
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
  );
}
