"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

// লোকাল টাইপ — পেজ/ডেটা থেকে আসবে
export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "cancelled"
  | "reassigned"
  | "qc_approved"

export interface Task {
  id: string
  name: string
  idealDurationMinutes: number | null
  status: TaskStatus
}

export interface TimerState {
  taskId: string
  remainingSeconds: number
  isRunning: boolean
  totalSeconds: number
  // NEW: overdue tracking
  isOverdue: boolean
  overdueSeconds: number
  isGloballyLocked: boolean
  lockedByAgent?: string
  startedAt?: number
  pausedAt?: number
}

type TimerEntry = {
  taskId: string
  totalSeconds: number
  remainingSeconds: number
  /** resume করার সময় থেকে গণনা করার জন্য */
  remainingAtStart: number
  isRunning: boolean
  // NEW: overdue tracking in storage
  isOverdue: boolean
  overdueSeconds: number
  /** resume করার সময় থেকে overdue যোগ করার জন্য */
  overdueAtStart: number
  startedAt?: number
  pausedAt?: number
}

const TIMER_STORAGE_KEY = "taskTimerState"
const GLOBAL_TIMER_LOCK_KEY = "globalTimerLock"

interface PersistedTimerData {
  active: TimerEntry | null
  timersByTask: Record<string, TimerEntry>
  timestamp: number
}

