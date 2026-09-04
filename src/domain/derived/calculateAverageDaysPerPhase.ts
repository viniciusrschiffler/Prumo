import { differenceInDays } from '@/domain/dates/isoDateMath'
import type { EntityId } from '@/domain/schemas/primitives'
import type { Task } from '@/domain/schemas/taskSchema'

export type PhaseDuration = {
  phaseId: EntityId
  averageDays: number
  taskCount: number
}

function measureTaskDays(task: Task): number | null {
  const start = task.actualStart ?? task.plannedStart
  const end = task.actualEnd ?? task.plannedEnd

  if (start === null || end === null) {
    return null
  }

  return differenceInDays(start, end)
}

export function calculateAverageDaysPerPhase(tasks: readonly Task[]): PhaseDuration[] {
  const daysByPhase = new Map<EntityId, number[]>()

  for (const task of tasks) {
    if (task.status === 'cancelled') {
      continue
    }

    const days = measureTaskDays(task)

    if (days === null) {
      continue
    }

    daysByPhase.set(task.phaseId, [...(daysByPhase.get(task.phaseId) ?? []), days])
  }

  return [...daysByPhase].map(([phaseId, allDays]) => ({
    phaseId,
    averageDays: allDays.reduce((total, days) => total + days, 0) / allDays.length,
    taskCount: allDays.length,
  }))
}
