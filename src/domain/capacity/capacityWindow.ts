import { addDays, isoWeekNumber, startOfWeek } from '@/domain/dates/isoDateMath'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { WeekStart } from '@/domain/settings/appSettings'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export const CAPACITY_WEEK_COUNT = 12

const DAYS_PER_WEEK = 7

export type CapacityWeek = {
  index: number
  number: number
  period: DatePeriod
  isCurrent: boolean
}

export type CapacityWindow = {
  period: DatePeriod
  weeks: readonly CapacityWeek[]
}

// A janela olha para frente a partir da semana corrente: o passado já foi gasto e não há
// realocação que o mude, então o que a tela decide é sempre daqui em diante.
export function buildCapacityWindow(today: IsoDate, weekStart: WeekStart): CapacityWindow {
  const firstWeekStart = startOfWeek(today, weekStart)

  const weeks = Array.from({ length: CAPACITY_WEEK_COUNT }, (_unused, index) => {
    const start = addDays(firstWeekStart, index * DAYS_PER_WEEK)

    return {
      index,
      number: isoWeekNumber(start),
      period: { start, end: addDays(start, DAYS_PER_WEEK - 1) },
      isCurrent: index === 0,
    }
  })

  const lastWeek = weeks[weeks.length - 1]

  return {
    period: { start: firstWeekStart, end: lastWeek?.period.end ?? firstWeekStart },
    weeks,
  }
}

export function findWeekByIndex(window: CapacityWindow, index: number): CapacityWeek | null {
  return window.weeks[index] ?? null
}

export function spanWeeks(
  window: CapacityWindow,
  fromIndex: number,
  toIndex: number,
): DatePeriod | null {
  const from = findWeekByIndex(window, fromIndex)
  const to = findWeekByIndex(window, toIndex)

  if (from === null || to === null) {
    return null
  }

  return { start: from.period.start, end: to.period.end }
}