export function useTaskTimers({
  tasks,
  selfAgentId,
  lockAgentId,
}: {
  tasks: Task[]
  selfAgentId: string
  lockAgentId?: string | null
}) {
  const [active, setActive] = useState<TimerEntry | null>(null)
  const [timersByTask, setTimersByTask] = useState<Record<string, TimerEntry>>({})

  // Switch dialog state
  const [switchOpen, setSwitchOpen] = useState(false)
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)

  const getTaskById = useCallback((id: string) => tasks.find((t) => t.id === id), [tasks])

  const saveTimerState = useCallback((activeTimer: TimerEntry | null, timersMap: Record<string, TimerEntry>) => {
    try {
      const dataToSave: PersistedTimerData = {
        active: activeTimer,
        timersByTask: timersMap,
        timestamp: Date.now(),
      }
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error("Failed to save timer state:", error)
    }
  }, [])

  const loadTimerState = useCallback(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY)
      if (!saved) return null

      const data: PersistedTimerData = JSON.parse(saved)

      // Check if data is not too old (24 hours max)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - data.timestamp > maxAge) {
        localStorage.removeItem(TIMER_STORAGE_KEY)
        return null
      }

      return data
    } catch (error) {
      console.error("Failed to load timer state:", error)
      localStorage.removeItem(TIMER_STORAGE_KEY)
      return null
    }
  }, [])

  const clearTimerState = useCallback(() => {
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear timer state:", error)
    }
  }, [])

  useEffect(() => {
    const savedData = loadTimerState()
    if (savedData) {
      setTimersByTask(savedData.timersByTask)

      if (savedData.active) {
        const savedActive = savedData.active

        if (savedActive.isRunning && savedActive.startedAt) {
          // Timer was running when saved -> recalc
          const elapsedSinceStart = Math.floor((Date.now() - savedActive.startedAt) / 1000)

          if (savedActive.isOverdue) {
            const newOverdue = savedActive.overdueAtStart + Math.max(0, elapsedSinceStart)
            setActive({
              ...savedActive,
              overdueSeconds: newOverdue,
              overdueAtStart: newOverdue,
              isOverdue: true,
              isRunning: true,
              startedAt: Date.now(),
            })
            toast.success(`Resumed overdue timer for "${getTaskById(savedActive.taskId)?.name || "Unknown Task"}"`)
          } else {
            // Not overdue yet
            const newRemaining = savedActive.remainingAtStart - elapsedSinceStart

            if (newRemaining > 0) {
              setActive({
                ...savedActive,
                remainingSeconds: newRemaining,
                remainingAtStart: newRemaining,
                isRunning: true,
                startedAt: Date.now(),
              })
              toast.success(`Resumed timer for "${getTaskById(savedActive.taskId)?.name || "Unknown Task"}"`)
            } else {
              // Crossed into overdue while away
              const overdueNow = Math.abs(newRemaining)
              setActive({
                ...savedActive,
                remainingSeconds: 0,
                remainingAtStart: 0,
                isOverdue: true,
                overdueSeconds: overdueNow,
                overdueAtStart: overdueNow,
                isRunning: true,
                startedAt: Date.now(),
              })
              toast.warning(`Timer is now OVERDUE for "${getTaskById(savedActive.taskId)?.name || "Unknown Task"}"`)
            }
          }
        } else {
          // Paused -> restore exactly
          setActive({
            ...savedActive,
            remainingSeconds: savedActive.remainingSeconds,
            remainingAtStart: savedActive.remainingAtStart,
            overdueSeconds: savedActive.overdueSeconds ?? 0,
            overdueAtStart: savedActive.overdueAtStart ?? savedActive.overdueSeconds ?? 0,
            isOverdue: !!savedActive.isOverdue,
            isRunning: false,
          })
          toast.success(
            `Restored ${savedActive.isOverdue ? "overdue" : "paused"} timer for "${
              getTaskById(savedActive.taskId)?.name || "Unknown Task"
            }"`,
          )
        }
      }
    }
  }, [loadTimerState, getTaskById])

  useEffect(() => {
    saveTimerState(active, timersByTask)
  }, [active, timersByTask, saveTimerState])

  // প্রতি ১ সেকেন্ডে Active টাস্কের remaining/overdue আপডেট
  useEffect(() => {
    if (!active?.isRunning || !active?.startedAt) return
    const id = window.setInterval(() => {
      setActive((prev) => {
        if (!prev || !prev.isRunning || !prev.startedAt) return prev
        const elapsed = Math.floor((Date.now() - prev.startedAt) / 1000)

        // CASE 1: already overdue -> keep counting up
        if (prev.isOverdue) {
          const newOverdue = prev.overdueAtStart + Math.max(0, elapsed)

          // store-এও রেখে দিচ্ছি
          setTimersByTask((m) => ({
            ...m,
            [prev.taskId]: {
              ...(m[prev.taskId] ?? { taskId: prev.taskId, totalSeconds: prev.totalSeconds }),
              taskId: prev.taskId,
              totalSeconds: prev.totalSeconds,
              remainingSeconds: 0,
              remainingAtStart: 0,
              isRunning: true,
              startedAt: prev.startedAt,
              pausedAt: undefined,
              isOverdue: true,
              overdueSeconds: newOverdue,
              overdueAtStart: prev.overdueAtStart,
            },
          }))

          return { ...prev, overdueSeconds: newOverdue }
        }

        // CASE 2: not overdue yet -> count down
        const newRem = prev.remainingAtStart - elapsed

        if (newRem <= 0) {
          // Transition to overdue exactly once
          const justOverdue = Math.abs(newRem)
          toast.warning(`Timer went OVERDUE for "${getTaskById(prev.taskId)?.name || "Unknown Task"}"`)

          // DO NOT clear global lock — keep it locked while running
          return {
            ...prev,
            remainingSeconds: 0,
            remainingAtStart: 0,
            isOverdue: true,
            overdueSeconds: justOverdue,
            overdueAtStart: justOverdue,
            // reset baseline so next tick counts from 0
            startedAt: Date.now(),
          }
        }

        // Normal countdown path
        setTimersByTask((m) => ({
          ...m,
          [prev.taskId]: {
            ...(m[prev.taskId] ?? {
              taskId: prev.taskId,
              totalSeconds: prev.totalSeconds,
            }),
            taskId: prev.taskId,
            totalSeconds: prev.totalSeconds,
            remainingSeconds: newRem,
            remainingAtStart: prev.remainingAtStart,
            isRunning: true,
            startedAt: prev.startedAt,
            pausedAt: undefined,
            isOverdue: false,
            overdueSeconds: prev.overdueSeconds ?? 0,
            overdueAtStart: prev.overdueAtStart ?? 0,
          },
        }))

        return { ...prev, remainingSeconds: newRem }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [active?.isRunning, active?.startedAt, getTaskById])

  // ভিতরের স্টার্ট/রিজিউম
  const actuallyStart = useCallback(
    (taskId: string) => {
      const task = getTaskById(taskId)
      if (!task) {
        toast.error("Task not found")
        return
      }
      if (!task.idealDurationMinutes || task.idealDurationMinutes <= 0) {
        toast.error("No ideal duration set for this task")
        return
      }

      const totalSeconds = task.idealDurationMinutes * 60
      const existing = timersByTask[taskId]

      // If resuming an overdue timer -> continue counting up
      if (existing?.isOverdue) {
        const entry: TimerEntry = {
          taskId,
          totalSeconds,
          remainingSeconds: 0,
          remainingAtStart: 0,
          isRunning: true,
          isOverdue: true,
          overdueSeconds: existing.overdueSeconds ?? 0,
          overdueAtStart: existing.overdueSeconds ?? 0,
          startedAt: Date.now(),
          pausedAt: undefined,
        }

        setTimersByTask((m) => ({
          ...m,
          [taskId]: entry,
        }))
        setActive(entry)
      } else {
        const startingRemain =
          existing?.remainingSeconds !== undefined && existing.remainingSeconds > 0
            ? existing.remainingSeconds
            : totalSeconds

        const entry: TimerEntry = {
          taskId,
          totalSeconds,
          remainingSeconds: startingRemain,
          remainingAtStart: startingRemain,
          isRunning: true,
          isOverdue: false,
          overdueSeconds: existing?.overdueSeconds ?? 0,
          overdueAtStart: existing?.overdueSeconds ?? 0,
          startedAt: Date.now(),
          pausedAt: undefined,
        }

        setTimersByTask((m) => ({
          ...m,
          [taskId]: entry,
        }))
        setActive(entry)
      }

      try {
        const lockData = {
          isLocked: true,
          taskId,
          agentId: selfAgentId,
          taskName: task.name,
        }
        localStorage.setItem(GLOBAL_TIMER_LOCK_KEY, JSON.stringify(lockData))
      } catch (error) {
        console.error("Failed to set global timer lock:", error)
      }
    },
    [getTaskById, timersByTask, selfAgentId],
  )

  // Public: onStartTimer — একই টাস্ক হলে resume, অন্য হলে switch dialog
  const onStartTimer = useCallback(
    (taskId: string) => {
      const t = getTaskById(taskId)
      if (!t) return
      if (["completed", "qc_approved", "cancelled"].includes(t.status)) return

      if (active && active.isRunning && active.taskId !== taskId) {
        setPendingTaskId(taskId)
        setSwitchOpen(true)
        return
      }

      // same task resume OR no active
      actuallyStart(taskId)
    },
    [active, actuallyStart, getTaskById],
  )

  // Public: onPauseTimer
  const onPauseTimer = useCallback(
    (taskId: string) => {
      if (!active || active.taskId !== taskId) return

      const elapsed = active.startedAt ? Math.floor((Date.now() - active.startedAt) / 1000) : 0

      if (active.isOverdue) {
        const newOverdue = (active.overdueAtStart ?? 0) + Math.max(0, elapsed)
        const pausedEntry: TimerEntry = {
          ...active,
          isRunning: false,
          startedAt: undefined,
          pausedAt: Date.now(),
          remainingSeconds: 0,
          remainingAtStart: 0,
          isOverdue: true,
          overdueSeconds: newOverdue,
          overdueAtStart: newOverdue,
        }

        setActive(pausedEntry)
        setTimersByTask((m) => ({
          ...m,
          [taskId]: pausedEntry,
        }))
      } else {
        const newRem = Math.max(0, active.remainingAtStart - elapsed)
        const pausedEntry: TimerEntry = {
          ...active,
          isRunning: false,
          startedAt: undefined,
          pausedAt: Date.now(),
          remainingSeconds: newRem,
          remainingAtStart: newRem,
          isOverdue: false,
          overdueSeconds: active.overdueSeconds ?? 0,
          overdueAtStart: active.overdueAtStart ?? active.overdueSeconds ?? 0,
        }

        setActive(pausedEntry)
        setTimersByTask((m) => ({
          ...m,
          [taskId]: pausedEntry,
        }))
      }

      try {
        const task = getTaskById(taskId)
        const lockData = {
          isLocked: false,
          taskId,
          agentId: selfAgentId,
          taskName: task?.name || "Unknown Task",
        }
        localStorage.setItem(GLOBAL_TIMER_LOCK_KEY, JSON.stringify(lockData))
      } catch (error) {
        console.error("Failed to update global timer lock:", error)
      }
    },
    [active, getTaskById, selfAgentId],
  )

  const stopTimerForTask = useCallback(
    (taskId?: string, reason?: "completed" | "manual") => {
      setActive((prev) => {
        if (!prev) return null
        if (taskId && prev.taskId !== taskId) return prev

        console.log(`[Timer] Stopping timer for task ${prev.taskId}, reason: ${reason}`)

        // Clear from localStorage when stopping
        if (reason === "completed") {
          clearTimerState()
          toast.success(`Timer stopped - task completed!`)
        } else if (reason === "manual") {
          toast.info(`Timer stopped manually`)
        }

        return null // active cleared -> timerState হবে null
      })

      try {
        localStorage.removeItem(GLOBAL_TIMER_LOCK_KEY)
        console.log(`[Timer] Cleared global timer lock`)
      } catch (error) {
        console.error("Failed to clear global timer lock:", error)
      }
    },
    [clearTimerState],
  )

  // Switch dialog handlers
  const onConfirmSwitch = useCallback(() => {
    if (active?.isRunning) {
      const elapsed = active.startedAt ? Math.floor((Date.now() - active.startedAt) / 1000) : 0

      if (active.isOverdue) {
        const newOverdue = (active.overdueAtStart ?? 0) + Math.max(0, elapsed)
        const pausedEntry: TimerEntry = {
          ...active,
          isRunning: false,
          startedAt: undefined,
          pausedAt: Date.now(),
          remainingSeconds: 0,
          remainingAtStart: 0,
          isOverdue: true,
          overdueSeconds: newOverdue,
          overdueAtStart: newOverdue,
        }
        setActive(pausedEntry)
        setTimersByTask((m) => ({
          ...m,
          [active.taskId]: pausedEntry,
        }))
      } else {
        const newRem = Math.max(0, active.remainingAtStart - elapsed)
        const pausedEntry: TimerEntry = {
          ...active,
          isRunning: false,
          startedAt: undefined,
          pausedAt: Date.now(),
          remainingSeconds: newRem,
          remainingAtStart: newRem,
          isOverdue: false,
          overdueSeconds: active.overdueSeconds ?? 0,
          overdueAtStart: active.overdueAtStart ?? active.overdueSeconds ?? 0,
        }
        setActive(pausedEntry)
        setTimersByTask((m) => ({
          ...m,
          [active.taskId]: pausedEntry,
        }))
      }
    }

    if (pendingTaskId) {
      actuallyStart(pendingTaskId)
    }

    setSwitchOpen(false)
    setPendingTaskId(null)
  }, [active, pendingTaskId, actuallyStart])

  const onCancelSwitch = useCallback(() => {
    setSwitchOpen(false)
    setPendingTaskId(null)
  }, [])

  // TaskSwitchAlert props
  const switchAlertProps = useMemo(() => {
    const currentTask = active
      ? {
          id: active.taskId,
          name: getTaskById(active.taskId)?.name ?? "Current Task",
          remainingTime: formatTimerDisplay(Math.max(0, active.remainingSeconds)),
          // NEW: show overdue if any
          overdueTime: active.isOverdue ? formatTimerDisplay(active.overdueSeconds) : undefined,
        }
      : null

    const newTask = pendingTaskId
      ? {
          id: pendingTaskId,
          name: getTaskById(pendingTaskId)?.name ?? "New Task",
        }
      : null

    return {
      isOpen: switchOpen,
      onOpenChange: setSwitchOpen,
      currentTask,
      newTask,
      onConfirm: onConfirmSwitch,
      onCancel: onCancelSwitch,
      selfAgentId,
      lockAgentId,
    }
  }, [active, pendingTaskId, switchOpen, onConfirmSwitch, onCancelSwitch, getTaskById, selfAgentId, lockAgentId])

  // TaskTable props: active timerState
  const timerState: TimerState | null = useMemo(() => {
    if (!active) return null
    return {
      taskId: active.taskId,
      remainingSeconds: active.remainingSeconds,
      isRunning: active.isRunning,
      totalSeconds: active.totalSeconds,
      isOverdue: !!active.isOverdue,
      overdueSeconds: active.overdueSeconds ?? 0,
      isGloballyLocked: false,
      lockedByAgent: selfAgentId,
      startedAt: active.startedAt,
      pausedAt: active.pausedAt,
    }
  }, [active, selfAgentId])

  // Paused remaining map (TaskTimer-এ দেখানোর জন্য)
  const pausedRemainingByTask = useMemo(() => {
    const m: Record<string, number> = {}
    Object.values(timersByTask).forEach((t) => {
      if (!t.isOverdue && typeof t.remainingSeconds === "number") {
        m[t.taskId] = Math.max(0, t.remainingSeconds)
      }
    })
    return m
  }, [timersByTask])

  // NEW: overdue-by-task map (paused অবস্থায়ও দেখাতে)
  const overdueByTask = useMemo(() => {
    const m: Record<string, number> = {}
    Object.values(timersByTask).forEach((t) => {
      if (t.isOverdue) {
        m[t.taskId] = t.overdueSeconds ?? 0
      }
    })
    return m
  }, [timersByTask])

  useEffect(() => {
    if (!active) return

    const currentTask = getTaskById(active.taskId)
    if (!currentTask) return

    // Stop timer if task is completed, qc_approved, or cancelled
    if (["completed", "qc_approved", "cancelled"].includes(currentTask.status)) {
      console.log(`[Timer] Stopping timer for task ${active.taskId} - status changed to ${currentTask.status}`)

      setActive(null)

      // Clear global timer lock
      try {
        localStorage.removeItem(GLOBAL_TIMER_LOCK_KEY)
      } catch (error) {
        console.error("Failed to clear global timer lock:", error)
      }

      // Clear timer state from localStorage
      clearTimerState()

      toast.success(`Timer stopped - task ${currentTask.status === "completed" ? "completed" : currentTask.status}!`)
    }
  }, [active, tasks, getTaskById, clearTimerState])

  return {
    timerState,
    pausedRemainingByTask,
    overdueByTask, // ✅ new map for UI
    onStartTimer,
    onPauseTimer,
    stopTimerForTask, // ✅ export enhanced version
    switchAlertProps,
  }
}

function formatTimerDisplay(seconds: number): string {
  const s = Math.max(0, seconds)
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const secs = s % 60
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}
