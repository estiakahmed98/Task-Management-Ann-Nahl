import { AgentDashboard } from "@/components/agent-dashboard"

interface AgentDashboardPageProps {
  params: {
    agentId: string
  }
}

export default function AgentDashboardPage({ params }: AgentDashboardPageProps) {
  return <AgentDashboard agentId={params.agentId} />
}
