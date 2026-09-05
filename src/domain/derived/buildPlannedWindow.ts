import { differenceInDays } from '@/domain/dates/isoDateMath'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'

const DAYS_PER_WEEK = 7

export type PlannedWindow = {
  period: DatePeriod
  weeks: number
}

export function buildPlannedWindow(
  start: IsoDate | null,
  end: IsoDate | null,
): PlannedWindow | null {
  if (start === null || end === null || end < start) {
    return null
  }

  return {
    period: { start, end },
    weeks: Math.max(1, Math.ceil(differenceInDays(start, end) / DAYS_PER_WEEK)),
  }
}
