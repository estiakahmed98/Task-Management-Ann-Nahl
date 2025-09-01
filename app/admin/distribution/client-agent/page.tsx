"use client";

import { useEffect, useState } from "react";
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
import {
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  Package,
  TrendingUp,
  Globe,
  Share2,
  Layers,
  ListChecks,
  FileText,
  Bookmark,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitialsFromName, nameToColor } from "@/utils/avatar";
import { toast } from "sonner";

/** ---------- Types (match /api/tasks/clients) ---------- */
type TaskStats = {
  categories: Record<string, { total: number; completed: number }>;
  assetTypes: Record<string, { total: number; completed: number }>;
  isReadyForTaskCreation: boolean;
  totalTasks: number;
  completedTasks: number;

  posting?: {
    categories: Record<string, { total: number; completed: number }>;
    totalPostingTasks: number;
    completedPostingTasks: number;
    isAllPostingCompleted: boolean;
  };
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

  postingTasksCreated?: boolean;
  existingPostingTasksCount?: number;
};

export default function ClientUnifiedDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/tasks/clients", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load clients");
        const data = await res.json();
        setClients(Array.isArray(data?.clients) ? data.clients : []);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "Failed to load clients");
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filtered = clients.filter((c) => {
    const t = search.toLowerCase();
    return (
      (c.name ?? "").toLowerCase().includes(t) ||
      (c.company ?? "").toLowerCase().includes(t) ||
      c.id.toLowerCase().includes(t)
    );
  });

  /** ---------- Routes ---------- */
  const openDistribution = (clientId: string) => {
    router.push(`/admin/distribution/client-agent/${clientId}`);
  };

  const conditionalRouteAndLabel = (client: Client) => {
    const ready = client.taskStats?.isReadyForTaskCreation === true;
    const already = client.postingTasksCreated === true;

    if (ready && already) {
      return {
        label: "Show Tasks",
        icon: <Layers className="h-4 w-4" />,
        go: () =>
          router.push(
            `/admin/distribution/client-agent/tasks?clientId=${client.id}`
          ),
        klass:
          "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
      };
    }
    if (ready) {
      return {
        label: "Create Tasks",
        icon: <Target className="h-4 w-4" />,
        go: () =>
          router.push(`/admin/distribution/client-agent/client/${client.id}`),
        klass:
          "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white",
      };
    }
    // not ready → view details (same as second component)
    return {
      label: "View Details",
      icon: <Building2 className="h-4 w-4" />,
      go: () =>
        router.push(`/admin/distribution/client-agent/client/${client.id}`),
      klass:
        "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white",
    };
  };

  /** ---------- UI helpers ---------- */
  const getStatusBadge = (client: Client) => {
    const t = client.taskStats;
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

    if (t.isReadyForTaskCreation && client.postingTasksCreated) {
      return (
        <Badge
          variant="outline"
          className="bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border-indigo-300 font-semibold"
          title={`Posting tasks created: ${
            client.existingPostingTasksCount ?? 0
          }`}
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Already Task is created
        </Badge>
      );
    }

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

  const fmtAssetType = (assetType: string) => {
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

  const getPostingCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Social Activity":
        return <Share2 className="h-3 w-3" />;
      case "Blog Posting":
        return <FileText className="h-3 w-3" />;
      default:
        return <Bookmark className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto p-6 lg:p-8">
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 overflow-hidden backdrop-blur-sm">
          <CardHeader className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white px-8 py-4">
            <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_0%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Client to Agent Task Flow
                </CardTitle>
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
            ) : filtered.length === 0 ? (
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
                {filtered.map((client) => {
                  const t = client.taskStats;
                  const postingCreated = client.postingTasksCreated;
                  const conditional = conditionalRouteAndLabel(client);

                  return (
                    <Card
                      key={client.id}
                      className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-slate-200 hover:border-indigo-300 bg-gradient-to-br from-white to-slate-50/50 rounded-2xl overflow-hidden"
                      // কার্ড ক্লিক করলে কিছু হবে না—নিচের দুই বোতামই ব্যবহার করুন
                    >
                      <CardContent className="p-6">
                        {/* Identity */}
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

                        {/* Status & Package */}
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
                                    : client.status === "qc_approved"
                                    ? "bg-teal-50 text-teal-700 border-teal-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                )}
                                title={client.status === "qc_approved" ? "QC Approved" : "Client status"}
                              >
                                {client.status === "qc_approved" ? (
                                  <span className="flex items-center gap-1">
                                    <span className="font-bold">10/10</span>
                                    <span>(1-10)</span>
                                  </span>
                                ) : (
                                  client.status
                                )}
                              </Badge>
                            )}

                            {client.package?.name && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
                                title="Client package"
                              >
                                <Package className="h-3 w-3 mr-1" />
                                {client.package.name}
                              </Badge>
                            )}

                            {typeof client.existingPostingTasksCount ===
                              "number" && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  postingCreated
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                )}
                                title="Posting tasks created count"
                              >
                                <ListChecks className="h-3 w-3 mr-1" />
                                {client.existingPostingTasksCount} Posting Task
                                {client.existingPostingTasksCount === 1
                                  ? ""
                                  : "s"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Required Assets */}
                        {t && (
                          <div className="mb-4 space-y-3">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-slate-600 font-medium">
                                  Required Assets
                                </span>
                                <span className="text-slate-900 font-semibold">
                                  {t.completedTasks}/{t.totalTasks}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1 mb-2">
                                {[
                                  "social_site",
                                  "web2_site",
                                  "other_asset",
                                ].map((assetType) => {
                                  const stats = t.assetTypes[assetType];
                                  const has = !!stats && stats.total > 0;
                                  const complete =
                                    has && stats.completed === stats.total;

                                  return (
                                    <Badge
                                      key={assetType}
                                      variant="outline"
                                      className={cn(
                                        "text-xs font-medium",
                                        !has
                                          ? "bg-slate-50 text-slate-400 border-slate-200"
                                          : complete
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                      )}
                                    >
                                      {getAssetTypeIcon(assetType)}
                                      <span className="ml-1">
                                        {fmtAssetType(assetType)}
                                      </span>
                                      {has && (
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
                                    t.isReadyForTaskCreation
                                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                                      : "bg-gradient-to-r from-amber-500 to-orange-500"
                                  )}
                                  style={{
                                    width: `${
                                      t.totalTasks > 0
                                        ? (t.completedTasks / t.totalTasks) *
                                          100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                              <div className="text-xs text-slate-500 mt-1 text-right">
                                {t.totalTasks > 0
                                  ? Math.round(
                                      (t.completedTasks / t.totalTasks) * 100
                                    )
                                  : 0}
                                % Complete
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Posting Tasks */}
                        {t?.posting && (
                          <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-slate-600 font-medium">
                                Posting Tasks
                              </span>
                              <span className="text-slate-900 font-semibold">
                                {t.posting.completedPostingTasks}/
                                {t.posting.totalPostingTasks}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {["Social Activity", "Blog Posting"].map(
                                (cat) => {
                                  const stats = t.posting!.categories[cat];
                                  const has = !!stats && stats.total > 0;
                                  const complete =
                                    has && stats.completed === stats.total;
                                  return (
                                    <Badge
                                      key={cat}
                                      variant="outline"
                                      className={cn(
                                        "text-xs font-medium",
                                        !has
                                          ? "bg-slate-50 text-slate-400 border-slate-200"
                                          : complete
                                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                      )}
                                    >
                                      {getPostingCategoryIcon(cat)}
                                      <span className="ml-1">{cat}</span>
                                      {has && (
                                        <span className="ml-1">
                                          ({stats!.completed}/{stats!.total})
                                        </span>
                                      )}
                                    </Badge>
                                  );
                                }
                              )}
                            </div>

                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className={cn(
                                  "h-2 rounded-full transition-all duration-300",
                                  t.posting.isAllPostingCompleted
                                    ? "bg-gradient-to-r from-indigo-500 to-blue-500"
                                    : "bg-gradient-to-r from-blue-500 to-sky-500"
                                )}
                                style={{
                                  width: `${
                                    t.posting.totalPostingTasks > 0
                                      ? (t.posting.completedPostingTasks /
                                          t.posting.totalPostingTasks) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <div className="text-xs text-slate-500 mt-1 text-right">
                              {t.posting.totalPostingTasks > 0
                                ? Math.round(
                                    (t.posting.completedPostingTasks /
                                      t.posting.totalPostingTasks) *
                                      100
                                  )
                                : 0}
                              % Complete
                            </div>
                          </div>
                        )}

                        {/* Buttons: 1) Open Distribution, 2) Conditional */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDistribution(client.id);
                            }}
                            className="h-11 flex-1 rounded-xl border-slate-300 hover:border-indigo-300 hover:text-indigo-700"
                            title="Open classic distribution"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Open Distribution
                          </Button>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              conditional.go();
                            }}
                            className={cn(
                              "h-11 flex-1 rounded-xl font-semibold transition-all duration-300 group-hover:shadow-lg",
                              conditional.klass
                            )}
                            title="Proceed (condition wise)"
                          >
                            <div className="flex items-center gap-2">
                              {conditional.icon}
                              {conditional.label}
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </Button>
                        </div>
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
  );
}
