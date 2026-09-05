import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import { listActivePersonIds } from './listActivePersonIds'

export type PeopleSummary = {
  people: Person[]
  hasOnlyEndedAllocations: boolean
}

function compareByName(first: Person, second: Person): number {
  return first.name.localeCompare(second.name, 'pt-BR')
}

// Alocação encerrada nunca é deletada, então "sem ninguém" e "todo mundo foi encerrado" são
// estados diferentes: o segundo é o "0 · encerradas" que a tela mostra no projeto bloqueado.
export function derivePeopleSummary(
  taskIds: readonly EntityId[],
  allocations: readonly Allocation[],
  people: readonly Person[],
): PeopleSummary {
  const taskIdSet = new Set(taskIds)
  const ownAllocations = allocations.filter((allocation) => taskIdSet.has(allocation.taskId))
  const activePersonIds = new Set(listActivePersonIds(ownAllocations))

  return {
    people: people.filter((person) => activePersonIds.has(person.id)).toSorted(compareByName),
    hasOnlyEndedAllocations: activePersonIds.size === 0 && ownAllocations.length > 0,
  }
}
