import { addDays, addMonths, startOfWeek } from '@/domain/dates/isoDateMath'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { WeekStart } from '@/domain/settings/appSettings'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export const DASHBOARD_PERIOD_KEYS = ['30d', '90d', '12m'] as const

export type DashboardPeriodKey = (typeof DASHBOARD_PERIOD_KEYS)[number]

export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriodKey = '90d'

const DAYS_PER_WEEK = 7
const DAYS_BACK: Record<DashboardPeriodKey, number> = { '30d': 30, '90d': 90, '12m': 0 }
const MONTHS_BACK: Record<DashboardPeriodKey, number> = { '30d': 0, '90d': 0, '12m': 12 }

// A janela olha para trás a partir de hoje: o painel mede o que já aconteceu, ao contrário
// da Capacidade, que decide o que ainda vai acontecer.
export function buildDashboardPeriod(today: IsoDate, key: DashboardPeriodKey): DatePeriod {
  const start = addMonths(addDays(today, -DAYS_BACK[key]), -MONTHS_BACK[key])

  return { start, end: today }
}

// A semana entra inteira dos dois lados da divisão: medir carga de meia semana contra a
// capacidade de uma semana cheia derrubaria o uso médio sem que ninguém tivesse trabalhado menos.
export function listWeeksIn(period: DatePeriod, weekStart: WeekStart): DatePeriod[] {
  const firstStart = startOfWeek(period.start, weekStart)
  const weeks: DatePeriod[] = []

  for (let start = firstStart; start <= period.end; start = addDays(start, DAYS_PER_WEEK)) {
    weeks.push({ start, end: addDays(start, DAYS_PER_WEEK - 1) })
  }

  return weeks
}
