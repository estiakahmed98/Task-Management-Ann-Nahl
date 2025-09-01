/**
 * Working Days Utility
 * Calculates business days excluding weekends (Saturday and Sunday)
 */

/**
 * Check if a date falls on a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

/**
 * Add working days to a date, excluding weekends
 * @param startDate - The starting date
 * @param workingDays - Number of working days to add
 * @returns New date with working days added
 */
export function addWorkingDays(startDate: Date, workingDays: number): Date {
  const result = new Date(startDate)
  let daysToAdd = workingDays

  while (daysToAdd > 0) {
    result.setDate(result.getDate() + 1)

    // Only count if it's not a weekend
    if (!isWeekend(result)) {
      daysToAdd--
    }
  }

  return result
}

/**
 * Add calendar days to a date (includes weekends)
 * @param startDate - The starting date
 * @param days - Number of calendar days to add
 * @returns New date with days added
 */
export function addCalendarDays(startDate: Date, days: number): Date {
  const result = new Date(startDate)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Calculate due date for task cycles based on business requirements:
 * - First cycle: 15 calendar days after asset creation
 * - Subsequent cycles: 7 working days after previous cycle
 *
 * @param assetCreatedAt - When the asset was created
 * @param cycleNumber - The cycle number (1, 2, 3, etc.)
 * @returns Due date for the cycle
 */
export function calculateTaskDueDate(assetCreatedAt: Date, cycleNumber: number): Date {
  if (cycleNumber === 1) {
    // First cycle: 15 calendar days after asset creation
    return addCalendarDays(assetCreatedAt, 15)
  } else {
    // Subsequent cycles: 7 working days after the previous cycle's due date
    const previousCycleDueDate = calculateTaskDueDate(assetCreatedAt, cycleNumber - 1)
    return addWorkingDays(previousCycleDueDate, 7)
  }
}

/**
 * Extract cycle number from task name (e.g., "Task Name -2" returns 2)
 * @param taskName - The task name with cycle suffix
 * @returns Cycle number or 1 if no suffix found
 */
export function extractCycleNumber(taskName: string): number {
  const match = taskName.match(/\s*-\s*(\d+)$/i)
  return match ? Number.parseInt(match[1], 10) : 1
}
