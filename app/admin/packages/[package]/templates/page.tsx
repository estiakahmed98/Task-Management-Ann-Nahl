// app/admin/packages/[package]/templates/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Edit3,
  Trash2,
  FileText,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  X,
  RotateCcw,
  Users,
  Globe,
  Share2,
  Eye,
  Sparkles,
  TrendingUp,
  Star,
  Activity,
  Target,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { hasPermissionClient } from "@/lib/permissions-client";
import { CreateTemplateModal } from "@/components/package/create-template-modal";
import { cn } from "@/lib/utils";
import { TemplateViewModal } from "@/components/package/Template-View-Modal";
import { AssignTemplateModal } from "@/components/package/assign-template-modal";

interface TemplateSiteAsset {
  id: number;
  type: "social_site" | "web2_site" | "other_asset";
  name: string;
  url?: string;
  description?: string;
  isRequired: boolean;
  defaultPostingFrequency?: number;
  defaultIdealDurationMinutes?: number;
}

interface TemplateTeamMember {
  agentId: string;
  role?: string;
  teamId?: string;
  assignedDate?: Date;
  agent: {
    id: string;
    name?: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

interface Template {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  packageId?: string;
  package?: {
    id: string;
    name: string;
  };
  sitesAssets?: TemplateSiteAsset[];
  templateTeamMembers?: TemplateTeamMember[];
  _count?: {
    sitesAssets: number;
    templateTeamMembers: number;
    assignments: number;
  };
}

type FilterStatus = "all" | "active" | "draft" | "inactive";

export default function TemplateListPage() {
  const { package: slug } = useParams();
  const packageId = String(slug).replace("id-", "");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [packageName, setPackageName] = useState<string>("");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPackageId, setCurrentPackageId] = useState<string>("");
  const { user } = useAuth();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [assigningTemplate, setAssigningTemplate] = useState<Template | null>(
    null
  );

  const fetchPackageName = async (pkgId: string) => {
    try {
      const res = await fetch(`/api/zisanpackages/${pkgId}`);
      if (!res.ok) {
        throw new Error("Package not found");
      }
      const packageData = await res.json();
      setPackageName(packageData.name || "Unnamed Package");
    } catch (error) {
      console.error("Error loading package name:", error);
      setPackageName("Package Not Found");
    }
  };

  const fetchTemplates = async (pkgId: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/zisanpackages/${pkgId}/templates?include=full`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await res.json();

      // Additional frontend filtering to ensure data isolation
      const filteredData = data.filter((template: Template) => {
        return template.packageId === pkgId || template.package?.id === pkgId;
      });
      setTemplates(filteredData);
    } catch (error) {
      console.error("Error loading templates:", error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle package changes
  useEffect(() => {
    if (packageId && packageId !== currentPackageId) {
      // Clear previous data when switching packages
      setTemplates([]);
      setPackageName("");
      setSearchQuery("");
      setStatusFilter("all");
      setEditingTemplate(null);
      setViewingTemplate(null);
      setCurrentPackageId(packageId);
      // Fetch new data
      fetchPackageName(packageId);
      fetchTemplates(packageId);
    }
  }, [packageId, currentPackageId]);

  // Filtered and searched templates with additional packageId validation
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter((template) => {
      // Ensure template belongs to current package
      return (
        template.packageId === packageId || template.package?.id === packageId
      );
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          (template.description &&
            template.description.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (template) => template.status?.toLowerCase() === statusFilter
      );
    }

    return filtered;
  }, [templates, searchQuery, statusFilter, packageId]);

  const reloadTemplates = () => {
    if (packageId) {
      fetchTemplates(packageId);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    const confirmed = confirm(
      "Are you sure you want to delete this template? This will also delete all associated sites/assets and team members."
    );
    if (!confirmed) return;

    setDeletingId(templateId);
    try {
      const res = await fetch(
        `/api/templates/${templateId}?actorId=${user?.id ?? ""}`,
        {
          method: "DELETE",
          headers: {
            "x-actor-id": user?.id ?? "", // ✅ audit log-এর জন্য actor পাঠাচ্ছি
          },
        }
      );

      if (res.ok) {
        reloadTemplates();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to delete template");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    if (statusLower === "active") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else if (statusLower === "draft") {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200">
          <Clock className="w-3 h-3 mr-1" />
          Draft
        </Badge>
      );
    } else if (statusLower === "inactive") {
      return (
        <Badge
          variant="outline"
          className="bg-slate-100 text-slate-600 border-slate-200"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getFilterButtonClass = (filter: FilterStatus) => {
    const baseClass =
      "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105";
    if (statusFilter === filter) {
      return `${baseClass} bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg`;
    }
    return `${baseClass} bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md`;
  };

  const hasActiveFilters = searchQuery.trim() || statusFilter !== "all";

  // Get templates count for current package only
  const currentPackageTemplates = templates.filter((template) => {
    return (
      template.packageId === packageId || template.package?.id === packageId
    );
  });

  // Get site statistics for a template
  const getTemplateStats = (template: Template) => {
    const socialSites =
      template.sitesAssets?.filter((site) => site.type === "social_site")
        .length || 0;
    const web2Sites =
      template.sitesAssets?.filter((site) => site.type === "web2_site")
        .length || 0;
    const otherAssets =
      template.sitesAssets?.filter((site) => site.type === "other_asset")
        .length || 0;

    return { socialSites, web2Sites, otherAssets };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-10 w-40" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-5 w-16" />
                </CardContent>
                <CardFooter className="pt-4">
                  <div className="flex gap-2 w-full">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if package not found
  if (packageName === "Package Not Found") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6 max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Package Not Found
              </h3>
              <p className="text-red-700 mb-6 max-w-sm">
                The package you're looking for doesn't exist or you don't have
                access to it.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Templates
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Managing templates for{" "}
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {packageName}
                </span>
                <span className="text-sm text-gray-400 ml-2">
                  (ID: {packageId})
                </span>
              </p>
            </div>
          </div>

          {/* Search and Filter Section */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search templates by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-12 h-12 text-base border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 mr-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">
                      Filter:
                    </span>
                  </div>
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={getFilterButtonClass("all")}
                  >
                    All ({currentPackageTemplates.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("active")}
                    className={getFilterButtonClass("active")}
                  >
                    Active (
                    {
                      currentPackageTemplates.filter(
                        (t) => t.status?.toLowerCase() === "active"
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setStatusFilter("draft")}
                    className={getFilterButtonClass("draft")}
                  >
                    Draft (
                    {
                      currentPackageTemplates.filter(
                        (t) => t.status?.toLowerCase() === "draft"
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setStatusFilter("inactive")}
                    className={getFilterButtonClass("inactive")}
                  >
                    Inactive (
                    {
                      currentPackageTemplates.filter(
                        (t) => t.status?.toLowerCase() === "inactive"
                      ).length
                    }
                    )
                  </button>
                </div>
              </div>

              {/* Active Filters & Results Count */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Showing{" "}
                    <span className="font-bold text-blue-600">
                      {filteredTemplates.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-gray-900">
                      {currentPackageTemplates.length}
                    </span>{" "}
                    templates
                  </span>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="text-gray-600 border-gray-300 hover:bg-gray-50 bg-transparent rounded-lg"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300 bg-white/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                {hasActiveFilters ? (
                  <Search className="w-12 h-12 text-gray-400" />
                ) : (
                  <FileText className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {hasActiveFilters ? "No templates found" : "No templates yet"}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md text-lg">
                {hasActiveFilters
                  ? "Try adjusting your search or filter criteria to find what you're looking for."
                  : "Get started by creating your first template for this package."}
              </p>
              {hasActiveFilters ? (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="lg"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent rounded-xl px-8"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              ) : (
                hasPermissionClient(user?.permissions, "template_edit") && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((template) => {
              const stats = getTemplateStats(template);
              return (
                <Card
                  key={template.id}
                  className="group overflow-hidden bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 border-0 ring-1 ring-gray-200 hover:ring-blue-300 hover:scale-101"
                >
                  <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 pb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-sm">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg leading-tight">
                              {template.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Template ID: {template.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(template.status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-5">
                    {template.description ? (
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {template.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No description provided
                      </p>
                    )}

                    {/* Detailed Site Statistics */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Site Breakdown
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                            <Share2 className="w-3 h-3" />
                          </div>
                          <div className="text-lg font-bold text-blue-900">
                            {stats.socialSites}
                          </div>
                          <div className="text-xs text-blue-700 font-medium">
                            Social
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                            <Globe className="w-3 h-3" />
                          </div>
                          <div className="text-lg font-bold text-green-900">
                            {stats.web2Sites}
                          </div>
                          <div className="text-xs text-green-700 font-medium">
                            Web 2.0
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                            <FileText className="w-3 h-3" />
                          </div>
                          <div className="text-lg font-bold text-purple-900">
                            {stats.otherAssets}
                          </div>
                          <div className="text-xs text-purple-700 font-medium">
                            Other
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team & Assignment Stats */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-orange-100 rounded-md">
                          <Users className="w-3 h-3 text-orange-600" />
                        </div>
                        <span className="text-gray-600">Team:</span>
                        <span className="font-semibold text-orange-600">
                          {template._count?.templateTeamMembers || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-indigo-100 rounded-md">
                          <Activity className="w-3 h-3 text-indigo-600" />
                        </div>
                        <span className="text-gray-600">Tasks:</span>
                        <span className="font-semibold text-indigo-600">
                          {template._count?.assignments || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    <div className="flex gap-2 w-full">
                      {/* View Button */}
                      <Button
                        variant="outline"
                        className="flex-1 border-blue-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 bg-transparent rounded-lg"
                        onClick={() => setViewingTemplate(template)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>

                      {hasPermissionClient(
                        user?.permissions,
                        "template_edit"
                      ) && (
                        <Button
                          variant="outline"
                          className="flex-1 border-green-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 transition-all duration-200 bg-transparent rounded-lg"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}

                      {hasPermissionClient(
                        user?.permissions,
                        "template_delete"
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200 bg-transparent rounded-lg px-3"
                          onClick={() => deleteTemplate(template.id)}
                          disabled={deletingId === template.id}
                        >
                          {deletingId === template.id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 bg-transparent rounded-lg px-3"
                        onClick={() => setAssigningTemplate(template)}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modals */}
        <CreateTemplateModal
          isOpen={isCreateModalOpen || !!editingTemplate}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTemplate(null);
          }}
          packageId={packageId}
          onCreated={reloadTemplates}
          initialData={editingTemplate}
          isEditMode={!!editingTemplate}
        />

        <TemplateViewModal
          isOpen={!!viewingTemplate}
          onClose={() => setViewingTemplate(null)}
          template={viewingTemplate}
        />

        <AssignTemplateModal
          isOpen={!!assigningTemplate}
          onClose={() => setAssigningTemplate(null)}
          templateId={assigningTemplate?.id || ""}
          templateName={assigningTemplate?.name || ""}
          packageId={assigningTemplate?.packageId || ""}
          onAssignComplete={(clientId) => {
            setAssigningTemplate(null);
            reloadTemplates(); // optional refresh
          }}
        />
      </div>
    </div>
  );
}
