"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, UserRound, Search, Calendar, Filter, BarChart3, Clock, CheckSquare, AlertCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { useRouter } from "next/navigation";
import { BackgroundGradient } from "../ui/background-gradient";
import CreateTasksButton from "./CreateTasksButton";

export type DETask = {
  id: string;
  name: string;
  status: string;
  priority: string;
  completionLink?: string | null;
  email?: string | null;
  username?: string | null;
  password?: string | null;
  category?: { id: string; name: string } | null;
  assignedTo?: { id: string; name?: string | null; email?: string | null } | null;
  dueDate?: string | null;
  completedAt?: string | null;
  // Persisted JSON: { completedByUserId, completedByName, completedAt, status }
  dataEntryReport?: any;
};

// Status badge variant mapping
const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "pending": "outline",
  "in_progress": "secondary",
  "completed": "default",
  "qc_approved": "default",
  "rejected": "destructive"
};

// Priority color mapping
const priorityColor: Record<string, string> = {
  "high": "text-red-600",
  "medium": "text-yellow-600",
  "low": "text-green-600"
};

export default function DataEntryCompleteTasksPanel({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { user } = useUserSession();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<DETask[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name?: string | null; email?: string | null }>>([]);
  const [hasCreatedTasks, setHasCreatedTasks] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selected, setSelected] = useState<DETask | null>(null);

  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [doneBy, setDoneBy] = useState<string>("");
  const [completedAt, setCompletedAt] = useState<Date | undefined>(undefined);
  const [openDate, setOpenDate] = useState(false);

  const load = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/client/${clientId}`, { cache: "no-store" });
      const data = await res.json();
      const mine = (data as any[]).filter((t) => t?.assignedTo?.id && user?.id && t.assignedTo.id === user.id);
      setTasks(mine);
      
      // Check if posting tasks already exist
      const hasPostingTasks = mine.some((task) => 
        task.name?.toLowerCase().includes('posting') || 
        task.category?.name?.toLowerCase().includes('posting')
      );
      setHasCreatedTasks(hasPostingTasks);

      const aRes = await fetch(`/api/users?role=agent&limit=200`, { cache: "no-store" });
      const aJson = await aRes.json();
      const list: Array<{ id: string; name?: string | null; email?: string | null }> = (aJson?.users ?? aJson?.data ?? [])
        .filter((u: any) => u?.role?.name?.toLowerCase() === "agent")
        .map((u: any) => ({ id: u.id, name: u.name ?? null, email: u.email ?? null }));
      setAgents(list);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load tasks or agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, user?.id]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed" || t.status === "qc_approved").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const overdue = tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && 
             (t.status === "pending" || t.status === "in_progress");
    }).length;
    
    return { total, completed, pending, inProgress, overdue };
  }, [tasks]);

  // Count tasks completed by Data Entry (from dataEntryReport)
  const dataEntryCompletedCount = useMemo(() => {
    try {
      return tasks.filter((t: any) => t?.dataEntryReport?.completedByUserId && t?.dataEntryReport?.status === "Completed by Data Entry").length;
    } catch {
      return 0;
    }
  }, [tasks]);

  const filtered = useMemo(() => {
    let result = tasks;
    
    // Apply search filter
    const qlc = q.trim().toLowerCase();
    if (qlc) {
      result = result.filter((t) => 
        [t.name, t.category?.name || "", t.priority || "", t.status || ""]
          .some((s) => String(s).toLowerCase().includes(qlc))
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(t => t.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== "all") {
      result = result.filter(t => t.priority === priorityFilter);
    }
    
    return result;
  }, [tasks, q, statusFilter, priorityFilter]);

  // Gate readiness by required categories fully QC-approved
  const requiredCategories = [
    "Social Assets Creation",
    "Web2 Creation",
    "Additional Assets Creation",
  ];

  const isReadyForPostingCreation = useMemo(() => {
    if (!tasks || tasks.length === 0) return false;
    // For each required category: must exist and all in that category must be qc_approved
    return requiredCategories.every((cat) => {
      const inCat = tasks.filter((t) => (t.category?.name || "").toLowerCase() === cat.toLowerCase());
      if (inCat.length === 0) return false; // must have tasks for this category
      return inCat.every((t) => t.status === "qc_approved");
    });
  }, [tasks]);

  const [creatingPosting, setCreatingPosting] = useState(false);

  const createPostingTasks = async () => {
    if (!clientId) return;
    if (!isReadyForPostingCreation) {
      toast.warning("Please complete & QC-approve all tasks first.");
      return;
    }
    // Follow ClientUnifiedDashboard: route to admin creation page
    router.push(`/admin/distribution/client-agent/client/${clientId}`);
  };

  const resetModal = () => {
    setSelected(null);
    setLink("");
    setEmail("");
    setUsername("");
    setPassword("");
    setDoneBy("");
    setCompletedAt(undefined);
  };

  const isSimpleTask = (task: DETask | null) => {
    if (!task?.category?.name) return false;
    const simpleCategories = ["Social Activity", "Blog Posting"];
    return simpleCategories.includes(task.category.name);
  };

  const openComplete = (t: DETask) => {
    setSelected(t);
    setLink(t.completionLink || "");
    setEmail(t.email || "");
    setUsername(t.username || "");
    setPassword(t.password || "");
    if (t.completedAt) {
      const d = new Date(t.completedAt);
      if (!isNaN(d.getTime())) setCompletedAt(d);
    } else {
      setCompletedAt(undefined);
    }
  };

  const submit = async () => {
    if (!user?.id || !selected) return;
    if (!link.trim()) {
      toast.error("Completion link is required");
      return;
    }
    if (!completedAt) {
      toast.error("Please select a completion date");
      return;
    }
    if (completedAt.getTime() > Date.now()) {
      toast.error("Completed date cannot be in the future");
      return;
    }

    try {
      // 1) mark completed with link + credentials via agent endpoint (task is assigned to data_entry)
      const r1 = await fetch(`/api/tasks/agents/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selected.id,
          status: "completed",
          completionLink: link.trim(),
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          password: password || undefined,
        }),
      });
      const j1 = await r1.json();
      if (!r1.ok) throw new Error(j1?.message || j1?.error || "Failed to complete task");

      // 2) set completedAt and dataEntryReport
      const r2 = await fetch(`/api/tasks/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completedAt: completedAt.toISOString(),
          dataEntryReport: {
            completedByUserId: user.id,
            completedByName: (user as any)?.name || (user as any)?.email || user.id,
            // Store today's timestamp in the report as the time of logging by Data Entry
            completedAt: new Date().toISOString(),
            status: "Completed by Data Entry",
          },
        }),
      });
      const j2 = await r2.json();
      if (!r2.ok) throw new Error(j2?.error || "Failed to set completed date");

      // 2.5) reassign to the selected 'doneBy' agent (if provided) so the task ownership reflects who actually did it
      if (doneBy && clientId) {
        const distBody = {
          clientId,
          assignments: [
            {
              taskId: selected.id,
              agentId: doneBy,
              note: "Reassigned to actual performer by data_entry",
              dueDate: undefined,
            },
          ],
        } as any;
        const rDist = await fetch(`/api/tasks/distribute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(distBody),
        });
        const jDist = await rDist.json();
        if (!rDist.ok) throw new Error(jDist?.error || "Failed to reassign task to selected agent");
      }

      // 3) auto approve → qc_approved (include notes with doneBy)
      const r3 = await fetch(`/api/tasks/${selected.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performanceRating: "Good", notes: doneBy ? `Done by agent: ${doneBy}` : undefined }),
      });
      const j3 = await r3.json();
      if (!r3.ok) throw new Error(j3?.error || "Failed to approve task");

      toast.success("Task completed and QC approved");
      resetModal();
      load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to submit");
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Tasks</p>
              <h3 className="text-2xl font-bold text-blue-900">{stats.total}</h3>
            </div>
            <div className="p-3 rounded-full bg-blue-200">
              <BarChart3 className="h-6 w-6 text-blue-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Completed by Data Entry</p>
              <h3 className="text-2xl font-bold text-green-900">{dataEntryCompletedCount}</h3>
            </div>
            <div className="p-3 rounded-full bg-green-200">
              <AlertCircle className="h-6 w-6 text-green-700" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Overdue</p>
              <h3 className="text-2xl font-bold text-red-900">{stats.overdue}</h3>
            </div>
            <div className="p-3 rounded-full bg-red-200">
              <AlertCircle className="h-6 w-6 text-red-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Panel */}
      <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Data Entry — Complete Tasks
            </CardTitle>
            <CreateTasksButton 
              clientId={clientId} 
              disabled={hasCreatedTasks}
              onTaskCreationComplete={() => {
                setHasCreatedTasks(true);
                load();
              }} 
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Search tasks..." 
                className="pl-10 h-11 rounded-xl" 
              />
            </div>
          </div>

          {/* Tasks Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-700">
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="mt-2">Loading tasks...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <p>No tasks found</p>
                      {q || statusFilter !== "all" || priorityFilter !== "all" ? (
                        <Button 
                          variant="outline" 
                          className="mt-2" 
                          onClick={() => {
                            setQ("");
                            setStatusFilter("all");
                            setPriorityFilter("all");
                          }}
                        >
                          Clear filters
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && 
                                     (t.status === "pending" || t.status === "in_progress");
                    
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 truncate max-w-[200px]" title={t.name}>
                            {t.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {t.category?.name || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${priorityColor[t.priority] || "text-gray-600"}`}>
                            {t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[t.status] || "outline"} className="capitalize">
                            {t.status.replaceAll("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                            {t.dueDate ? (
                              <>
                                <Calendar className="h-4 w-4" />
                                {format(new Date(t.dueDate), "MMM dd, yyyy")}
                                {isOverdue && <AlertCircle className="h-4 w-4 ml-1" />}
                              </>
                            ) : (
                              "—"
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-700 hover:to-blue-700 shadow-sm" 
                            onClick={() => openComplete(t)} 
                            size="sm"
                            disabled={t.status === "completed" || t.status === "qc_approved"}
                          >
                            {t.status === "completed" || t.status === "qc_approved" ? "Completed" : "Complete"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {isReadyForPostingCreation && (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={createPostingTasks} 
                disabled={creatingPosting} 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md hover:from-indigo-700 hover:to-purple-700"
              >
                {creatingPosting ? "Creating..." : "Create Posting Tasks"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && resetModal()}>
        <DialogContent className="sm:max-w-[600px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Complete Task: {selected?.name}
            </DialogTitle>
            <DialogDescription>
              Provide completion details. This task will be automatically QC approved upon submission.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Completion Link *</label>
              <Input 
                value={link} 
                onChange={(e) => setLink(e.target.value)} 
                placeholder="https://example.com" 
                className="rounded-lg" 
              />
            </div>
            
            {!isSimpleTask(selected) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="email@example.com" 
                    className="rounded-lg" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Username</label>
                  <Input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="username" 
                    className="rounded-lg" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Password</label>
                  <Input 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="password" 
                    type="password"
                    className="rounded-lg" 
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-2">
                  <UserRound className="h-4 w-4" /> 
                  Done by (agent)
                </label>
                <Select value={doneBy} onValueChange={setDoneBy}>
                  <SelectTrigger className="rounded-lg h-11">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name || a.email || a.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Completed At *</label>
                <DatePicker
                  selected={completedAt}
                  onChange={(date: Date | null) => setCompletedAt(date || new Date())}
                  dateFormat="MMMM d, yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  placeholderText="Select completion date"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm h-11"
                  maxDate={new Date()} // Prevent future dates
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => resetModal()}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              className="ml-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg" 
              onClick={submit}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> 
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}