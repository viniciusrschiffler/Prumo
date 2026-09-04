import type { IsoDate } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'

const MILLISECONDS_PER_DAY = 86_400_000

function toUtcTimestamp(date: IsoDate): number {
  const [year, month, day] = date.split('-').map(Number)

  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

export function differenceInDays(from: IsoDate, to: IsoDate): number {
  return (toUtcTimestamp(to) - toUtcTimestamp(from)) / MILLISECONDS_PER_DAY
}

export function earliestDate(first: IsoDate, second: IsoDate): IsoDate {
  return first <= second ? first : second
}

export function latestDate(first: IsoDate, second: IsoDate): IsoDate {
  return first >= second ? first : second
}

export function periodsOverlap(first: DatePeriod, second: DatePeriod): boolean {
  return first.start <= second.end && second.start <= first.end
}

export function intersectPeriods(first: DatePeriod, second: DatePeriod): DatePeriod | null {
  if (!periodsOverlap(first, second)) {
    return null
  }

  return {
    start: latestDate(first.start, second.start),
    end: earliestDate(first.end, second.end),
  }
}
