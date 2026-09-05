import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { EntityId } from '@/domain/schemas/primitives'

// Alocação encerrada nunca é deletada: o que a separa de uma ativa é o ended_at preenchido.
export function countActiveAllocationsByPerson(
  allocations: readonly Allocation[],
): Map<EntityId, number> {
  const countByPerson = new Map<EntityId, number>()

  for (const allocation of allocations) {
    if (allocation.endedAt !== null) {
      continue
    }

    countByPerson.set(allocation.personId, (countByPerson.get(allocation.personId) ?? 0) + 1)
  }

  return countByPerson
}

export function countAllocationsByPerson(
  allocations: readonly Allocation[],
): Map<EntityId, number> {
  const countByPerson = new Map<EntityId, number>()

  for (const allocation of allocations) {
    countByPerson.set(allocation.personId, (countByPerson.get(allocation.personId) ?? 0) + 1)
  }

  return countByPerson
}
