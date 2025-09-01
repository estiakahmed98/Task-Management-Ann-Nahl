import { Badge } from "@/components/ui/badge"
import { UserCheck, UserX, Clock } from "lucide-react"

export function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-medium">
          <UserCheck className="w-3 h-3 mr-1.5" />
          Active
        </Badge>
      )
    case "inactive":
      return (
        <Badge className="bg-slate-50 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/30 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-medium">
          <UserX className="w-3 h-3 mr-1.5" />
          Inactive
        </Badge>
      )
    case "pending":
      return (
        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-medium">
          <Clock className="w-3 h-3 mr-1.5" />
          Pending
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="font-medium">
          {status}
        </Badge>
      )
  }
}
