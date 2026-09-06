import {
  addDays,
  addMonths,
  differenceInDays,
  earliestDate,
  latestDate,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from '@/domain/dates/isoDateMath'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { WeekStart } from '@/domain/settings/appSettings'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export const TIMELINE_ZOOMS = ['week', 'month', 'quarter'] as const

export type TimelineZoom = (typeof TIMELINE_ZOOMS)[number]

const DAYS_PER_WEEK = 7
const MONTHS_PER_QUARTER = 3

export type TimelineTick = {
  start: IsoDate
  offsetDays: number
  days: number
  isCurrent: boolean
}

export type TimelineWindow = {
  period: DatePeriod
  spanDays: number
  zoom: TimelineZoom
  ticks: readonly TimelineTick[]
}

function snapStart(date: IsoDate, zoom: TimelineZoom, weekStart: WeekStart): IsoDate {
  if (zoom === 'week') {
    return startOfWeek(date, weekStart)
  }

  return zoom === 'month' ? startOfMonth(date) : startOfQuarter(date)
}

function nextTickStart(start: IsoDate, zoom: TimelineZoom): IsoDate {
  if (zoom === 'week') {
    return addDays(start, DAYS_PER_WEEK)
  }

  return addMonths(start, zoom === 'month' ? 1 : MONTHS_PER_QUARTER)
}

function unionOf(periods: readonly DatePeriod[], today: IsoDate): DatePeriod {
  return periods.reduce<DatePeriod>(
    (union, period) => ({
      start: earliestDate(union.start, period.start),
      end: latestDate(union.end, period.end),
    }),
    { start: today, end: today },
  )
}

function buildTicks(
  period: DatePeriod,
  zoom: TimelineZoom,
  weekStart: WeekStart,
  today: IsoDate,
): TimelineTick[] {
  const ticks: TimelineTick[] = []
  let start = snapStart(period.start, zoom, weekStart)

  while (start <= period.end) {
    const next = nextTickStart(start, zoom)

    ticks.push({
      start,
      offsetDays: differenceInDays(period.start, start),
      days: differenceInDays(start, next),
      isCurrent: start <= today && today < next,
    })

    start = next
  }

  return ticks
}

// O marcador de hoje entra na união mesmo sem projeto por perto, senão o "Ir para hoje" levaria
// a um ponto fora da janela desenhada.
export function buildTimelineWindow(
  periods: readonly DatePeriod[],
  zoom: TimelineZoom,
  today: IsoDate,
  weekStart: WeekStart,
): TimelineWindow | null {
  if (periods.length === 0) {
    return null
  }

  const union = unionOf(periods, today)
  const start = snapStart(union.start, zoom, weekStart)
  const ticks = buildTicks({ start, end: union.end }, zoom, weekStart, today)
  const lastTick = ticks[ticks.length - 1]

  if (lastTick === undefined) {
    return null
  }

  const end = addDays(start, lastTick.offsetDays + lastTick.days - 1)

  return {
    period: { start, end },
    spanDays: differenceInDays(start, end) + 1,
    zoom,
    ticks,
  }
}
