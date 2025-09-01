import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, Clock } from "lucide-react"

interface AgentStatsCardsProps {
  totalAgents: number
  activeAgents: number
  pendingAgents: number
  activePercentage: number
}

export function AgentStatsCards({ totalAgents, activeAgents, pendingAgents, activePercentage }: AgentStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-blue-100">Total Agents</CardTitle>
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Users className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold text-white mb-1">{totalAgents}</div>
          <p className="text-xs text-blue-100">Total agents in the system</p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-emerald-100">Active Agents</CardTitle>
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Activity className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold text-white mb-1">{activeAgents}</div>
          <p className="text-xs text-emerald-100">{activePercentage}% of total</p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-amber-100">Pending Approval</CardTitle>
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Clock className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold text-white mb-1">{pendingAgents}</div>
          <p className="text-xs text-amber-100">Require attention</p>
        </CardContent>
      </Card>
    </div>
  )
}
