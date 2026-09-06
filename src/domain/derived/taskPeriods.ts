import type { Task } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export function toTaskPeriod(task: Task): DatePeriod | null {
  const start = task.actualStart ?? task.plannedStart
  const end = task.actualEnd ?? task.plannedEnd

  if (start === null || end === null || end < start) {
    return null
  }

  return { start, end }
}

export function toPlannedPeriod(task: Task): DatePeriod | null {
  if (
    task.plannedStart === null ||
    task.plannedEnd === null ||
    task.plannedEnd < task.plannedStart
  ) {
    return null
  }

  return { start: task.plannedStart, end: task.plannedEnd }
}
