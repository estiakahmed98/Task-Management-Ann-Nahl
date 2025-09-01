import { Users } from "lucide-react"

export function EmptyState() {
  return (
    <div className="col-span-full text-center py-16">
      <div className="flex flex-col items-center gap-6">
        <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full">
          <Users className="h-12 w-12 text-gray-400" />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">No agents found</p>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Try adjusting your search or filter criteria to find the agents you're looking for
          </p>
        </div>
      </div>
    </div>
  )
}
