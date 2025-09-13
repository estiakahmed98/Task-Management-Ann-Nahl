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
import { CheckCircle2, UserRound } from "lucide-react";
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
};

export default function DataEntryCompleteTasksPanel({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { user } = useUserSession();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<DETask[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name?: string | null; email?: string | null }>>([]);

  const [q, setQ] = useState("");
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

  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    if (!qlc) return tasks;
    return tasks.filter((t) => [t.name, t.category?.name || "", t.priority || "", t.status || ""].some((s) => String(s).toLowerCase().includes(qlc)));
  }, [tasks, q]);

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

      // 2) set completedAt (chosen date)
      const r2 = await fetch(`/api/tasks/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completedAt: completedAt.toISOString(),
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
    <Card className="border-0 shadow-2xl overflow-hidden bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-2xl font-bold pl-6">Data Entry — Complete Tasks</h2>
        <div className="flex items-center gap-2 pr-6">
          <CreateTasksButton clientId={clientId} onTaskCreationComplete={load} />
        </div>
      </div>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quick search tasks" className="h-10 rounded-xl" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-700">
              <tr className="text-left">
                <th className="px-3 py-2">Task</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">No tasks</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <div className="font-medium text-slate-900 truncate" title={t.name}>{t.name}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{t.category?.name || "—"}</Badge>
                    </td>
                    <td className="p-3">{t.priority}</td>
                    <td className="p-3">{t.status.replaceAll("_", " ")}</td>
                    <td className="p-3">{t.dueDate ? format(new Date(t.dueDate), "PPP") : "—"}</td>
                    <td className="p-3 text-right">
                      <Button onClick={() => openComplete(t)} size="sm">Complete</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isReadyForPostingCreation && (
          <div className="mt-6 flex justify-end">
            <Button onClick={createPostingTasks} disabled={creatingPosting} className="bg-indigo-600">
              {creatingPosting ? "Creating..." : "Create Posting Tasks"}
            </Button>
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={(o) => !o && resetModal()}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Complete Task</DialogTitle>
              <DialogDescription>Provide completion link, credentials, who did it, and the completion date. It will be auto-QC approved.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-sm font-medium">Completion Link</label>
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className="mt-1" />
              </div>
              
              {!isSimpleTask(selected) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2"><UserRound className="h-4 w-4" /> Done by (agent)</label>
                  <Select value={doneBy} onValueChange={setDoneBy}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Select agent" /></SelectTrigger>
                    <SelectContent>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name || a.email || a.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Completed At</label>
                  <div className="mt-1">
                    <DatePicker
                      selected={completedAt}
                      onChange={(date: Date | null) => setCompletedAt(date || new Date())}
                      dateFormat="MMMM d, yyyy"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      placeholderText="Select completion date"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm"
                      maxDate={new Date()} // Prevent future dates
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => resetModal()}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={submit}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Submit & Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
