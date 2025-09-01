// export interface Task {
//   id: number;
//   link: string;
//   username: string;
//   email: string;
//   password: string;
//   status: "pending" | "completed" | "not-completed";
//   timeAllotted: number;
//   timeRemaining: number | null;
//   timerActive: boolean;
//   timerExpired: boolean;
//   extraTimeSpent: number;
//   totalTimeSpent: number;
// }

export interface TabData {
  id: string;
  title: string;
  links: {
    id: number;
    link: string;
    username: string;
    email: string;
    password: string;
  }[];
}



// Task-related type definitions
export interface Task {
  id: string
  name: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled" | "reassigned" | "qc_approved"
  dueDate: string | null
  idealDurationMinutes: number | null
  description?: string
  completionLink?: string
  performanceRating?: "Excellent" | "Good" | "Average" | "Lazy"
  assignedAgent?: string
  createdAt?: string
  updatedAt?: string
}

export interface TaskStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  cancelled: number
  reassigned: number
  qc_approved: number
}

export interface TimerState {
  taskId: string
  remainingSeconds: number
  isRunning: boolean
  totalSeconds: number
  isGloballyLocked: boolean
  lockedByAgent?: string
  startedAt?: number
  pausedAt?: number
  accumulatedSeconds?: number
}

export interface GlobalTimerLock {
  isLocked: boolean
  taskId: string | null
  agentId: string | null
  taskName: string | null
}
