import { addDays } from '@/domain/dates/isoDateMath'
import { effectiveEndOf } from '@/domain/derived/calculateWeeklyCapacity'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import type { ProjectActivity } from './dashboardActivity'

export type ProjectAllocationRow = {
  projectId: EntityId
  name: string
  phaseColor: string | null
  peakPercentage: number
  personCount: number
  allocationCount: number
  isBlocked: boolean
  isPaused: boolean
}

function isLiveOn(allocation: Allocation, date: IsoDate): boolean {
  return allocation.startDate <= date && date <= effectiveEndOf(allocation)
}

function listBoundaries(
  allocations: readonly Allocation[],
  period: DatePeriod,
): IsoDate[] {
  const boundaries = allocations.flatMap((allocation) => [
    allocation.startDate,
    addDays(effectiveEndOf(allocation), 1),
  ])

  return [...new Set(boundaries)].filter(
    (date) => date >= period.start && date <= period.end,
  )
}

// Somar tudo que passou pelo projeto na janela contaria três vezes a mesma pessoa que trocou
// de alocação duas vezes. O que a barra mede é o pico simultâneo, a mesma leitura por dia que
// `calculateWeeklyCapacity` e a varredura de conflito já usam.
export function peakPercentageIn(
  allocations: readonly Allocation[],
  period: DatePeriod,
): number {
  const dates = [period.start, ...listBoundaries(allocations, period)]

  return dates.reduce(
    (peak, date) =>
      Math.max(
        peak,
        allocations
          .filter((allocation) => isLiveOn(allocation, date))
          .reduce((total, allocation) => total + allocation.percentage, 0),
      ),
    0,
  )
}

function toRow(activity: ProjectActivity, period: DatePeriod): ProjectAllocationRow {
  const { project } = activity.row

  return {
    projectId: project.id,
    name: project.name,
    phaseColor: activity.row.currentPhase?.color ?? null,
    peakPercentage: peakPercentageIn(activity.allocationsInPeriod, period),
    personCount: new Set(activity.allocationsInPeriod.map((allocation) => allocation.personId))
      .size,
    allocationCount: activity.allocationsInPeriod.length,
    isBlocked: project.status === 'blocked',
    isPaused: project.pausedAt !== null,
  }
}

function compareByLoadThenName(first: ProjectAllocationRow, second: ProjectAllocationRow): number {
  return (
    second.peakPercentage - first.peakPercentage ||
    first.name.localeCompare(second.name, 'pt-BR')
  )
}

export function buildAllocationByProject(
  activities: readonly ProjectActivity[],
  period: DatePeriod,
): ProjectAllocationRow[] {
  return activities.map((activity) => toRow(activity, period)).toSorted(compareByLoadThenName)
}

export function sumAllocations(rows: readonly ProjectAllocationRow[]): number {
  return rows.reduce((total, row) => total + row.allocationCount, 0)
}
