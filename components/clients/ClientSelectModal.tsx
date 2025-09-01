"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Building2, Search, Filter, Package, ChevronDown, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitialsFromName, nameToColor } from "@/utils/avatar";

export function ClientSelectModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (clientId: string) => void;
}) {
  const [clients, setClients] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [clientsRes, packagesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/packages")
        ]);
        setClients(await clientsRes.json());
        setPackages(await packagesRes.json());
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  const filteredClients = clients.filter((client: any) => {
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesPackage = packageFilter === "all" || client.packageId === packageFilter;
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.company?.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesPackage && matchesSearch;
  });

  const clearFilters = () => {
    setStatusFilter("all");
    setPackageFilter("all");
    setSearch("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 rounded-lg">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">Select Client</DialogTitle>
          <DialogDescription>
            Choose from your active clients or search for specific ones
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 bg-gray-50 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search clients by name or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filters:</span>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={packageFilter} onValueChange={setPackageFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="Package" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                {packages.map((pkg: any) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(statusFilter !== "all" || packageFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredClients.map((client: any) => (
                <button
                  key={client.id}
                  onClick={() => {
                    onSelect(client.id);
                    onClose();
                  }}
                  className="flex items-start p-4 rounded-xl border hover:border-blue-300 hover:shadow-sm transition-all text-left group"
                >
                  <Avatar className="h-12 w-12 ring-2 ring-blue-100 group-hover:ring-blue-200 mr-4 transition-all">
                    <AvatarImage src={client.avatar || undefined} />
                    <AvatarFallback
                      className="text-white font-medium"
                      style={{ backgroundColor: nameToColor(client.name) }}
                    >
                      {getInitialsFromName(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                    <p className="text-gray-600 flex items-center text-sm mt-1">
                      <Building2 className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{client.company || "No company"}</span>
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge
                        variant={client.status === "active" ? "default" : "secondary"}
                        className={`text-xs ${
                          client.status === "active"
                            ? "bg-green-50 text-green-700 hover:bg-green-50"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {client.status || "unknown"}
                      </Badge>
                      {client.package?.name && (
                        <Badge variant="outline" className="text-xs">
                          {client.package.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <Search className="h-10 w-10 text-gray-400" />
              <h4 className="font-medium text-gray-900">No clients found</h4>
              <p className="text-gray-500 text-sm max-w-md">
                {search || statusFilter !== "all" || packageFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "You don't have any clients yet"}
              </p>
              {(search || statusFilter !== "all" || packageFilter !== "all") && (
                <Button variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}