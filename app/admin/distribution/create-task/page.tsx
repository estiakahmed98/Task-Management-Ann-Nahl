"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  Target,
  Package,
  TrendingUp,
  Globe,
  Share2,
  Layers,
} from "lucide-react";
import { getInitialsFromName, nameToColor } from "@/utils/avatar";
import { cn } from "@/lib/utils";

/** ---------- Types (match API) ---------- */
type TaskStats = {
  categories: Record<string, { total: number; completed: number }>;
  assetTypes: Record<string, { total: number; completed: number }>;
  isReadyForTaskCreation: boolean;
  totalTasks: number;
  completedTasks: number;
  // createdTasks?: { id: string; name: string; status: string; dueDate: string | null; ... }[]  // only when includeTasks=true
};

type Client = {
  id: string;
  name?: string | null;
  company?: string | null;
  status?: string | null;
  package?: { name?: string } | null;
  avatar?: string | null;
  socialMedias?: any[];
  taskStats?: TaskStats;

  /** ✅ NEW: top-level flag from API */
  postingTasksCreated?: boolean;
  /** Optional helper count from API */
  existingPostingTasksCount?: number;
};

export default function ClientListingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // keep your path; this route is the one we updated above
      const res = await fetch("/api/tasks/clients", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data?.clients) ? data.clients : data || []);
      } else {
        setClients([]);
        toast.error("Failed to load clients");
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setClients([]);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const term = search.toLowerCase();
    return (
      (client.name ?? "").toLowerCase().includes(term) ||
      (client.company ?? "").toLowerCase().includes(term) ||
      client.id.toLowerCase().includes(term)
    );
  });

  const handleClientSelect = (clientId: string) => {
    router.push(`/admin/distribution/create-task/client/${clientId}`);
  };

  /** ---------- UI helpers ---------- */
  const getStatusBadge = (client: Client) => {
    const t = client.taskStats;

    // no tasks/requirements yet
    if (!t || t.totalTasks === 0) {
      return (
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-600 border-slate-300"
        >
          <Clock className="h-3 w-3 mr-1" />
          No Tasks
        </Badge>
      );
    }

    // ✅ all required assets complete AND tasks already created
    if (t.isReadyForTaskCreation && client.postingTasksCreated) {
      return (
        <Badge
          variant="outline"
          className="bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border-indigo-300 font-semibold"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Already Task is created
        </Badge>
      );
    }

    // assets complete but tasks not yet created
    if (t.isReadyForTaskCreation) {
      return (
        <Badge
          variant="outline"
          className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-300 font-semibold"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ready for Task Creation
        </Badge>
      );
    }

    return null;
  };

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType) {
      case "social_site":
        return <Share2 className="h-3 w-3" />;
      case "web2_site":
        return <Globe className="h-3 w-3" />;
      case "other_asset":
        return <Layers className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  const formatAssetTypeName = (assetType: string) => {
    switch (assetType) {
      case "social_site":
        return "Social Site";
      case "web2_site":
        return "Web2 Site";
      case "other_asset":
        return "Other Asset";
      default:
        return assetType
          .replace("_", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 overflow-hidden backdrop-blur-sm">
            <CardHeader className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white p-8">
              <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_0%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    Client Management Dashboard
                  </CardTitle>
                  <CardDescription className="text-indigo-100 text-lg">
                    Manage your clients and track asset completion progress.
                    Select a client to view details, create posting tasks when
                    ready—or jump to tasks if they’re already created.
                  </CardDescription>
                </div>
                <div className="hidden lg:flex items-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 shadow-lg flex items-center justify-center">
                    <TrendingUp className="h-10 w-10 text-white" />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {/* Search */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search clients by name, company, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-slate-300 bg-white shadow-sm text-base"
                />
              </div>

              {/* Client Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
                  <span className="ml-4 text-lg text-slate-600">
                    Loading clients...
                  </span>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 mx-auto mb-6 text-slate-400" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No clients found
                  </h3>
                  <p className="text-slate-600">
                    {search
                      ? "Try adjusting your search terms"
                      : "No clients available at the moment"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredClients.map((client) => {
                    const allRequiredAssetsDone =
                      client.taskStats?.isReadyForTaskCreation === true;
                    const alreadyCreated = client.postingTasksCreated === true;

                    return (
                      <Card
                        key={client.id}
                        className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-slate-200 hover:border-indigo-300 bg-gradient-to-br from-white to-slate-50/50 rounded-2xl overflow-hidden"
                        onClick={() => {
                          if (allRequiredAssetsDone && alreadyCreated) {
                            router.push(
                              `/admin/distribution/create-task/tasks?clientId=${client.id}`
                            );
                          } else {
                            handleClientSelect(client.id);
                          }
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar className="h-16 w-16 ring-4 ring-slate-200 group-hover:ring-indigo-300 transition-all duration-300 shadow-lg">
                              {client.avatar ? (
                                <AvatarImage
                                  src={client.avatar || "/placeholder.svg"}
                                  alt={client.name || "Client"}
                                />
                              ) : null}
                              <AvatarFallback
                                className="text-white font-bold text-lg"
                                style={{
                                  backgroundColor: nameToColor(
                                    client.name || client.id
                                  ),
                                }}
                              >
                                {getInitialsFromName(client.name || client.id)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <h3
                                className="font-bold text-lg text-slate-900 truncate mb-1"
                                title={client.name || "Unnamed Client"}
                              >
                                {client.name || "Unnamed Client"}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                                <Building2 className="h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {client.company || "No company"}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 font-mono truncate">
                                ID: {client.id}
                              </div>
                            </div>
                          </div>

                          {/* Status and Package Badges */}
                          <div className="space-y-3 mb-4">
                            {getStatusBadge(client)}

                            <div className="flex flex-wrap gap-2">
                              {client.status && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs font-medium",
                                    client.status === "active"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                                  )}
                                >
                                  {client.status}
                                </Badge>
                              )}
                              {client.package?.name && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  {client.package.name}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Progress & Asset Types */}
                          {client.taskStats && (
                            <div className="mb-4 space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="text-slate-600 font-medium">
                                    Required Assets
                                  </span>
                                  <span className="text-slate-900 font-semibold">
                                    {client.taskStats.completedTasks}/
                                    {client.taskStats.totalTasks}
                                  </span>
                                </div>

                                {/* Asset Type Badges */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {[
                                    "social_site",
                                    "web2_site",
                                    "other_asset",
                                  ].map((assetType) => {
                                    const stats =
                                      client.taskStats?.assetTypes[assetType];
                                    const isComplete =
                                      stats &&
                                      stats.total > 0 &&
                                      stats.completed === stats.total;
                                    const hasAssets = stats && stats.total > 0;

                                    return (
                                      <Badge
                                        key={assetType}
                                        variant="outline"
                                        className={cn(
                                          "text-xs font-medium",
                                          !hasAssets
                                            ? "bg-slate-50 text-slate-400 border-slate-200"
                                            : isComplete
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                        )}
                                      >
                                        {getAssetTypeIcon(assetType)}
                                        <span className="ml-1">
                                          {formatAssetTypeName(assetType)}
                                        </span>
                                        {hasAssets && (
                                          <span className="ml-1">
                                            ({stats!.completed}/{stats!.total})
                                          </span>
                                        )}
                                      </Badge>
                                    );
                                  })}
                                </div>

                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div
                                    className={cn(
                                      "h-2 rounded-full transition-all duration-300",
                                      client.taskStats.isReadyForTaskCreation
                                        ? "bg-gradient-to-r from-emerald-500 to-green-500"
                                        : "bg-gradient-to-r from-amber-500 to-orange-500"
                                    )}
                                    style={{
                                      width: `${
                                        client.taskStats.totalTasks > 0
                                          ? (client.taskStats.completedTasks /
                                              client.taskStats.totalTasks) *
                                            100
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                                <div className="text-xs text-slate-500 mt-1 text-right">
                                  {client.taskStats.totalTasks > 0
                                    ? Math.round(
                                        (client.taskStats.completedTasks /
                                          client.taskStats.totalTasks) *
                                          100
                                      )
                                    : 0}
                                  % Complete
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Button */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (allRequiredAssetsDone && alreadyCreated) {
                                router.push(
                                  `/admin/distribution/create-task/tasks?clientId=${client.id}`
                                );
                              } else {
                                handleClientSelect(client.id);
                              }
                            }}
                            className={cn(
                              "w-full h-11 rounded-xl font-semibold transition-all duration-300 group-hover:shadow-lg",
                              allRequiredAssetsDone && alreadyCreated
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                                : allRequiredAssetsDone
                                ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {allRequiredAssetsDone && alreadyCreated ? (
                                <>
                                  <Layers className="h-4 w-4" />
                                  Show Tasks
                                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                              ) : allRequiredAssetsDone ? (
                                <>
                                  <Target className="h-4 w-4" />
                                  Create Tasks
                                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                              ) : (
                                <>
                                  <Building2 className="h-4 w-4" />
                                  View Details
                                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                              )}
                            </div>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
