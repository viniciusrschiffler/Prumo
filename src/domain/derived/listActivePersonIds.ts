import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { EntityId } from '@/domain/schemas/primitives'

export function listActivePersonIds(allocations: readonly Allocation[]): EntityId[] {
  const personIds = allocations
    .filter((allocation) => allocation.endedAt === null)
    .map((allocation) => allocation.personId)

  return [...new Set(personIds)]
}
