//app/agent/page.tsx

"use client";

import AgentTaskDashboard from "@/components/agent-task-dashboard";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { redirect } from "next/navigation";

export default function AgentDashboardPage() {
  const { user, loading } = useUserSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  return <AgentTaskDashboard agentId={user.id ?? undefined} />;
}
