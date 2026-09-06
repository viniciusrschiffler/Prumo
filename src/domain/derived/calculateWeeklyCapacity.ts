import { addDays, differenceInDays } from '@/domain/dates/isoDateMath'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'

const FULL_ALLOCATION_PERCENTAGE = 100

export type PersonCapacity = {
  percentage: number
  hours: number
}

// Encerrar uma alocação num dia é substituí-la nesse dia, não somar as duas: a realocação
// abre a nova na mesma data em que fecha a antiga, e contar o dia duas vezes inventaria uma
// sobrecarga de 24 horas. É a mesma regra da varredura de conflito.
export function effectiveEndOf(allocation: Allocation): IsoDate {
  if (allocation.endedAt === null) {
    return allocation.endDate
  }

  const endedOn = addDays(allocation.endedAt.slice(0, 10), -1)

  return endedOn < allocation.endDate ? endedOn : allocation.endDate
}

function sumPercentageOn(allocations: readonly Allocation[], date: IsoDate): number {
  return allocations
    .filter((allocation) => allocation.startDate <= date && date <= effectiveEndOf(allocation))
    .reduce((total, allocation) => total + allocation.percentage, 0)
}

// A semana vale o pico dos dias dela, não a soma de tudo que a cruza. Duas alocações que se
// revezam dentro da mesma semana nunca dividiram um dia, e somá-las pintaria de vermelho uma
// semana em que ninguém passou da capacidade — a varredura de conflito já responde por dia,
// e a matriz precisa dizer a mesma coisa que ela.
export function calculateWeeklyCapacity(
  person: Person,
  allocations: readonly Allocation[],
  week: DatePeriod,
): PersonCapacity {
  const own = allocations.filter((allocation) => allocation.personId === person.id)
  const dayCount = differenceInDays(week.start, week.end) + 1

  const percentage = Array.from({ length: dayCount }, (_unused, offset) =>
    addDays(week.start, offset),
  ).reduce((peak, date) => Math.max(peak, sumPercentageOn(own, date)), 0)

  return {
    percentage,
    hours: (percentage / FULL_ALLOCATION_PERCENTAGE) * person.weeklyCapacityHours,
  }
}

export function isOverallocated(capacity: PersonCapacity): boolean {
  return capacity.percentage > FULL_ALLOCATION_PERCENTAGE
}
