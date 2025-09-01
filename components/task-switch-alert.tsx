"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Timer, Play, Pause } from "lucide-react"

interface TaskSwitchAlertProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentTask: {
    id: string
    name: string
    remainingTime: string
  } | null
  newTask: {
    id: string
    name: string
  } | null
  onConfirm: () => void
  onCancel: () => void
  selfAgentId: string
  lockAgentId?: string | null
}

export function TaskSwitchAlert({
  isOpen,
  onOpenChange,
  currentTask,
  newTask,
  onConfirm,
  onCancel,
}: TaskSwitchAlertProps) {
  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-amber-500" />
            Switch Active Timer?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You currently have an active timer running. Switching will pause the current task and start the new one.
            </p>

            {currentTask && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <Pause className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Current Task (will be paused)
                  </span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">{currentTask.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                  >
                    <Timer className="h-3 w-3 mr-1" />
                    {currentTask.remainingTime} remaining
                  </Badge>
                </div>
              </div>
            )}

            {newTask && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    New Task (will be started)
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{newTask.name}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
            Switch Timer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
