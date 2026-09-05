import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { Task, TaskStatus } from '@/domain/schemas/taskSchema'

const OPEN_STATUSES = new Set<TaskStatus>(['todo', 'in_progress', 'blocked'])

function buildPhasePositions(phases: readonly Phase[]): Map<EntityId, number> {
  return new Map(phases.map((phase, index) => [phase.id, index]))
}

function comparePhaseThenOrder(
  positions: Map<EntityId, number>,
  first: Task,
  second: Task,
): number {
  const firstPhase = positions.get(first.phaseId) ?? Number.MAX_SAFE_INTEGER
  const secondPhase = positions.get(second.phaseId) ?? Number.MAX_SAFE_INTEGER

  if (firstPhase !== secondPhase) {
    return firstPhase - secondPhase
  }

  return first.sortOrder - second.sortOrder
}

// A fase do projeto não é coluna: é a fase da primeira tarefa ainda aberta. Um projeto sem
// tarefa aberta mostra a última fase que ele alcançou, e não fica sem fase por ter terminado.
export function deriveCurrentPhase(
  tasks: readonly Task[],
  phases: readonly Phase[],
): Phase | null {
  const positions = buildPhasePositions(phases)
  const countedTasks = tasks
    .filter((task) => task.status !== 'cancelled')
    .toSorted((first, second) => comparePhaseThenOrder(positions, first, second))

  if (countedTasks.length === 0) {
    return null
  }

  const openTask = countedTasks.find((task) => OPEN_STATUSES.has(task.status))
  const chosenTask = openTask ?? countedTasks[countedTasks.length - 1]

  return phases.find((phase) => phase.id === chosenTask?.phaseId) ?? null
}
