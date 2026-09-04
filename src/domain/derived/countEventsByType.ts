import {
  PROJECT_EVENT_TYPES,
  type ProjectEvent,
  type ProjectEventType,
} from '@/domain/schemas/projectEventSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export type EventCountByType = Record<ProjectEventType, number>

function buildEmptyCount(): EventCountByType {
  return Object.fromEntries(PROJECT_EVENT_TYPES.map((type) => [type, 0])) as EventCountByType
}

export function countEventsByType(
  events: readonly ProjectEvent[],
  period: DatePeriod,
): EventCountByType {
  const counts = buildEmptyCount()

  for (const event of events) {
    if (event.eventDate < period.start || event.eventDate > period.end) {
      continue
    }

    counts[event.type] += 1
  }

  return counts
}
