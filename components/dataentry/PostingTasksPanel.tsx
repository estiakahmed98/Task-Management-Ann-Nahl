// components/dataentry/PostingTasksPanel.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Rocket,
  ListChecks,
  Filter,
  Boxes,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  Hash,
  Link2,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ========= types ========= */
export type AllowedAssetType = "social_site" | "web2_site" | "other_asset";
export type OnlyTypeFilter = AllowedAssetType | "all";

export type Props = {
  clientId: string;             // <- required now
  templateId?: string | null;
  initialOnlyType?: OnlyTypeFilter;
};

export type PreviewTask = {
  id: string;
  name: string;
  baseName: string;
  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "overdue"
    | "cancelled"
    | "reassigned"
    | "qc_approved";
  priority: "low" | "medium" | "high" | "urgent";
  assetType: AllowedAssetType | null;
  frequency: number;
  categoryName: "Social Activity" | "Blog Posting" | string;
};

export type PreviewResponse = {
  message: string;
  assignmentId: string;
  tasks: PreviewTask[];
  countsByStatus: Record<string, number>;
  allApproved: boolean;
  totalWillCreate: number;
  packageTotalMonths: number;
  runtime?: string;
};

/* ========= UI helpers ========= */
const statusClass = (s: PreviewTask["status"]) =>
  ({
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    in_progress: "bg-sky-100 text-sky-800 border-sky-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    overdue: "bg-rose-100 text-rose-800 border-rose-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200",
    reassigned: "bg-purple-100 text-purple-800 border-purple-200",
    qc_approved: "bg-indigo-100 text-indigo-800 border-indigo-200",
  }[s]);

const priorityClass = (p: PreviewTask["priority"]) =>
  ({
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-blue-100 text-blue-800 border-blue-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    urgent: "bg-red-100 text-red-800 border-red-200",
  }[p]);

const categoryClass = (c?: string) =>
  ({
    "Social Activity": "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    "Blog Posting": "bg-cyan-100 text-cyan-800 border-cyan-200",
  }[c ?? ""] || "bg-slate-100 text-slate-700 border-slate-200");

const assetLabel: Record<AllowedAssetType, string> = {
  social_site: "Social Site",
  web2_site: "Web 2.0 Site",
  other_asset: "Other Asset",
};

