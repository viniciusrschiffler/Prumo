import type { AllocationDetail } from '@/domain/capacity/allocationDetails'
import type { CapacityWindow } from '@/domain/capacity/capacityWindow'
import type { CapacityUnit } from '@/domain/capacity/capacityUnit'

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

const FREE_CELL_MARK = '·'
const INACTIVE_MARK = '—'

export const UNIT_LABELS: Record<CapacityUnit, string> = {
  percentage: '%',
  hours: 'Horas',
}

const UNIT_SUBHEADS: Record<CapacityUnit, string> = {
  percentage: '% da capacidade semanal',
  hours: 'horas da capacidade semanal',
}

function monthOf(date: string): string {
  return MONTH_ABBREVIATIONS[Number(date.slice(5, 7)) - 1] ?? date.slice(5, 7)
}

export function formatWeek(weekNumber: number): string {
  return `S${weekNumber}`
}

export function formatWeekSpan(firstWeekNumber: number, lastWeekNumber: number): string {
  return firstWeekNumber === lastWeekNumber
    ? formatWeek(firstWeekNumber)
    : `${formatWeek(firstWeekNumber)}–${formatWeek(lastWeekNumber)}`
}

export function formatWindowSubhead(window: CapacityWindow, unit: CapacityUnit): string {
  const first = window.weeks[0]
  const last = window.weeks[window.weeks.length - 1]

  if (first === undefined || last === undefined) {
    return UNIT_SUBHEADS[unit]
  }

  const months = `${monthOf(first.period.start)} a ${monthOf(last.period.end)} ${last.period.end.slice(0, 4)}`

  return `${formatWeek(first.number)} → ${formatWeek(last.number)} · ${months} · ${UNIT_SUBHEADS[unit]}`
}

export function formatHours(hours: number): string {
  return `${Math.round(hours)}h`
}

export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`
}

export function formatCellValue(
  percentage: number,
  hours: number,
  unit: CapacityUnit,
  isActive: boolean,
): string {
  if (!isActive) {
    return INACTIVE_MARK
  }

  if (percentage === 0) {
    return FREE_CELL_MARK
  }

  return unit === 'percentage' ? String(Math.round(percentage)) : formatHours(hours)
}

export function formatUnitValue(
  percentage: number,
  hours: number,
  unit: CapacityUnit,
): string {
  return unit === 'percentage' ? formatPercentage(percentage) : formatHours(hours)
}

export function formatAllocationPeriod(detail: AllocationDetail): string {
  return formatWeekSpan(detail.firstWeekNumber, detail.lastWeekNumber)
}

export function describeAllocation(detail: AllocationDetail): string {
  return detail.isProjectPaused ? `${detail.project.name} · pausado` : detail.project.name
}

export function describeCellLoad(percentage: number, isActive: boolean): string {
  if (!isActive) {
    return 'Pessoa inativa'
  }

  if (percentage === 0) {
    return 'Semana livre'
  }

  return percentage > 100
    ? `Excede ${Math.round(percentage - 100)}% da capacidade`
    : 'Dentro da capacidade'
}

export function describeOccupation(usedPercentage: number): string {
  return usedPercentage === 0
    ? 'Sem nada alocado no período.'
    : `${formatPercentage(usedPercentage)} ocupado no período.`
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
