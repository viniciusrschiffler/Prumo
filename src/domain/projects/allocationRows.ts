import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { Task } from '@/domain/schemas/taskSchema'

const FULL_ALLOCATION_PERCENTAGE = 100

export type AllocationRow = {
  allocation: Allocation
  person: Person | null
  task: Task | null
  consumedWeeklyHours: number
  isEnded: boolean
}

// A capacidade da coluna é o que esta alocação consome por semana, não a capacidade crua da
// pessoa: o percentual já está na coluna ao lado e repeti-lo em horas não diria nada novo.
function consumedWeeklyHours(allocation: Allocation, person: Person | null): number {
  if (person === null) {
    return 0
  }

  return (allocation.percentage / FULL_ALLOCATION_PERCENTAGE) * person.weeklyCapacityHours
}

function compareRows(first: AllocationRow, second: AllocationRow): number {
  if (first.isEnded !== second.isEnded) {
    return first.isEnded ? 1 : -1
  }

  const byPerson = (first.person?.name ?? '').localeCompare(second.person?.name ?? '', 'pt-BR')

  if (byPerson !== 0) {
    return byPerson
  }

  return first.allocation.startDate.localeCompare(second.allocation.startDate)
}

// A alocação encerrada nunca é deletada e continua na tabela, esmaecida e depois das
// abertas: some dela é o histórico de quem já esteve no projeto.
export function buildAllocationRows(
  taskIds: readonly EntityId[],
  allocations: readonly Allocation[],
  tasks: readonly Task[],
  people: readonly Person[],
): AllocationRow[] {
  const taskIdSet = new Set(taskIds)
  const tasksById = new Map(tasks.map((task) => [task.id, task]))
  const peopleById = new Map(people.map((person) => [person.id, person]))

  return allocations
    .filter((allocation) => taskIdSet.has(allocation.taskId))
    .map((allocation) => {
      const person = peopleById.get(allocation.personId) ?? null

      return {
        allocation,
        person,
        task: tasksById.get(allocation.taskId) ?? null,
        consumedWeeklyHours: consumedWeeklyHours(allocation, person),
        isEnded: allocation.endedAt !== null,
      }
    })
    .toSorted(compareRows)
}

export function countOpenAllocations(rows: readonly AllocationRow[]): number {
  return rows.filter((row) => !row.isEnded).length
}

// O chip de pessoa na linha da tarefa mostra o percentual da alocação aberta. A encerrada
// não entra: ela já não consome capacidade e a pessoa nem aparece mais na linha.
export function mapOpenPercentagesByTask(
  rows: readonly AllocationRow[],
): Map<EntityId, Map<EntityId, number>> {
  const byTask = new Map<EntityId, Map<EntityId, number>>()

  for (const row of rows) {
    if (row.isEnded) {
      continue
    }

    const byPerson = byTask.get(row.allocation.taskId) ?? new Map<EntityId, number>()

    byPerson.set(
      row.allocation.personId,
      (byPerson.get(row.allocation.personId) ?? 0) + row.allocation.percentage,
    )
    byTask.set(row.allocation.taskId, byPerson)
  }

  return byTask
}
