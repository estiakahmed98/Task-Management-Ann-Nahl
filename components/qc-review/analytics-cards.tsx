import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Award, Clock, Zap } from "lucide-react"

interface AnalyticsCardsProps {
  analytics: {
    total: number
    avgPerformanceScore: number
    avgDuration: number
    avgEfficiency: number
    ratedTasks: number
  }
}

export function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Completed Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-300 uppercase tracking-wider">Total Completed</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{analytics.total}</p>
              <p className="text-xs font-medium text-blue-700/80 dark:text-blue-300/80">Ready for review</p>
            </div>
            <div className="p-3 bg-white/50 dark:bg-blue-900/30 rounded-xl group-hover:bg-white/70 dark:group-hover:bg-blue-900/50 transition-all">
              <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg Performance Card */}
      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300 uppercase tracking-wider">Avg Performance</p>
              <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{analytics.avgPerformanceScore}%</p>
              <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80">{analytics.ratedTasks} rated tasks</p>
            </div>
            <div className="p-3 bg-white/50 dark:bg-emerald-900/30 rounded-xl group-hover:bg-white/70 dark:group-hover:bg-emerald-900/50 transition-all">
              <Award className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg Duration Card */}
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-300 uppercase tracking-wider">Avg Duration</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{analytics.avgDuration}m</p>
              <p className="text-xs font-medium text-amber-700/80 dark:text-amber-300/80">Time efficiency</p>
            </div>
            <div className="p-3 bg-white/50 dark:bg-amber-900/30 rounded-xl group-hover:bg-white/70 dark:group-hover:bg-amber-900/50 transition-all">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Efficiency Card */}
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800/50 shadow-sm hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">Efficiency</p>
              <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{analytics.avgEfficiency}%</p>
              <p className="text-xs font-medium text-indigo-700/80 dark:text-indigo-300/80">vs target time</p>
            </div>
            <div className="p-3 bg-white/50 dark:bg-indigo-900/30 rounded-xl group-hover:bg-white/70 dark:group-hover:bg-indigo-900/50 transition-all">
              <Zap className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}