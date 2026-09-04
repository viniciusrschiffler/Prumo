import { earliestDate, latestDate } from '@/domain/dates/isoDateMath'
import type { BaselineTask } from '@/domain/schemas/baselineSchema'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { Task } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

type Bound = {
  start: IsoDate | null
  end: IsoDate | null
}

function derivePeriodFromBounds(bounds: readonly Bound[]): DatePeriod | null {
  const starts = bounds.map((bound) => bound.start).filter((start) => start !== null)
  const ends = bounds.map((bound) => bound.end).filter((end) => end !== null)

  if (starts.length === 0 || ends.length === 0) {
    return null
  }

  return {
    start: starts.reduce(earliestDate),
    end: ends.reduce(latestDate),
  }
}

export function deriveProjectPeriod(tasks: readonly Task[]): DatePeriod | null {
  const bounds = tasks
    .filter((task) => task.status !== 'cancelled')
    .map((task) => ({
      start: task.actualStart ?? task.plannedStart,
      end: task.actualEnd ?? task.plannedEnd,
    }))

  return derivePeriodFromBounds(bounds)
}

export function deriveBaselinePeriod(baselineTasks: readonly BaselineTask[]): DatePeriod | null {
  const bounds = baselineTasks.map((baselineTask) => ({
    start: baselineTask.plannedStart,
    end: baselineTask.plannedEnd,
  }))

  return derivePeriodFromBounds(bounds)
}
