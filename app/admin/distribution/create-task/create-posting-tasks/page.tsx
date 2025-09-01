"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Repeat,
  Users,
  Building2,
  CheckCircle2,
  ListChecks,
  CalendarDays,
  Timer,
  Tag,
  Link2,
  User2,
  LayoutList,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import { ClientSelectModal } from "@/components/task-distribution/ClientSelectModal";
import { getInitialsFromName, nameToColor } from "@/utils/avatar";
import { cn } from "@/lib/utils";

export type CreatedTask = {
  id: string;
  name: string;
  status?: string | null;
  priority?: string | null;
  createdAt?: string | null;
  dueDate?: string | null;
  idealDurationMinutes?: number | null;
  completionLink?: string | null;
  assignedTo?: {
    id: string;
    name?: string | null;
    image?: string | null;
    role?: { name?: string | null } | null;
  } | null;
  category?: { id: string; name?: string | null } | null;
  templateSiteAsset?: {
    id: number;
    name?: string | null;
    type?: string | null;
  } | null;
  assignment?: { id: string } | null;
};

type Template = { id: string; name: string };

type Client = {
  id: string;
  name?: string;
  company?: string;
  status?: string;
  package?: { name?: string } | null;
  avatar?: string | null;
};

type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "cancelled"
  | "reassigned"
  | "qc_approved";

type SourcePreview = {
  id: string;
  name: string;
  baseName: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "urgent";
  assetType?: "social_site" | "web2_site" | "other_asset";
  frequency: number;
  categoryName: string; // Social Activity | Blog Posting
};

type CountsByStatus = Record<TaskStatus, number>;

const toTitle = (s?: string | null) =>
  (s ?? "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\w/g, (m) => m.toUpperCase());

const statusTone: Record<string, string> = {
  pending:
    "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border-amber-300 shadow-sm",
  in_progress:
    "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 border-blue-300 shadow-sm",
  completed:
    "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border-emerald-300 shadow-sm",
  overdue:
    "bg-gradient-to-r from-rose-50 to-red-50 text-rose-800 border-rose-300 shadow-sm",
  cancelled:
    "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-300 shadow-sm",
  reassigned:
    "bg-gradient-to-r from-purple-50 to-violet-50 text-purple-800 border-purple-300 shadow-sm",
  qc_approved:
    "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-800 border-teal-300 shadow-sm",
};

const priorityTone: Record<string, string> = {
  low: "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-300",
  medium:
    "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border-indigo-300",
  high: "bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-300",
  urgent: "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300",
};

const typeLabel: Record<string, string> = {
  social_site: "Social Media",
  web2_site: "Web 2.0 Site",
  other_asset: "Other Asset",
};

const typeColors: Record<string, string> = {
  social_site:
    "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border-pink-300",
  web2_site:
    "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border-cyan-300",
  other_asset:
    "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 border-violet-300",
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50/50 rounded-lg px-3 py-2">
      <Icon className="h-4 w-4 text-slate-500" />
      <span className="font-medium text-slate-700">{label}:</span>
      <span className="truncate font-medium text-slate-900" title={value}>
        {value}
      </span>
    </div>
  );
}

