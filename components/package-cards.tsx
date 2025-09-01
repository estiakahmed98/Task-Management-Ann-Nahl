// components/package-cards.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { AddPackageModal } from "@/components/add-package-modal";
import { PackageDetailsModal } from "@/components/package-details-modal";
import {
  Eye,
  Info,
  Plus,
  Package as PackageIcon,
  Users,
  FileText,
  Activity,
  TrendingUp,
  Star,
  Edit3,
  Trash2,
  Calendar,
  Target,
  BarChart3,
  Globe,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { hasPermissionClient } from "@/lib/permissions-client";
import { cn } from "@/lib/utils";

interface Package {
  id: string;
  name: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    clients: number;
    templates: number;
    assignments?: number;
    sitesAssets?: number;
  };
  templates?: Array<{
    id: string;
    name: string;
    status: string;
    _count?: {
      sitesAssets: number;
      templateTeamMembers: number;
    };
  }>;
}

export function PackageCards() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [packageList, setPackageList] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPackages = useCallback(async () => {
    try {
      // include=stats query রাখা হলো ভবিষ্যতে সার্ভার-সাইড কাস্টমাইজেশনের জন্য
      const response = await fetch("/api/zisanpackages?include=stats");
      if (!response.ok) throw new Error("Failed to fetch packages");
      const data = await response.json();
      setPackageList(data);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const addPackage = async (newPackage: Omit<Package, "id" | "_count">) => {
    try {
      const response = await fetch("/api/zisanpackages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 🔐 actorId → header এ পাঠাচ্ছি (API এটাও পড়ে)
          "x-actor-id": user?.id || "",
        },
        body: JSON.stringify({
          ...newPackage,
          // fallback হিসেবে body-তেও পাঠালাম (API দুটোই সাপোর্ট করে)
          actorId: user?.id || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create package");
      }

      const createdPackage = await response.json();
      // লোকালি prepend করলাম যাতে নতুনটা উপরে দেখা যায়
      setPackageList((prev) => [
        { ...createdPackage, _count: { clients: 0, templates: 0 } },
        ...prev,
      ]);
      setIsModalOpen(false);

      // সার্ভারকে সোর্স অফ ট্রুথ ধরে রিফেচ
      fetchPackages();
    } catch (error: any) {
      console.error("Error adding package:", error);
      alert(error.message || "Error adding package");
    }
  };

  const updatePackage = async (
    id: string,
    updatedData: { name: string; description?: string }
  ) => {
    try {
      const response = await fetch(`/api/zisanpackages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-actor-id": user?.id || "",
        },
        body: JSON.stringify({
          ...updatedData,
          actorId: user?.id || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to update package");
      }

      const updated = await response.json();

      // লোকাল স্টেট আপডেট
      setPackageList((prev) =>
        prev.map((pkg) => (pkg.id === id ? { ...pkg, ...updated } : pkg))
      );
      setEditingPackage(null);

      // রিফেচ (count/relations fresh করার জন্য)
      fetchPackages();
    } catch (error: any) {
      console.error("Error updating package:", error);
      alert(error.message || "Error updating package");
    }
  };

  const handleSeeTemplates = (pkg: Package) => {
    router.push(`/admin/packages/id-${pkg.id}/templates`);
  };

  const handleViewDetails = (packageId: string) => {
    setSelectedPackage(packageId);
    setIsDetailsModalOpen(true);
  };

  const deletePackage = async (id: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this package? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/zisanpackages/${id}`, {
        method: "DELETE",
        headers: {
          // 🔐 actorId header (API DELETE এটাও পড়ে)
          "x-actor-id": user?.id || "",
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error?.error || "Failed to delete package. It may have relations."
        );
      }

      // লোকাল স্টেট থেকে সরিয়ে দাও
      setPackageList((prev) => prev.filter((pkg) => pkg.id !== id));

      // রিফেচ — নিরাপদে সার্ভারের সাথে সিঙ্ক
      fetchPackages();
    } catch (error: any) {
      console.error("Error deleting package:", error);
      alert(error.message || "Something went wrong while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  const getPackageHealthScore = (pkg: Package) => {
    const templates = pkg._count?.templates || 0;
    const clients = pkg._count?.clients || 0;
    const assignments = pkg._count?.assignments || 0;

    let score = 0;
    if (templates > 0) score += 30;
    if (clients > 0) score += 30;
    if (assignments > 0) score += 40;

    return Math.min(score, 100);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return "from-emerald-50 to-emerald-100 border-emerald-200";
    if (score >= 60) return "from-yellow-50 to-yellow-100 border-yellow-200";
    return "from-red-50 to-red-100 border-red-200";
  };

  const getActiveTemplatesCount = (pkg: Package) => {
    return (
      pkg.templates?.filter((t) => t.status?.toLowerCase() === "active")
        .length || 0
    );
  };

  const getTotalSitesCount = (pkg: Package) => {
    return (
      pkg.templates?.reduce((total, template) => {
        return total + (template._count?.sitesAssets || 0);
      }, 0) || 0
    );
  };

  const getTotalTeamMembersCount = (pkg: Package) => {
    return (
      pkg.templates?.reduce((total, template) => {
        return total + (template._count?.templateTeamMembers || 0);
      }, 0) || 0
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Package Management
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your packages and track their performance
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Package
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-blue-200 rounded-full w-fit mx-auto mb-4">
              <PackageIcon className="w-8 h-8 text-blue-700" />
            </div>
            <div className="text-3xl font-bold text-blue-900 mb-2">
              {packageList.length}
            </div>
            <div className="text-sm text-blue-700 font-medium">
              Total Packages
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-green-200 rounded-full w-fit mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-700" />
            </div>
            <div className="text-3xl font-bold text-green-900 mb-2">
              {packageList.reduce(
                (total, pkg) => total + (pkg._count?.templates || 0),
                0
              )}
            </div>
            <div className="text-sm text-green-700 font-medium">
              Total Templates
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-purple-200 rounded-full w-fit mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-700" />
            </div>
            <div className="text-3xl font-bold text-purple-900 mb-2">
              {packageList.reduce(
                (total, pkg) => total + (pkg._count?.clients || 0),
                0
              )}
            </div>
            <div className="text-sm text-purple-700 font-medium">
              Total Clients
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-orange-200 rounded-full w-fit mx-auto mb-4">
              <Activity className="w-8 h-8 text-orange-700" />
            </div>
            <div className="text-3xl font-bold text-orange-900 mb-2">
              {packageList.reduce(
                (total, pkg) => total + getActiveTemplatesCount(pkg),
                0
              )}
            </div>
            <div className="text-sm text-orange-700 font-medium">
              Active Templates
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packageList.map((pkg) => {
          const healthScore = getPackageHealthScore(pkg);
          const activeSites = getTotalSitesCount(pkg);
          const teamMembers = getTotalTeamMembersCount(pkg);

          return (
            <Card
              key={pkg.id}
              className="group overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border-0 ring-1 ring-gray-200 hover:ring-blue-300 hover:scale-101"
            >
              {/* Header with Gradient */}
              <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 pb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-sm">
                        <PackageIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                          {pkg.name || `Package ${pkg.id.slice(0, 8)}`}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {pkg.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    {/* Health Score Badge */}
                    <div
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 bg-gradient-to-r",
                        getHealthBg(healthScore)
                      )}
                    >
                      <Star
                        className={cn("w-3 h-3", getHealthColor(healthScore))}
                      />
                      <span className={getHealthColor(healthScore)}>
                        {healthScore}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Description */}
                {pkg.description ? (
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {pkg.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No description provided
                  </p>
                )}

                {/* Main Statistics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-2">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {pkg._count?.templates || 0}
                    </div>
                    <div className="text-xs text-blue-700 font-medium">
                      Templates
                    </div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-2">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {pkg._count?.clients || 0}
                    </div>
                    <div className="text-xs text-green-700 font-medium">
                      Clients
                    </div>
                  </div>
                </div>

                {/* Detailed Statistics */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Detailed Stats
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                        <Activity className="w-3 h-3" />
                      </div>
                      <div className="text-lg font-bold text-purple-900">
                        {getActiveTemplatesCount(pkg)}
                      </div>
                      <div className="text-xs text-purple-700 font-medium">
                        Active
                      </div>
                    </div>

                    <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                        <Globe className="w-3 h-3" />
                      </div>
                      <div className="text-lg font-bold text-orange-900">
                        {activeSites}
                      </div>
                      <div className="text-xs text-orange-700 font-medium">
                        Sites
                      </div>
                    </div>

                    <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                      <div className="flex items-center justify-center gap-1 text-indigo-600 mb-1">
                        <Target className="w-3 h-3" />
                      </div>
                      <div className="text-lg font-bold text-indigo-900">
                        {teamMembers}
                      </div>
                      <div className="text-xs text-indigo-700 font-medium">
                        Team
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Metadata */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Created:{" "}
                        {pkg.createdAt
                          ? new Date(pkg.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Health: {getPackageHealthScore(pkg)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0 space-y-3">
                {/* Primary Action Buttons */}
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 border-blue-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 bg-transparent rounded-lg"
                    onClick={() => handleSeeTemplates(pkg)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Templates
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-green-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 transition-all duration-200 bg-transparent rounded-lg"
                    onClick={() => handleViewDetails(pkg.id)}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </div>

                {/* Management Buttons */}
                <div className="flex gap-2 w-full">
                  {hasPermissionClient(user?.permissions, "package_edit") && (
                    <Button
                      variant="outline"
                      className="flex-1 border-purple-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 transition-all duration-200 bg-transparent rounded-lg"
                      onClick={() => setEditingPackage(pkg)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {hasPermissionClient(user?.permissions, "package_delete") && (
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200 bg-transparent rounded-lg"
                      onClick={() => deletePackage(pkg.id)}
                      disabled={deletingId === pkg.id}
                    >
                      {deletingId === pkg.id ? (
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {packageList.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300 bg-white/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
              <PackageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              No packages yet
            </h3>
            <p className="text-gray-500 mb-8 max-w-md text-lg">
              Get started by creating your first package to organize your
              templates and clients.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Package
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <AddPackageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addPackage}
      />

      <AddPackageModal
        isOpen={!!editingPackage}
        onClose={() => setEditingPackage(null)}
        isEdit={true}
        initialData={editingPackage || undefined}
        onUpdate={updatePackage}
        onAdd={() => {}}
      />

      <PackageDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        packageId={selectedPackage || ""}
      />
    </div>
  );
}
