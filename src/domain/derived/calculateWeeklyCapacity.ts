import { periodsOverlap } from '@/domain/dates/isoDateMath'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

const FULL_ALLOCATION_PERCENTAGE = 100

export type PersonCapacity = {
  percentage: number
  hours: number
}

export function calculateWeeklyCapacity(
  person: Person,
  allocations: readonly Allocation[],
  week: DatePeriod,
): PersonCapacity {
  const percentage = allocations
    .filter((allocation) => allocation.personId === person.id)
    .filter((allocation) => allocation.endedAt === null)
    .filter((allocation) =>
      periodsOverlap({ start: allocation.startDate, end: allocation.endDate }, week),
    )
    .reduce((total, allocation) => total + allocation.percentage, 0)

  return {
    percentage,
    hours: (percentage / FULL_ALLOCATION_PERCENTAGE) * person.weeklyCapacityHours,
  }
}

export function isOverallocated(capacity: PersonCapacity): boolean {
  return capacity.percentage > FULL_ALLOCATION_PERCENTAGE
}
