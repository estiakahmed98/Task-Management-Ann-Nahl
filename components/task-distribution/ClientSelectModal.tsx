"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, Users, X, RefreshCw } from "lucide-react";
import type { Client } from "./distribution-types";
import { getInitialsFromName, nameToColor } from "@/utils/avatar";

interface ClientSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (clientId: string) => void;
}

interface PackageLite {
  id: string;
  name: string;
}

export function ClientSelectModal({ isOpen, onClose, onSelect }: ClientSelectModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<PackageLite[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ----- Filters -----
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [packageId, setPackageId] = useState<string>("all");

  useEffect(() => {
    if (!isOpen) return;
    void fetchAll();
    // Reset filters each time the modal opens
    setSearch("");
    setCompany("all");
    setStatus("all");
    setPackageId("all");
  }, [isOpen]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsRes, packagesRes] = await Promise.all([
        fetch("/api/clients?include=package"),
        fetch("/api/packages?select=id,name"),
      ]);

      if (!clientsRes.ok) throw new Error(`Clients: ${clientsRes.statusText}`);
      if (!packagesRes.ok) throw new Error(`Packages: ${packagesRes.statusText}`);

      const clientsData = await clientsRes.json();
      const packagesData = await packagesRes.json();

      setClients(clientsData as Client[]);
      setPackages((packagesData as PackageLite[]).filter((p) => !!p.name));
    } catch (err: any) {
      setError(err?.message ?? "Failed to load data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    for (const c of clients) if (c.company) set.add(c.company);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clients]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    for (const c of clients) if (c.status) set.add(c.status);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clients]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return clients.filter((c) => {
      const matchesSearch = !s
        || c.name.toLowerCase().includes(s)
        || (c.company?.toLowerCase().includes(s) ?? false)
        || (c.package?.name?.toLowerCase().includes(s) ?? false);

      const matchesCompany = company === "all" || (c.company ?? "") === company;
      const matchesStatus = status === "all" || (c.status ?? "") === status;
      const matchesPackage = packageId === "all" || (c.packageId ?? "") === packageId;

      return matchesSearch && matchesCompany && matchesStatus && matchesPackage;
    });
  }, [clients, search, company, status, packageId]);

  const clearFilters = () => {
    setSearch("");
    setCompany("all");
    setStatus("all");
    setPackageId("all");
  };

  const handleSelect = (clientId: string) => {
    onSelect(clientId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden rounded-lg">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-white sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
            <Users className="h-5 w-5 text-blue-600" />
            Select Client
          </DialogTitle>
        </DialogHeader>

        {/* Fixed Filters Section */}
        <div className="px-6 py-4 border-b bg-gray-50 sticky top-[68px] z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="focus-visible:ring-2 focus-visible:ring-blue-500"
            />

            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all" className="focus:bg-blue-50">All companies</SelectItem>
                {uniqueCompanies.map((co) => (
                  <SelectItem key={co} value={co} className="focus:bg-blue-50">
                    {co}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all" className="focus:bg-blue-50">All status</SelectItem>
                {uniqueStatuses.map((st) => (
                  <SelectItem key={st} value={st} className="focus:bg-blue-50">
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Package" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all" className="focus:bg-blue-50">All packages</SelectItem>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="focus:bg-blue-50">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {filtered.length} {filtered.length === 1 ? "client" : "clients"}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters} 
                className="text-gray-500 hover:bg-gray-100"
              >
                Clear filters
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => void fetchAll()}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
              <p className="text-gray-600">Loading clients...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="bg-red-50 px-4 py-3 rounded-lg max-w-md text-center">
                <p className="text-red-600 font-medium">{error}</p>
              </div>
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => void fetchAll()}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> 
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="bg-gray-50 px-6 py-5 rounded-lg max-w-md text-center">
                <Users className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <h4 className="text-gray-700 font-medium">No clients found</h4>
                <p className="text-gray-500 text-sm mt-1">
                  {search.trim() ? "Try a different search term" : "Try adjusting your filters"}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="mt-3 text-blue-600 hover:bg-blue-50"
                >
                  Clear all filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {filtered.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white hover:border-blue-200 hover:shadow-xs cursor-pointer transition-all"
                  onClick={() => handleSelect(client.id)}
                >
                  <Avatar className="h-10 w-10 border border-gray-100">
                    <AvatarImage src={client.avatar || undefined} alt={client.name} />
                    <AvatarFallback
                      className="text-white font-medium"
                      style={{ backgroundColor: nameToColor(client.name) }}
                    >
                      {getInitialsFromName(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-800 truncate">
                        {client.name}
                      </h3>
                      {client.status && (
                        <Badge 
                          variant={client.status === "active" ? "default" : "secondary"} 
                          className={`text-xs ${client.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"}`}
                        >
                          {client.status}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      {client.company && (
                        <span className="flex items-center gap-1.5 truncate">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          {client.company}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {client.package?.name && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                          {client.package.name}
                        </Badge>
                      )}
                      {typeof client.progress === "number" && (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${client.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-500">{client.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleSelect(client.id); }}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}