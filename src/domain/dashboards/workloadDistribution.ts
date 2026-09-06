import { calculateWeeklyCapacity } from '@/domain/derived/calculateWeeklyCapacity'
import { sumTeamWeeklyCapacity } from '@/domain/derived/sumTeamWeeklyCapacity'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

const FULL_ALLOCATION_PERCENTAGE = 100

export type WorkloadRow = {
  person: Person
  averagePercentage: number
  averageHours: number
}

function averageOf(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length
}

// A carga média conta só pessoa ativa: emprestar a capacidade de quem saiu diluiria o número
// com horas que ninguém pode gastar. É a mesma regra da tela de Capacidade.
export function buildWorkloadDistribution(
  people: readonly Person[],
  allocations: readonly Allocation[],
  weeks: readonly DatePeriod[],
): WorkloadRow[] {
  return people
    .filter((person) => person.active)
    .map((person) => {
      const weekly = weeks.map((week) => calculateWeeklyCapacity(person, allocations, week))
      const averagePercentage = averageOf(weekly.map((capacity) => capacity.percentage))

      return {
        person,
        averagePercentage,
        averageHours: averageOf(weekly.map((capacity) => capacity.hours)),
      }
    })
    .toSorted(
      (first, second) =>
        second.averagePercentage - first.averagePercentage ||
        first.person.name.localeCompare(second.person.name, 'pt-BR'),
    )
}

export function calculateCapacityUsage(
  rows: readonly WorkloadRow[],
  people: readonly Person[],
): number {
  const teamCapacity = sumTeamWeeklyCapacity(people)

  if (teamCapacity === 0) {
    return 0
  }

  const usedHours = rows.reduce((total, row) => total + row.averageHours, 0)

  return (usedHours / teamCapacity) * FULL_ALLOCATION_PERCENTAGE
}

export function isOverloaded(row: WorkloadRow): boolean {
  return row.averagePercentage > FULL_ALLOCATION_PERCENTAGE
}
