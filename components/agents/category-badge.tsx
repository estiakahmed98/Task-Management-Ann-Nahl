import { Badge } from "@/components/ui/badge"
import { Briefcase } from "lucide-react"

export function getCategoryBadge(category: string) {
  const colors = {
    "Social Team":
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    "Asset Team":
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
    "Marketing Team":
      "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800",
    "Development Team":
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  }

  const colorClass =
    colors[category as keyof typeof colors] ||
    "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700"

  return (
    <Badge className={`${colorClass} font-medium`}>
      <Briefcase className="w-3 h-3 mr-1.5" />
      {category}
    </Badge>
  )
}
