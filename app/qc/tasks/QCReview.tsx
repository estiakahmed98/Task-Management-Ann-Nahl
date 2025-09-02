// app/admin/qc-review/review/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Download, Eye, UserX, RotateCcw, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { FilterSection } from "@/components/qc-review/filter-section";
import { TaskCard } from "@/components/qc-review/task-card";

type AgentLite = { id: string; name: string | null; firstName?: string; lastName?: string; email: string; category?: string; };
type ClientLite = { id: string; name: string; company?: string; };
type CategoryLite = { id: string; name: string; };
type TaskRow = {
  id: string; name: string; status: string; priority: "low"|"medium"|"high"|"urgent";
  dueDate: string|null; completedAt: string|null; createdAt: string; updatedAt: string;
  notes: string|null; completionLink: string|null;
  performanceRating: "Excellent"|"Good"|"Average"|"Lazy"|null;
  idealDurationMinutes: number|null; actualDurationMinutes: number|null;
  completionPercentage: number;
  assignedTo: AgentLite|null; client: ClientLite|null; category: CategoryLite|null;
  assignment?: { template?: { name: string; package?: { name: string } } };
  templateSiteAsset?: { name: string; type: string };
};

export function QCReview() {
  // -------- Filters --------
  const [agentId, setAgentId] = useState<string>("all");
  const [clientId, setClientId] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [q, setQ] = useState<string>("");

  // -------- Data --------
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [agents, setAgents] = useState<AgentLite[]>([]);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useUserSession();

  // -------- Approve modal --------
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; task: TaskRow | null; loading: boolean; }>({ open:false, task:null, loading:false });
  const [approvedMap, setApprovedMap] = useState<Record<string, boolean>>({});

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", "completed");
      if (agentId !== "all") params.set("assignedToId", agentId);
      if (clientId !== "all") params.set("clientId", clientId);
      if (categoryId !== "all") params.set("categoryId", categoryId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/tasks?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load tasks");
      setTasks(await res.json());
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const fetchAgents = async () => {
    try { const r = await fetch("/api/tasks/agents", { cache: "no-store" }); if (r.ok) setAgents(await r.json()); } catch {}
  };
  const fetchClients = async () => {
    try { const r = await fetch("/api/clients", { cache: "no-store" }); if (r.ok) setClients(await r.json()); } catch {}
  };
  const fetchCategories = async () => {
    try { const r = await fetch("/api/teams", { cache: "no-store" }); if (r.ok) setCategories(await r.json()); } catch {}
  };

  useEffect(() => { fetchAgents(); fetchClients(); fetchCategories(); }, []);
  useEffect(() => { fetchTasks(); /* eslint-disable-next-line */ }, [agentId, clientId, categoryId, startDate, endDate]);

  const filtered = useMemo(() => {
    if (!q.trim()) return tasks;
    const needle = q.toLowerCase();
    return tasks.filter((t) =>
      [
        t.name, t.notes ?? "", t.completionLink ?? "",
        t.assignedTo?.name ?? "", t.assignedTo?.email ?? "",
        t.client?.name ?? "", t.category?.name ?? "",
        t.assignment?.template?.name ?? "", t.templateSiteAsset?.name ?? ""
      ].join(" ").toLowerCase().includes(needle)
    );
  }, [q, tasks]);

  const clearFilters = () => {
    setAgentId("all"); setClientId("all"); setCategoryId("all");
    setStartDate(""); setEndDate(""); setQ("");
  };

  // -------- Reassign modal --------
  const [reassignDialog, setReassignDialog] = useState<{ open:boolean; task:TaskRow|null; selectedAgent:string; reassignNotes:string; loading:boolean; }>({ open:false, task:null, selectedAgent:"", reassignNotes:"", loading:false });

  const handleReassignTask = async () => {
    if (!reassignDialog.task) return toast.error("No task selected to reassign.");
    setReassignDialog((p)=>({...p,loading:true}));
    try {
      const taskId = reassignDialog.task.id;
      const res = await fetch(`/api/tasks/${taskId}/reassign`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          toAgentId: reassignDialog.task.assignedTo?.id ?? undefined,
          reassignNotes: reassignDialog.reassignNotes || "",
          reassignedById: user?.id,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed to reassign task");
      await res.json();
      toast.success(`Task "${reassignDialog.task.name}" re-assigned to current agent successfully.`);
      setReassignDialog({ open:false, task:null, selectedAgent:"", reassignNotes:"", loading:false });
      fetchTasks();
    } catch (e:any) {
      toast.error(e?.message ?? "Failed to reassign task");
      setReassignDialog((p)=>({...p,loading:false}));
    }
  };

  // -------- Approve flow (use existing rating only) --------
  const handleApproveTask = async () => {
    if (!approveDialog.task) return;
    setApproveDialog((p)=>({...p,loading:true}));
    try {
      const rating = approveDialog.task.performanceRating ?? null;
      const r = await fetch(`/api/tasks/${approveDialog.task.id}/approve`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ performanceRating: rating }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed to approve task");
      await r.json();
      toast.success(`Task "${approveDialog.task.name}" approved${rating ? ` with ${rating}`:""}.`);
      setApprovedMap((m)=>({ ...m, [approveDialog.task!.id]: true }));
      setApproveDialog({ open:false, task:null, loading:false });
      fetchTasks();
    } catch(e:any) {
      toast.error(e?.message ?? "Failed to approve task");
      setApproveDialog((p)=>({...p,loading:false}));
    }
  };

  const handleApprove = (task: TaskRow) => setApproveDialog({ open:true, task, loading:false });

  return (
    <div className="mx-auto w-full p-6 space-y-8 bg-slate-50/30 dark:bg-slate-950/30 min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            QC Review — Tasks
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Advanced filters, approvals & reassignments
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchTasks} disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow-md">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      <FilterSection
        agentId={agentId} setAgentId={setAgentId}
        clientId={clientId} setClientId={setClientId}
        categoryId={categoryId} setCategoryId={setCategoryId}
        startDate={startDate} setStartDate={setStartDate}
        endDate={endDate} setEndDate={setEndDate}
        q={q} setQ={setQ}
        agents={agents} clients={clients} categories={categories}
        filtered={filtered} tasks={tasks}
        clearFilters={clearFilters}
      />

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 via-purple-500 to-purple-700 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">Task Results & Quality Control</CardTitle>
              <CardDescription className="text-slate-200 mt-1">Review completed tasks, approve or reassign</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">Loading tasks...</p>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="space-y-6">
                {filtered.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    approvedMap={approvedMap}
                    onApprove={handleApprove}
                    onReject={(t) => setReassignDialog({ open:true, task:t, selectedAgent:t.assignedTo?.id || "", reassignNotes:"", loading:false })}
                  />
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <div className="flex flex-col items-center gap-6">
                    <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl">
                      <AlertCircle className="h-16 w-16 text-slate-400 mx-auto" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">No completed tasks found</p>
                      <p className="text-slate-600 dark:text-slate-400">Try adjusting your filters.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal (existing rating only) */}
      <Dialog open={approveDialog.open} onOpenChange={(open)=>setApproveDialog((p)=>({...p,open}))}>
        <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 border-0 shadow-2xl">
          <DialogHeader><DialogTitle>Approve Task</DialogTitle></DialogHeader>
          {approveDialog.task && (
            <div className="rounded-xl p-4 mb-6 border bg-emerald-50/60 dark:bg-slate-800 border-emerald-200 dark:border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{approveDialog.task.name}</h3>
                  <div className="mt-2 flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>Agent: <strong>{approveDialog.task.assignedTo?.name || approveDialog.task.assignedTo?.email}</strong></span>
                    <span>•</span>
                    <span>Client: <strong>{approveDialog.task.client?.name}</strong></span>
                  </div>
                  {approveDialog.task.completionLink && (
                    <div className="mt-3">
                      <Button onClick={()=>window.open(approveDialog.task!.completionLink!, "_blank")} variant="outline" size="sm" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" /> View Completion
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-sm opacity-80">
                  {approveDialog.task.performanceRating ? (
                    <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      {approveDialog.task.performanceRating}
                    </div>
                  ) : "No rating"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setApproveDialog((p)=>({...p,open:false}))} disabled={approveDialog.loading}>Cancel</Button>
            <Button onClick={handleApproveTask} disabled={approveDialog.loading}>
              {approveDialog.loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</> : <> <CheckCircle className="h-4 w-4 mr-2" /> Approve </>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog (kept same UX) */}
      <Dialog open={reassignDialog.open} onOpenChange={(open)=>setReassignDialog((p)=>({...p,open}))}>
        <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 border-0 shadow-2xl">
          <DialogHeader><DialogTitle>Reassign Task</DialogTitle></DialogHeader>
          {reassignDialog.task && (
            <div className="rounded-xl p-4 mb-6 border bg-cyan-50/60 dark:bg-slate-800 border-cyan-200 dark:border-slate-700">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{reassignDialog.task.name}</h3>
                <p className="text-sm opacity-80">Current agent: <strong>{reassignDialog.task.assignedTo?.name || reassignDialog.task.assignedTo?.email}</strong></p>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <label className="text-sm font-medium">Reassignment Notes</label>
            <Textarea rows={4} value={reassignDialog.reassignNotes} onChange={(e)=>setReassignDialog((p)=>({...p,reassignNotes:e.target.value}))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setReassignDialog((p)=>({...p,open:false}))} disabled={reassignDialog.loading}>Cancel</Button>
            <Button onClick={handleReassignTask} disabled={reassignDialog.loading || !reassignDialog.task}>
              {reassignDialog.loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reassigning...</> : <><RotateCcw className="h-4 w-4 mr-2" /> Reassign</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