/* ========= component ========= */
export default function PostingTasksPanel({
  clientId,
  templateId,
  initialOnlyType = "all",
}: Props) {
  const [onlyType, setOnlyType] = useState<OnlyTypeFilter>(initialOnlyType);
  const [overridePriority, setOverridePriority] = useState<PreviewTask["priority"] | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [q, setQ] = useState("");

  const fetchPreview = async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const sp = new URLSearchParams();
      sp.set("clientId", clientId);
      if (templateId !== undefined && templateId !== null)
        sp.set("templateId", String(templateId));
      if (onlyType !== "all") sp.set("onlyType", onlyType);

      const res = await fetch(
        `/api/tasks/create-posting-tasks?${sp.toString()}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || `Preview failed (${res.status})`);
      }
      const data: PreviewResponse = await res.json();
      setPreview(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to load preview");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, templateId, onlyType]);

  const filteredTasks = useMemo(() => {
    if (!preview) return [] as PreviewTask[];
    const qlc = q.trim().toLowerCase();
    if (!qlc) return preview.tasks;
    return preview.tasks.filter((t) =>
      [t.name, t.baseName, t.categoryName, t.assetType || "", t.priority, t.status]
        .map(String)
        .some((s) => s.toLowerCase().includes(qlc))
    );
  }, [preview, q]);

  const stats = useMemo(() => {
    const byAsset: Record<string, number> = {};
    const byCat: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const t of filteredTasks) {
      byAsset[t.assetType || "unknown"] =
        (byAsset[t.assetType || "unknown"] || 0) + 1;
      byCat[t.categoryName] = (byCat[t.categoryName] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    }
    return { byAsset, byCat, byPriority };
  }, [filteredTasks]);

  const canCreate = !!preview && preview.allApproved && filteredTasks.length > 0;

  const fireCreate = async () => {
    try {
      setCreating(true);
      const body: any = { clientId };
      if (templateId !== undefined && templateId !== null)
        body.templateId = templateId;
      if (onlyType !== "all") body.onlyType = onlyType;
      if (overridePriority) body.priority = overridePriority;

      const res = await fetch(`/api/tasks/create-posting-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Create failed (${res.status})`);

      toast.success(data?.message || "Created posting tasks");
      fetchPreview();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="border-0 shadow-2xl overflow-hidden bg-white/90 backdrop-blur">
      <CardHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-cyan-50 border-b border-slate-200/60">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center bg-white/70">
                <ListChecks className="h-6 w-6 text-slate-700" />
              </div>
              Posting Tasks — Builder
            </CardTitle>
            <CardDescription className="mt-2 text-slate-600">
              Preview approved source assets (past) and create frequency-based copies (present) with safe de-duplication.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={onlyType} onValueChange={(v) => setOnlyType(v as OnlyTypeFilter)}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl bg-white">
                <SelectValue placeholder="Asset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All asset types</SelectItem>
                <SelectItem value="social_site">Social Sites</SelectItem>
                <SelectItem value="web2_site">Web 2.0 Sites</SelectItem>
                <SelectItem value="other_asset">Other Assets</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={overridePriority ?? "none"}
              onValueChange={(v) =>
                setOverridePriority(
                  v === "none" ? undefined : (v as PreviewTask["priority"])
                )
              }
            >
              <SelectTrigger className="w-[170px] h-10 rounded-xl bg-white">
                <SelectValue placeholder="Priority (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keep original</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={fetchPreview}
              disabled={loading}
            >
              <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>

            <Button
              className="h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              onClick={fireCreate}
              disabled={!canCreate || creating || loading}
            >
              <Rocket className={cn("h-4 w-4 mr-2", creating && "animate-bounce")} />
              {creating ? "Creating…" : "Create Posting Tasks"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Preview status bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            {preview?.allApproved ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">All source tasks are QC approved.</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700">
                  Some source tasks are not QC approved. Creation is disabled.
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className="bg-white border-indigo-200 text-indigo-800">
              <Boxes className="h-3.5 w-3.5 mr-1" />
              Package months: <strong className="ml-1">{preview?.packageTotalMonths ?? "—"}</strong>
            </Badge>
            <Badge variant="outline" className="bg-white border-fuchsia-200 text-fuchsia-800">
              Will create: <strong className="ml-1">{preview?.totalWillCreate ?? 0}</strong>
            </Badge>
          </div>
        </div>

        <Separator className="my-5" />

        {/* Filters row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="text-sm text-slate-700 mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Quick search
            </div>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, category, type…"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatsPill title="By Asset Type" icon={Hash} map={
              useMemo(() => {
                const m: Record<string, number> = {};
                for (const t of filteredTasks) {
                  const k = t.assetType || "unknown";
                  m[k] = (m[k] || 0) + 1;
                }
                return m;
              }, [filteredTasks])
            } formatter={(k) => (k === "unknown" ? "Unknown" : assetLabel[k as AllowedAssetType] || k)} />
            <StatsPill title="By Category" icon={Type} map={
              useMemo(() => {
                const m: Record<string, number> = {};
                for (const t of filteredTasks) m[t.categoryName] = (m[t.categoryName] || 0) + 1;
                return m;
              }, [filteredTasks])
            } />
            <StatsPill title="By Priority" icon={CircleDot} map={
              useMemo(() => {
                const m: Record<string, number> = {};
                for (const t of filteredTasks) m[t.priority] = (m[t.priority] || 0) + 1;
                return m;
              }, [filteredTasks])
            } />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-700">
              <tr className="text-left">
                <Th w="30%">Task (source)</Th>
                <Th w="18%">Category</Th>
                <Th w="14%">Asset Type</Th>
                <Th w="12%">Priority</Th>
                <Th w="12%">Status</Th>
                <Th w="14%" right>Will Create</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">Loading preview…</td></tr>
              ) : !preview ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">No preview to show.</td></tr>
              ) : filteredTasks.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">No matching source tasks.</td></tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <div className="font-medium text-slate-900 truncate" title={t.name}>{t.baseName}</div>
                      <div className="text-slate-500 truncate" title={t.name}>{t.name}</div>
                    </td>
                    <td className="p-3 align-middle">
                      <Badge variant="outline" className={cn("border", categoryClass(t.categoryName))}>
                        {t.categoryName}
                      </Badge>
                    </td>
                    <td className="p-3 align-middle">
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <Link2 className="h-3.5 w-3.5" />
                        {t.assetType ? assetLabel[t.assetType] : "—"}
                      </span>
                    </td>
                    <td className="p-3 align-middle">
                      <Badge variant="outline" className={cn("border", priorityClass(t.priority))}>
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="p-3 align-middle">
                      <Badge variant="outline" className={cn("border", statusClass(t.status))}>
                        {t.status.replaceAll("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3 text-right align-middle">
                      <span className="font-semibold text-slate-900">× {t.frequency}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Creation de-duplicates inside <em>Social Activity</em> &amp; <em>Blog Posting</em>.
          Due dates are auto-calculated per cycle; credentials & notes are copied.
        </div>
      </CardContent>
    </Card>
  );
}

/* ========= small bits ========= */
function Th({ children, w, right }: { children: React.ReactNode; w?: string; right?: boolean }) {
  return (
    <th
      className={cn("px-3 py-2 font-semibold text-xs uppercase tracking-wide border-b border-slate-200", right && "text-right")}
      style={w ? { width: w } : undefined}
    >
      {children}
    </th>
  );
}

function StatsPill({
  title,
  icon: Icon,
  map,
  formatter,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  map: Record<string, number>;
  formatter?: (k: string) => string;
}) {
  const pairs = Object.entries(map || {});
  return (
    <Card className="border-2 border-slate-200/60 bg-slate-50/50 rounded-xl">
      <CardContent className="p-3">
        <div className="text-xs text-slate-600 mb-2 flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" /> {title}
        </div>
        {pairs.length === 0 ? (
          <div className="text-slate-500 text-sm">—</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pairs.map(([k, n]) => (
              <Badge key={k} variant="outline" className="bg-white border-slate-200 text-slate-800">
                {(formatter ? formatter(k) : k) + ": "}
                <span className="ml-1 font-semibold">{n}</span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}