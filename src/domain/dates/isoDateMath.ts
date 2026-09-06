import type { IsoDate, IsoDateTime } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'

const MILLISECONDS_PER_DAY = 86_400_000
const MONTHS_PER_QUARTER = 3

function toUtcTimestamp(date: IsoDate): number {
  const [year, month, day] = date.split('-').map(Number)

  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

export function differenceInDays(from: IsoDate, to: IsoDate): number {
  return (toUtcTimestamp(to) - toUtcTimestamp(from)) / MILLISECONDS_PER_DAY
}

function toIsoDate(timestamp: number): IsoDate {
  return new Date(timestamp).toISOString().slice(0, 10)
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return toIsoDate(toUtcTimestamp(date) + days * MILLISECONDS_PER_DAY)
}

// 0 é domingo no getUTCDay, e a semana do usuário pode começar na segunda.
export function startOfWeek(date: IsoDate, firstWeekday: 'monday' | 'sunday'): IsoDate {
  const weekday = new Date(toUtcTimestamp(date)).getUTCDay()
  const offset = firstWeekday === 'sunday' ? weekday : (weekday + 6) % 7

  return addDays(date, -offset)
}

export function weekPeriod(date: IsoDate, firstWeekday: 'monday' | 'sunday'): DatePeriod {
  const start = startOfWeek(date, firstWeekday)

  return { start, end: addDays(start, 6) }
}

export function startOfMonth(date: IsoDate): IsoDate {
  return `${date.slice(0, 7)}-01`
}

// O dia é preservado quando o mês de destino o comporta, e encurtado quando não: 31/01 mais
// um mês é 28/02, não 03/03 como o Date faz sozinho.
export function addMonths(date: IsoDate, months: number): IsoDate {
  const [year, month, day] = date.split('-').map(Number)
  const monthsFromYearZero = (year ?? 0) * 12 + (month ?? 1) - 1 + months
  const targetYear = Math.floor(monthsFromYearZero / 12)
  const targetMonth = monthsFromYearZero - targetYear * 12
  const lastDayOfTarget = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()

  return toIsoDate(Date.UTC(targetYear, targetMonth, Math.min(day ?? 1, lastDayOfTarget)))
}

export function startOfQuarter(date: IsoDate): IsoDate {
  const month = Number(date.slice(5, 7))

  return addMonths(startOfMonth(date), -((month - 1) % MONTHS_PER_QUARTER))
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

export function weekdayIndex(date: IsoDate): number {
  return new Date(toUtcTimestamp(date)).getUTCDay()
}

export function toIsoDateOf(timestamp: IsoDateTime): IsoDate {
  return timestamp.split('T')[0] ?? timestamp
}
