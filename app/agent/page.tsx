// import { AgentDashboard } from "@/components/agent-dashboard";

// export default function OverviewPage() {
//   const agentId = "12345"

//   return (
//     <div className="p-6">
//       <AgentDashboard agentId={agentId} />
//     </div>)
// }



// app/agent/page.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { AgentDashboard } from "@/components/agent-dashboard";

export default function AgentDashboardPage() {
  const { user, loading } = useUserSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Loading state
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

  if (!user) return null;


  if (!user.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-red-600">
          Could not determine agent ID. Please re-login.
        </p>
      </div>
    );
  }

  return <AgentDashboard agentId={user.id} />;
}
