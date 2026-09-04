import { differenceInDays, intersectPeriods } from '@/domain/dates/isoDateMath'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'

const BLOCKING_TYPES = new Set(['block', 'unblock'])

function compareByDateThenBlockFirst(first: ProjectEvent, second: ProjectEvent): number {
  if (first.eventDate !== second.eventDate) {
    return first.eventDate < second.eventDate ? -1 : 1
  }

  if (first.type === second.type) {
    return 0
  }

  return first.type === 'block' ? -1 : 1
}

function collectBlockedPeriods(events: readonly ProjectEvent[], openEnd: IsoDate): DatePeriod[] {
  const ordered = events
    .filter((event) => BLOCKING_TYPES.has(event.type))
    .toSorted(compareByDateThenBlockFirst)

  const periods: DatePeriod[] = []
  let blockedSince: IsoDate | null = null

  for (const event of ordered) {
    if (event.type === 'block' && blockedSince === null) {
      blockedSince = event.eventDate
      continue
    }

    if (event.type === 'unblock' && blockedSince !== null) {
      periods.push({ start: blockedSince, end: event.eventDate })
      blockedSince = null
    }
  }

  if (blockedSince !== null) {
    periods.push({ start: blockedSince, end: openEnd })
  }

  return periods
}

export function calculateBlockedDays(events: readonly ProjectEvent[], period: DatePeriod): number {
  return collectBlockedPeriods(events, period.end)
    .map((blocked) => intersectPeriods(blocked, period))
    .filter((blocked) => blocked !== null)
    .reduce((total, blocked) => total + differenceInDays(blocked.start, blocked.end), 0)
}
