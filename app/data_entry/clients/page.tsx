"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ClientOverviewHeader } from "@/components/clients/client-overview-header";
import { ClientStatusSummary } from "@/components/clients/client-status-summary";
import { ClientGrid } from "@/components/clients/client-grid";
import { ClientList } from "@/components/clients/client-list";
import type { Client } from "@/types/client";

// ✅ useSession এর বদলে তোমার কাস্টম হুক
import { useUserSession } from "@/lib/hooks/use-user-session";
import DataEntryClientStats from "@/components/dataentry/DataEntryClientStats";

export default function ClientsPage() {
  const router = useRouter();

  // ✅ কাস্টম সেশন হুক
  const { user: sessionUser, loading: sessionLoading } = useUserSession();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [amFilter, setAmFilter] = useState("all");

  const [packages, setPackages] = useState<{ id: string; name: string }[]>([]);

  // ✅ তোমার get-session রেসপন্সে role (name) ও roleId থাকে
  const currentUserId = sessionUser?.id ?? undefined;
  const currentUserRole =
    (sessionUser?.role as string | undefined) ||
    (sessionUser?.roleId as string | undefined);
  const isAM = (currentUserRole ?? "").toLowerCase() === "am";

  // ✅ AM হলে ফিল্টার অটো-সেট (session লোড হওয়ার পর)
  useEffect(() => {
    if (
      !sessionLoading &&
      isAM &&
      currentUserId &&
      amFilter !== currentUserId
    ) {
      setAmFilter(currentUserId);
    }
  }, [sessionLoading, isAM, currentUserId, amFilter]);

  // --- Fetch clients (AM হলে server-side query param) ---
  const fetchClients = useCallback(async () => {
    // সেশন লোড না হলে বা AM হলে কিন্তু id এখনো না এলে অপেক্ষা করো
    if (sessionLoading) return;
    if (isAM && !currentUserId) return;

    try {
      setLoading(true);
      const url = new URL("/api/clients", window.location.origin);
      if (isAM && currentUserId) url.searchParams.set("amId", currentUserId);
      // data_entry (or any non-AM) should only see clients assigned to them
      if (!isAM && currentUserId) url.searchParams.set("assignedAgentId", currentUserId);

      const response = await fetch(url.toString(), { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch clients");

      const payload = await response.json();
      const clientsData = Array.isArray(payload?.clients)
        ? (payload.clients as Client[])
        : [];

      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients data.");
      setClients([]); // ✅ guard
    } finally {
      setLoading(false);
    }
  }, [sessionLoading, isAM, currentUserId]);

  // --- Fetch packages (for filter names) ---
  const fetchPackages = useCallback(async () => {
    try {
      const resp = await fetch("/api/packages", { cache: "no-store" });
      if (!resp.ok) throw new Error("Failed to fetch packages");

      const raw = await resp.json();
      const list = Array.isArray(raw) ? raw : raw?.data ?? [];

      const mapped: { id: string; name: string }[] = (list as any[]).map(
        (p) => ({
          id: String(p?.id),
          name: String(p?.name ?? "Unnamed"),
        })
      );
      setPackages(mapped);
    } catch (e) {
      // ✅ fallback: clients state থেকে derive
      const safeClients = Array.isArray(clients) ? clients : [];
      const derived = Array.from(
        safeClients.reduce((map, c) => {
          if (c?.packageId) {
            map.set(c.packageId, {
              id: c.packageId,
              name: c?.package?.name ?? c.packageId,
            });
          }
          return map;
        }, new Map<string, { id: string; name: string }>())
      ).map(([, v]) => v);
      setPackages(derived);
    }
  }, [clients]);

  // সেশন-ডিপেন্ডেন্ট ক্লায়েন্ট ফেচ
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Navigate to details
  const handleViewClientDetails = (client: Client) => {
    router.push(`/data_entry/clients/${client.id}`);
  };

  const handleAddNewClient = () => {
    router.push("/data_entry/clients/onboarding");
  };

  // Build account manager options safely
  const accountManagers = useMemo(() => {
    const safeClients = Array.isArray(clients) ? clients : [];
    return Array.from(
      safeClients.reduce((map, c) => {
        const id = c?.amId ?? c?.accountManager?.id;
        if (!id) return map;
        const nm = c?.accountManager?.name ?? null;
        const email = c?.accountManager?.email ?? null;
        const label = nm ? (email ? `${nm} (${email})` : nm) : id;
        if (!map.has(id)) map.set(id, { id, label });
        return map;
      }, new Map<string, { id: string; label: string }>())
    ).map(([, v]) => v);
  }, [clients]);

  // Client-side filtering (extra safety)
  const filteredClients = (Array.isArray(clients) ? clients : []).filter(
    (client) => {
      if (
        statusFilter !== "all" &&
        (client?.status ?? "").toLowerCase() !== statusFilter.toLowerCase()
      )
        return false;

      if (packageFilter !== "all" && client?.packageId !== packageFilter)
        return false;

      // AM হলে ফোর্স স্কোপ
      const effectiveAmFilter =
        isAM && currentUserId ? currentUserId : amFilter;
      if (
        effectiveAmFilter !== "all" &&
        (client?.amId ?? client?.accountManager?.id) !== effectiveAmFilter
      )
        return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hit =
          client?.name?.toLowerCase().includes(q) ||
          client?.company?.toLowerCase().includes(q) ||
          client?.designation?.toLowerCase().includes(q) ||
          client?.email?.toLowerCase().includes(q);
        if (!hit) return false;
      }

      return true;
    }
  );

  // ✅ loading UI: সেশন লোড + ডেটা লোড—দুটোই কভার
  if (loading || sessionLoading) {
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
        <ClientStatusSummary clients={Array.isArray(clients) ? clients : []} />
      </div>

      {/* Data Entry Client Stats */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-100">
        <DataEntryClientStats clients={Array.isArray(clients) ? clients : []} />
      </div>

      {/* Clients Grid or List */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-lg border border-gray-100">
          <p className="text-lg font-medium mb-2">
            No clients found matching your criteria.
          </p>
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
  );
}