function TaskListCard({ task }: { task: CreatedTask }) {
  const createdAt = task.createdAt ? new Date(task.createdAt) : null;
  const dueAt = task.dueDate ? new Date(task.dueDate) : null;

  const sKey = (task.status ?? "").toLowerCase();
  const pKey = (task.priority ?? "").toLowerCase();

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return `${date.toLocaleDateString()} (${Math.abs(
        diffDays
      )} days overdue)`;
    } else if (diffDays === 0) {
      return `${date.toLocaleDateString()} (Due today)`;
    } else if (diffDays <= 7) {
      return `${date.toLocaleDateString()} (${diffDays} days left)`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDueDateStyle = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return "text-red-700 bg-red-50 border-red-200";
    } else if (diffDays <= 3) {
      return "text-amber-700 bg-amber-50 border-amber-200";
    } else {
      return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  return (
    <Card className="border-slate-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:block">
            <Avatar className="h-12 w-12 ring-2 ring-slate-200 shadow-md">
              {task.assignedTo?.image ? (
                <AvatarImage
                  src={task.assignedTo.image || "/placeholder.svg"}
                  alt={task.assignedTo?.name ?? "Agent"}
                />
              ) : (
                <AvatarFallback
                  className="text-sm font-bold"
                  style={{
                    backgroundColor: nameToColor(
                      task.assignedTo?.name ?? task.name ?? "?"
                    ),
                  }}
                >
                  {getInitialsFromName(
                    task.assignedTo?.name ?? task.name ?? "?"
                  )}
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h4
                className="text-sm sm:text-base font-bold text-slate-900 truncate"
                title={task.name}
              >
                {task.name}
              </h4>
              {task.templateSiteAsset?.type && (
                <Badge
                  variant="outline"
                  className={cn(
                    "h-7 rounded-full border font-medium",
                    typeColors[task.templateSiteAsset.type] ??
                      "bg-slate-50 text-slate-700 border-slate-200"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  {typeLabel[task.templateSiteAsset.type] ??
                    toTitle(task.templateSiteAsset.type)}
                </Badge>
              )}
              {task.category?.name && (
                <Badge
                  variant="outline"
                  className="h-7 rounded-full border bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 font-medium"
                >
                  <Tag className="h-3.5 w-3.5 mr-1" /> {task.category.name}
                </Badge>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <InfoRow
                icon={CalendarDays}
                label="Created"
                value={createdAt ? createdAt.toLocaleString() : undefined}
              />
              <InfoRow
                icon={Timer}
                label="Duration"
                value={
                  task.idealDurationMinutes
                    ? `${task.idealDurationMinutes} min`
                    : undefined
                }
              />
              {dueAt && (
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm rounded-lg px-3 py-2 border",
                    getDueDateStyle(dueAt)
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-medium">Due Date:</span>
                  <span
                    className="truncate font-medium"
                    title={formatDueDate(dueAt)}
                  >
                    {formatDueDate(dueAt)}
                  </span>
                </div>
              )}
              <InfoRow
                icon={User2}
                label="Assignee"
                value={task.assignedTo?.name ?? undefined}
              />
              <InfoRow
                icon={Link2}
                label="Completion Link"
                value={task.completionLink ?? undefined}
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            {task.status && (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  statusTone[sKey] ??
                    "bg-slate-50 text-slate-700 border-slate-200"
                )}
                title={toTitle(task.status)}
              >
                {toTitle(task.status)}
              </Badge>
            )}
            {task.priority && (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  priorityTone[pKey] ??
                    "bg-slate-50 text-slate-700 border-slate-200"
                )}
                title={toTitle(task.priority)}
              >
                <Target className="h-3 w-3 mr-1" />
                {toTitle(task.priority)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CreatePostingTasksPage() {
  const searchParams = useSearchParams();
  const preSelectedClientId = searchParams.get("clientId");

  const [selectedClientId, setSelectedClientId] = useState<string>(
    preSelectedClientId || ""
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<string>("auto");

  // UI enums (server ignores status; keeps priority override optional)
  const [status] = useState<"PENDING" | "IN_PROGRESS" | "HOLD" | "DONE">(
    "PENDING"
  );
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");

  const [creating, setCreating] = useState(false);
  const [createdCount, setCreatedCount] = useState<number | null>(null);
  const [createdTasks, setCreatedTasks] = useState<CreatedTask[]>([]);
  const [search, setSearch] = useState("");

  const [existingTasks, setExistingTasks] = useState<CreatedTask[]>([]);
  const [loadingExistingTasks, setLoadingExistingTasks] = useState(false);

  // ---------- NEW: preview state ----------
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<{
    tasks: SourcePreview[];
    countsByStatus: CountsByStatus;
    allApproved: boolean;
    totalWillCreate: number;
  }>({
    tasks: [],
    countsByStatus: {
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      cancelled: 0,
      reassigned: 0,
      qc_approved: 0,
    },
    allApproved: false,
    totalWillCreate: 0,
  });

  const [clientModalOpen, setClientModalOpen] = useState(false);

  const fetchExistingTasks = async () => {
    if (!selectedClientId) return;
    setLoadingExistingTasks(true);
    try {
      const res = await fetch(
        `/api/tasks?clientId=${selectedClientId}&categories=Social Activity,Blog Posting`,
        {
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = await res.json();
        setExistingTasks(Array.isArray(data?.tasks) ? data.tasks : []);
      } else {
        setExistingTasks([]);
      }
    } catch (e: any) {
      console.error("Failed to fetch existing tasks:", e);
      setExistingTasks([]);
    } finally {
      setLoadingExistingTasks(false);
    }
  };

  const fetchPreview = async () => {
    if (!selectedClientId) return;
    setPreviewLoading(true);
    try {
      const params = new URLSearchParams({ clientId: selectedClientId });
      // only pass templateId if not "auto"
      if (templateId && templateId !== "auto")
        params.set("templateId", templateId);
      const res = await fetch(
        `/api/tasks/create-posting-tasks?${params.toString()}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.message || "Failed to load preview");
        return;
      }
      setPreview({
        tasks: json.tasks || [],
        countsByStatus: json.countsByStatus || preview.countsByStatus,
        allApproved: !!json.allApproved,
        totalWillCreate: json.totalWillCreate ?? 0,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Fetch client + templates
  useEffect(() => {
    if (!selectedClientId) {
      setSelectedClient(null);
      setTemplates([]);
      setTemplateId("auto");
      setCreatedCount(null);
      setCreatedTasks([]);
      setExistingTasks([]);
      setPreview({
        tasks: [],
        countsByStatus: {
          pending: 0,
          in_progress: 0,
          completed: 0,
          overdue: 0,
          cancelled: 0,
          reassigned: 0,
          qc_approved: 0,
        },
        allApproved: false,
        totalWillCreate: 0,
      });
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/clients/${selectedClientId}`, {
          cache: "no-store",
        });
        const client = (await res.json()) as Client;
        setSelectedClient(client);
      } catch {
        toast.error("Failed to load client details");
      }
    })();
    (async () => {
      try {
        const res = await fetch(`/api/templates`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as Template[];
          setTemplates(data ?? []);
        } else {
          setTemplates([]);
        }
      } catch {
        setTemplates([]);
      }
    })();

    fetchExistingTasks();
  }, [selectedClientId]);

  // Fetch preview when client or template changes
  useEffect(() => {
    if (selectedClientId) fetchPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, templateId]);

  const filteredCreatedTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return createdTasks;
    return createdTasks.filter((t) =>
      [t.name, t.category?.name, t.templateSiteAsset?.name, t.assignedTo?.name]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(q))
    );
  }, [createdTasks, search]);

  const hasExistingPostingTasks = existingTasks.length > 0;
  const canCreateTasks =
    preview.allApproved && preview.tasks.length > 0 && !hasExistingPostingTasks;

  // ---------- Create handler with QC gate ----------
  const handleCreate = async () => {
    if (!selectedClientId) {
      toast.warning("Please select a client first.");
      return;
    }
    // client-side gate
    if (!preview.allApproved) {
      toast.warning("Please complete & QC-approve all source tasks first.");
      return;
    }

    if (hasExistingPostingTasks) {
      toast.warning(
        "Posting tasks already exist for this client. Cannot create duplicates."
      );
      return;
    }

    setCreating(true);
    setCreatedCount(null);
    setCreatedTasks([]);

    try {
      const body: any = {
        clientId: selectedClientId,
        // priority override optional
        priority,
      };
      if (templateId !== "auto") body.templateId = templateId;

      const res = await fetch("/api/tasks/create-posting-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        // server also gates and returns countsByStatus
        toast.error(json?.message || "Failed to create posting tasks");
        if (json?.countsByStatus) {
          const c = json.countsByStatus;
          toast.message("Current status", {
            description: `qc_approved: ${c.qc_approved}, pending: ${c.pending}, in_progress: ${c.in_progress}, completed: ${c.completed}`,
          });
        }
        return;
      }

      const tasksRaw = Array.isArray(json?.tasks) ? json.tasks : [];
      setCreatedTasks(tasksRaw);
      setCreatedCount(tasksRaw.length);

      toast.success(json?.message || `Created ${tasksRaw.length} task(s).`);
      // refresh preview (copies now exist -> frequency names may de-dup)
      fetchPreview();
      fetchExistingTasks();
    } catch (err: any) {
      toast.error("Task creation failed", {
        description: err?.message ?? "Unknown error",
      });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (preSelectedClientId && preSelectedClientId !== selectedClientId) {
      setSelectedClientId(preSelectedClientId);
    }
  }, [preSelectedClientId, selectedClientId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto p-6 lg:p-8">
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 overflow-hidden backdrop-blur-sm">
          <CardHeader className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white p-8 rounded-t-xl">
            <div className="absolute inset-0 bg-[radial-gradient(1200px_400px_at_0%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Repeat className="h-6 w-6 text-white" />
                  </div>
                  Create Posting Tasks
                </CardTitle>
                <CardDescription className="text-indigo-100 text-lg">
                  Generate frequency-based tasks for{" "}
                  <span className="font-semibold text-white">social media</span>
                  ,{" "}
                  <span className="font-semibold text-white">
                    web 2.0 sites
                  </span>
                  , and{" "}
                  <span className="font-semibold text-white">other assets</span>
                </CardDescription>
              </div>
              <div className="hidden lg:flex items-center">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 shadow-lg flex items-center justify-center">
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 lg:p-10 space-y-10">
            {/* CLIENT PICKER */}
            {!preSelectedClientId && (
              <section className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-2xl border border-slate-200">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                      <Users className="h-6 w-6 text-indigo-600" />
                      Client Selection
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Choose the client for whom you want to generate posting
                      tasks.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    className="inline-flex items-center gap-3 rounded-xl px-6 py-3 text-sm font-semibold shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:from-indigo-800 active:to-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-all duration-200"
                    onClick={() => setClientModalOpen(true)}
                  >
                    <Users className="h-5 w-5" />
                    <span>Select Client</span>
                  </Button>
                </div>

                {selectedClient && (
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl shadow-lg">
                    <Avatar className="h-20 w-20 ring-4 ring-indigo-500/20 shadow-lg">
                      {selectedClient.avatar ? (
                        <AvatarImage
                          src={selectedClient.avatar || "/placeholder.svg"}
                          alt={selectedClient.name || "Client avatar"}
                        />
                      ) : null}
                      <AvatarFallback
                        className="text-white text-2xl font-bold"
                        style={{
                          backgroundColor: nameToColor(
                            selectedClient.name || ""
                          ),
                        }}
                      >
                        {getInitialsFromName(selectedClient.name || "")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-900 truncate">
                          {selectedClient.name || "Unnamed Client"}
                        </h2>
                      </div>
                      <p className="mt-1 text-base text-slate-600 flex items-center gap-2">
                        <Building2 className="inline-block h-5 w-5 text-slate-500" />
                        {selectedClient.company || "N/A"}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-4">
                        {selectedClient.status && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "border px-3 py-1.5 rounded-full text-sm font-medium",
                              selectedClient.status === "active"
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300"
                                : "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-300"
                            )}
                          >
                            {selectedClient.status}
                          </Badge>
                        )}
                        {selectedClient.package?.name && (
                          <Badge
                            variant="secondary"
                            className="rounded-full text-sm bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-800 px-3 py-1.5 font-medium"
                          >
                            📦 {selectedClient.package.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <ClientSelectModal
                  isOpen={clientModalOpen}
                  onClose={() => setClientModalOpen(false)}
                  onSelect={async (clientId) => {
                    setSelectedClientId(clientId);
                    const res = await fetch(`/api/clients/${clientId}`, {
                      cache: "no-store",
                    });
                    const data = (await res.json()) as Client;
                    setSelectedClient(data);
                  }}
                />
              </section>
            )}

            {/* Show selected client info even when pre-selected */}
            {selectedClient && (
              <section className="space-y-6">
                <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl shadow-lg">
                  <Avatar className="h-20 w-20 ring-4 ring-indigo-500/20 shadow-lg">
                    {selectedClient.avatar ? (
                      <AvatarImage
                        src={selectedClient.avatar || "/placeholder.svg"}
                        alt={selectedClient.name || "Client avatar"}
                      />
                    ) : null}
                    <AvatarFallback
                      className="text-white text-2xl font-bold"
                      style={{
                        backgroundColor: nameToColor(selectedClient.name || ""),
                      }}
                    >
                      {getInitialsFromName(selectedClient.name || "")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-900 truncate">
                        {selectedClient.name || "Unnamed Client"}
                      </h2>
                    </div>
                    <p className="mt-1 text-base text-slate-600 flex items-center gap-2">
                      <Building2 className="inline-block h-5 w-5 text-slate-500" />
                      {selectedClient.company || "N/A"}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {selectedClient.status && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "border px-3 py-1.5 rounded-full text-sm font-medium",
                            selectedClient.status === "active"
                              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300"
                              : "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-300"
                          )}
                        >
                          {selectedClient.status}
                        </Badge>
                      )}
                      {selectedClient.package?.name && (
                        <Badge
                          variant="secondary"
                          className="rounded-full text-sm bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-800 px-3 py-1.5 font-medium"
                        >
                          📦 {selectedClient.package.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {selectedClientId && existingTasks.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-900">
                        Existing Posting Tasks Found
                      </h3>
                      <p className="text-sm text-amber-700">
                        This client already has {existingTasks.length} posting
                        task
                        {existingTasks.length === 1 ? "" : "s"}. Cannot create
                        duplicates.
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 border-amber-300 px-3 py-1.5 font-semibold"
                  >
                    {existingTasks.length} Tasks
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {existingTasks.slice(0, 5).map((task) => (
                    <TaskListCard key={task.id} task={task} />
                  ))}
                  {existingTasks.length > 5 && (
                    <div className="text-center text-slate-600 py-4">
                      ... and {existingTasks.length - 5} more tasks
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ---------- NEW: SOURCE PREVIEW + SUMMARY ---------- */}
            {selectedClientId && (
              <section className="space-y-6">
                <div className="flex items-start justify-between gap-4 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                      <LayoutList className="h-6 w-6 text-cyan-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-cyan-900">
                        Source Tasks Overview
                      </h3>
                      <p className="text-sm text-cyan-700">
                        All tasks that will be copied with frequency
                        multipliers. <b>All must be QC Approved</b> to proceed.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={fetchPreview}
                      disabled={previewLoading}
                      className="h-10 bg-white/80 backdrop-blur-sm border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                    >
                      {previewLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-600 border-t-transparent" />
                          Refreshing
                        </div>
                      ) : (
                        "Refresh"
                      )}
                    </Button>
                  </div>
                </div>

                {/* status summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {Object.entries(preview.countsByStatus).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex flex-col items-center justify-center rounded-xl border p-4 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="text-xs font-medium capitalize text-slate-600 mb-1">
                        {k.replace("_", " ")}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-lg font-bold px-3 py-1"
                      >
                        {v}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* list of source tasks */}
                <div className="grid gap-4">
                  {preview.tasks.map((t) => (
                    <Card
                      key={t.id}
                      className="border-slate-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/50"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <h4
                                className="text-base font-bold text-slate-900 truncate"
                                title={t.baseName}
                              >
                                {t.baseName}
                              </h4>
                              <Badge
                                variant="outline"
                                className="h-7 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 font-medium"
                              >
                                <Tag className="h-3.5 w-3.5 mr-1" />
                                {t.categoryName}
                              </Badge>
                              {t.assetType && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "h-7 rounded-full border font-medium",
                                    typeColors[t.assetType] ??
                                      "bg-slate-50 text-slate-700 border-slate-200"
                                  )}
                                >
                                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                                  {typeLabel[t.assetType]}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                              Original: {t.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge
                              variant="outline"
                              className="rounded-xl border px-3 py-2 text-sm bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-300 font-bold"
                            >
                              <Repeat className="h-4 w-4 mr-1" />
                              {t.frequency}x
                            </Badge>
                            <span
                              className={cn(
                                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border",
                                statusTone[t.status] ??
                                  "bg-slate-50 text-slate-700 border-slate-200"
                              )}
                            >
                              {t.status === "qc_approved" ? (
                                <ShieldCheck className="h-4 w-4" />
                              ) : (
                                <AlertTriangle className="h-4 w-4" />
                              )}
                              {toTitle(t.status)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {!previewLoading && preview.tasks.length === 0 && (
                    <div className="text-center text-slate-500 py-12 bg-slate-50 rounded-2xl">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p className="text-lg font-medium">
                        No source tasks found
                      </p>
                      <p className="text-sm">
                        Create some source tasks first to generate posting
                        tasks.
                      </p>
                    </div>
                  )}
                </div>

                {/* footer line: total to be created */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Target className="h-5 w-5 text-indigo-700" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        Will create{" "}
                        <span className="text-indigo-600">
                          {preview.totalWillCreate}
                        </span>{" "}
                        posting task
                        {preview.totalWillCreate === 1 ? "" : "s"}
                      </p>
                      <p className="text-sm text-slate-600">
                        Based on frequency multipliers from source tasks
                      </p>
                    </div>
                  </div>
                  {!preview.allApproved ? (
                    <Badge
                      variant="outline"
                      className="border-amber-300 text-amber-700 bg-amber-50 px-4 py-2 font-semibold"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Complete all source tasks first
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 bg-emerald-50 px-4 py-2 font-semibold"
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      All QC Approved
                    </Badge>
                  )}
                </div>
              </section>
            )}

            {/* CREATION CONTROLS */}
            {selectedClientId && (
              <section className="space-y-6">
                <div className="border rounded-2xl p-8 bg-gradient-to-br from-purple-50 via-white to-indigo-50 border-purple-200/70 shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <LayoutList className="h-4 w-4 text-purple-600" />
                        Template Source
                      </label>
                      <Select
                        value={templateId}
                        onValueChange={(v) => setTemplateId(v)}
                      >
                        <SelectTrigger className="w-full h-12 rounded-xl border-slate-300 bg-white shadow-sm">
                          <SelectValue placeholder="Choose template source" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl border border-slate-200 bg-white">
                          <SelectItem value="auto">
                            Use latest assignment template (recommended)
                          </SelectItem>
                          {templates.length > 0 && (
                            <div className="px-2 pt-2 text-[11px] uppercase tracking-wide text-slate-500">
                              Or choose specific template
                            </div>
                          )}
                          {templates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name || t.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        Default Task Priority
                      </label>
                      <Select
                        value={priority}
                        onValueChange={(v: any) => setPriority(v)}
                      >
                        <SelectTrigger className="w-full h-12 rounded-xl border-slate-300 bg-white shadow-sm">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl border border-slate-200 bg-white">
                          <SelectItem value="LOW">Low Priority</SelectItem>
                          <SelectItem value="MEDIUM">
                            Medium Priority
                          </SelectItem>
                          <SelectItem value="HIGH">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Filter className="h-4 w-4 text-purple-600" />
                        Quick Search (Created)
                      </label>
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter created tasks..."
                        className="h-12 rounded-xl border-slate-300 bg-white shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    {hasExistingPostingTasks ? (
                      <div className="w-full p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-center">
                        <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                        <h4 className="text-lg font-bold text-amber-900 mb-2">
                          Tasks Already Created
                        </h4>
                        <p className="text-sm text-amber-700">
                          Posting tasks already exist for this client. Cannot
                          create duplicates.
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={handleCreate}
                        disabled={creating || !canCreateTasks}
                        className={cn(
                          "w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600 text-lg",
                          (creating || !canCreateTasks) &&
                            "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {creating ? (
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                            Creating Posting Tasks...
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <ListChecks className="h-6 w-6" />
                            Create Posting Tasks for{" "}
                            {selectedClient?.name || "Client"}
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* RESULT */}
            {selectedClientId && createdCount !== null && (
              <section
                aria-live="polite"
                className={cn(
                  "rounded-2xl p-8 shadow-lg",
                  createdCount > 0
                    ? "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200"
                    : "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "mt-1 h-12 w-12 rounded-xl flex items-center justify-center shadow-sm",
                      createdCount > 0 ? "bg-emerald-100" : "bg-yellow-100"
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "h-7 w-7",
                        createdCount > 0
                          ? "text-emerald-700"
                          : "text-yellow-700"
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <h4 className="text-xl font-bold text-slate-900">
                        {createdCount > 0
                          ? `Successfully Created ${createdCount} Task${
                              createdCount === 1 ? "" : "s"
                            }! 🎉`
                          : "No New Tasks Created"}
                      </h4>
                      {createdCount > 0 && (
                        <div className="hidden md:flex items-center text-base text-slate-700 gap-2 bg-white/60 rounded-lg px-4 py-2">
                          <LayoutList className="h-5 w-5" />
                          <span className="font-semibold">
                            {createdCount} total
                          </span>
                        </div>
                      )}
                    </div>

                    {createdCount > 0 && (
                      <div className="grid gap-4">
                        {filteredCreatedTasks.map((t) => (
                          <TaskListCard key={t.id} task={t} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
