import { differenceInDays } from '@/domain/dates/isoDateMath'
import { formatIsoDate, formatIsoDayMonth } from '@/domain/format/displayDate'
import type { TimelineGrouping } from '@/domain/timeline/timelineRows'
import type { TimelineTick, TimelineWindow, TimelineZoom } from '@/domain/timeline/timelineWindow'
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

const MONTHS_PER_QUARTER = 3

export const GROUPING_LABELS: Record<TimelineGrouping, string> = {
  project: 'Projeto',
  person: 'Pessoa',
  phase: 'Fase',
}

export const ZOOM_LABELS: Record<TimelineZoom, string> = {
  week: 'Semana',
  month: 'Mês',
  quarter: 'Trimestre',
}

export const AXIS_LABELS: Record<TimelineGrouping, string> = {
  project: 'Projeto / tarefa',
  person: 'Pessoa / alocação',
  phase: 'Fase / projeto',
}

export function formatTickLabel(tick: TimelineTick, zoom: TimelineZoom): string {
  const monthIndex = Number(tick.start.slice(5, 7)) - 1

  if (zoom === 'week') {
    return `${tick.start.slice(8, 10)}/${tick.start.slice(5, 7)}`
  }

  if (zoom === 'quarter') {
    return `T${Math.floor(monthIndex / MONTHS_PER_QUARTER) + 1} ${tick.start.slice(0, 4)}`
  }

  return MONTH_ABBREVIATIONS[monthIndex] ?? tick.start.slice(5, 7)
}

function countMonths(period: DatePeriod): number {
  const monthOf = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7))

  return monthOf(period.end) - monthOf(period.start) + 1
}

export function formatWindowSubhead(window: TimelineWindow): string {
  const months = countMonths(window.period)

  return `${formatIsoDate(window.period.start)} → ${formatIsoDate(window.period.end)} · ${
    months === 1 ? '1 mês' : `${months} meses`
  }`
}

const GROUP_COUNT_LABELS: Record<TimelineGrouping, readonly [string, string]> = {
  project: ['projeto', 'projetos'],
  person: ['pessoa', 'pessoas'],
  phase: ['fase', 'fases'],
}

const ITEM_COUNT_LABELS: Record<TimelineGrouping, readonly [string, string]> = {
  project: ['tarefa visível', 'tarefas visíveis'],
  person: ['alocação', 'alocações'],
  phase: ['barra', 'barras'],
}

function pluralize(count: number, labels: readonly [string, string]): string {
  return `${count} ${count === 1 ? labels[0] : labels[1]}`
}

export function formatRowCounts(
  grouping: TimelineGrouping,
  groupCount: number,
  itemCount: number,
): string {
  return `${pluralize(groupCount, GROUP_COUNT_LABELS[grouping])} · ${pluralize(
    itemCount,
    ITEM_COUNT_LABELS[grouping],
  )}`
}

export function formatConflictCount(count: number): string {
  return count === 1 ? '1 conflito de alocação' : `${count} conflitos de alocação`
}

export function formatDragLabel(title: string, period: DatePeriod): string {
  return `${title} · ${formatIsoDayMonth(period.start)} → ${formatIsoDayMonth(
    period.end,
  )} · ${differenceInDays(period.start, period.end)}d`
}

export function formatOverloadLabel(percentage: number, start: string): string {
  return `${percentage}% ${MONTH_ABBREVIATIONS[Number(start.slice(5, 7)) - 1] ?? ''}`.trim()
}

export function formatBlockedBadge(days: number): string {
  return `bloq. ${days}d`
}
