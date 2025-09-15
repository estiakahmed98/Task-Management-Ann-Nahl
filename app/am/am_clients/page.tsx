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

  // যদি AM হয়, তাহলে UI ফিল্টারও জোর করে নিজের amId-তে সেট
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
      const data = await response.json();

      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients data.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [sessionLoading, isAM, currentUserId]);

  // --- Packages ফেচ ---
  const fetchPackages = useCallback(async () => {
    try {
      const resp = await fetch("/api/packages", { cache: "no-store" });
      if (!resp.ok) throw new Error("Failed to fetch packages");
      const raw = await resp.json();
      const list = Array.isArray(raw) ? raw : raw?.data ?? [];
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
            map.set(c.packageId, {
              id: c.packageId,
              name: c.package?.name ?? c.packageId,
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
          const label = nm ? (email ? `${nm} (${email})` : nm) : id;
          if (!map.has(id)) map.set(id, { id, label });
          return map;
        }, new Map<string, { id: string; label: string }>())
      ).map(([, v]) => v),
    [clients]
  );

  // Client-side নিরাপত্তা ফিল্টার (server-side ছাড়াও)
  const filteredClients = clients.filter((client) => {
    if (
      statusFilter !== "all" &&
      (client.status ?? "").toLowerCase() !== statusFilter.toLowerCase()
    )
      return false;
    if (packageFilter !== "all" && client.packageId !== packageFilter) return false;

    const effectiveAmFilter = isAM && currentUserId ? currentUserId : amFilter;
    if (
      effectiveAmFilter !== "all" &&
      (client.amId ?? client.accountManager?.id) !== effectiveAmFilter
    )
      return false;

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
