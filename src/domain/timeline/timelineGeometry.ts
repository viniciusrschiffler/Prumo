import { addDays, differenceInDays, earliestDate, latestDate } from '@/domain/dates/isoDateMath'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import type { TimelineWindow } from './timelineWindow'

const PERCENT = 100

export type BarGeometry = {
  leftPercent: number
  widthPercent: number
}

function toPercent(days: number, spanDays: number): number {
  return (days / spanDays) * PERCENT
}

// A barra termina no começo do dia de fim, e não no fim dele: é o que faz o traço parar na
// linha de grade do mês seguinte quando a tarefa vai até o último dia do mês.
export function toBarGeometry(window: TimelineWindow, period: DatePeriod): BarGeometry | null {
  const exclusiveEnd = addDays(window.period.end, 1)

  if (period.end < window.period.start || period.start > window.period.end) {
    return null
  }

  const start = latestDate(period.start, window.period.start)
  const end = latestDate(start, earliestDate(period.end, exclusiveEnd))

  return {
    leftPercent: toPercent(differenceInDays(window.period.start, start), window.spanDays),
    widthPercent: toPercent(differenceInDays(start, end), window.spanDays),
  }
}

export function toMarkerPercent(window: TimelineWindow, date: IsoDate): number | null {
  if (date < window.period.start || date > window.period.end) {
    return null
  }

  return toPercent(differenceInDays(window.period.start, date), window.spanDays)
}

export function toOffsetDays(window: TimelineWindow, trackRatio: number): number {
  return Math.round(trackRatio * window.spanDays)
}
