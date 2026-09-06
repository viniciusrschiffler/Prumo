import { countEventsByType } from '@/domain/derived/countEventsByType'
import {
  PROJECT_EVENT_TYPES,
  type ProjectEventType,
} from '@/domain/schemas/projectEventSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import type { ProjectActivity } from './dashboardActivity'

export type EventTypeCount = {
  type: ProjectEventType
  count: number
}

export function buildEventTypeCounts(
  activities: readonly ProjectActivity[],
  period: DatePeriod,
): EventTypeCount[] {
  const counts = countEventsByType(
    activities.flatMap((activity) => activity.events),
    period,
  )

  return PROJECT_EVENT_TYPES.map((type) => ({ type, count: counts[type] }))
}

export function sumEvents(counts: readonly EventTypeCount[]): number {
  return counts.reduce((total, entry) => total + entry.count, 0)
}
