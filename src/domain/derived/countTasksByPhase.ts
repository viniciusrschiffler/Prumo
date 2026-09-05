import type { EntityId } from '@/domain/schemas/primitives'
import type { Task } from '@/domain/schemas/taskSchema'

// Conta toda linha, inclusive a cancelada, porque é isso que o ON DELETE RESTRICT enxerga.
// Mostrar zero numa fase que recusa exclusão seria mentir sobre o motivo da recusa.
export function countTasksByPhase(tasks: readonly Task[]): Map<EntityId, number> {
  const countByPhase = new Map<EntityId, number>()

  for (const task of tasks) {
    countByPhase.set(task.phaseId, (countByPhase.get(task.phaseId) ?? 0) + 1)
  }

  return countByPhase
}
