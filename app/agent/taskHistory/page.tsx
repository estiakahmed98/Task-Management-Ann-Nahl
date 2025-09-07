"use client";

import * as React from "react";
import useSWR from "swr";
import { Loader2 } from "lucide-react";
import TaskHistory, { type TaskHistoryRow } from "@/components/client-tasks-view/TaskHistory";

type MeResponse = {
  user?: { id?: string } | null;
};

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

export default function Page() {
  // 1) লগইনকরা এজেন্টের id নাও
  const { data: me, isLoading: meLoading, error: meError } = useSWR<MeResponse>("/api/auth/me", fetcher, {
    revalidateOnFocus: true,
  });
  const agentId = me?.user?.id;

  // 2) agentId পাওয়া গেলে টাস্ক হিস্টোরি ফেচ করো
  const { data: rows, isLoading: rowsLoading, error: rowsError } = useSWR<TaskHistoryRow[]>(
    agentId ? `/api/tasks/history/${agentId}` : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  // 3) লোডিং/এরর স্টেট
  if (meLoading || (agentId && rowsLoading)) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        <p className="text-sm text-muted-foreground">Loading your Task History…</p>
      </div>
    );
  }

  if (meError || !agentId) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600">Could not resolve your agent session.</p>
          <p className="text-xs text-muted-foreground mt-1">Please sign in again.</p>
        </div>
      </div>
    );
  }

  if (rowsError) {
    return <TaskHistory rows={[]} />;
  }

  // 4) রেন্ডার
  return <TaskHistory rows={rows ?? []} />;
}
