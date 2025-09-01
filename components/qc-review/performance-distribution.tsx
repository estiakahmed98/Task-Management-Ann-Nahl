import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3, Award, Star, Target, AlertTriangle } from "lucide-react"

interface PerformanceDistributionProps {
  analytics: {
    total: number
    performanceBreakdown: {
      Excellent: number
      Good: number
      Average: number
      Lazy: number
    }
  }
}

const performanceConfig = {
  Excellent: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300",
    icon: <Award className="h-3 w-3" />,
  },
  Good: {
    color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300",
    icon: <Star className="h-3 w-3" />,
  },
  Average: {
    color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300",
    icon: <Target className="h-3 w-3" />,
  },
  Lazy: {
    color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
}

export function PerformanceDistribution({ analytics }: PerformanceDistributionProps) {
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <BarChart3 className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </div>
          Performance Distribution
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Quality metrics across all completed tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Object.entries(analytics.performanceBreakdown).map(([rating, count]) => {
            const config = performanceConfig[rating as keyof typeof performanceConfig]
            const percentage = analytics.total ? Math.round((count / analytics.total) * 100) : 0
            return (
              <div key={rating} className="text-center">
                <div
                  className={`p-6 rounded-xl ${config.color} mb-3 shadow-sm border transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-center justify-center mb-3">{config.icon}</div>
                  <p className="text-3xl font-bold">{count}</p>
                  <p className="text-sm opacity-80 font-medium">{percentage}%</p>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{rating}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
