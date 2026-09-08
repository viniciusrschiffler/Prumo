import { formatIsoDate } from '@/domain/format/displayDate'
import type { DashboardPeriodKey } from '@/domain/dashboards/dashboardPeriod'
import type { PhaseBottleneck } from '@/domain/dashboards/phaseDurations'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'

const MONTH_ABBREVIATIONS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriodKey, string> = {
  '30d': '30 dias',
  '90d': '90 dias',
  '12m': '12 meses',
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function formatMonthAbbreviation(monthStart: IsoDate): string {
  return MONTH_ABBREVIATIONS[Number(monthStart.slice(5, 7)) - 1] ?? ''
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export function formatHours(hours: number): string {
  return `${Math.round(hours).toLocaleString('pt-BR')}h`
}

export function formatDays(days: number): string {
  return `${days}d`
}

export function formatDeviationDays(days: number | null): string {
  if (days === null) {
    return '—'
  }

  return days > 0 ? `+${days}d` : `${days}d`
}

export function formatSubhead(
  periodKey: DashboardPeriodKey,
  period: DatePeriod,
  projectCount: number,
): string {
  return [
    DASHBOARD_PERIOD_LABELS[periodKey],
    `desde ${formatIsoDate(period.start)}`,
    `${pluralize(projectCount, 'projeto', 'projetos')} com atividade`,
  ].join(' · ')
}

// O mockup compara o gargalo com a primeira fase e a chama de desenvolvimento. Quem responde
// pela comparação é `findPhaseBottleneck`, que confronta a mais lenta com a mais rápida.
export function formatBottleneck(bottleneck: PhaseBottleneck): string {
  const ratio = bottleneck.ratio.toFixed(1).replace('.', ',')

  return `${bottleneck.slowest.name} é o gargalo: ${ratio}× o tempo de ${bottleneck.fastest.name.toLocaleLowerCase('pt-BR')}.`
}
