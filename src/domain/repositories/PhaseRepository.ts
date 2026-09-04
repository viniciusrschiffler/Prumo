import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId } from '@/domain/schemas/primitives'

export type PhaseRepository = {
  listAll(): Promise<Phase[]>
  findById(id: EntityId): Promise<Phase | null>
  save(phase: Phase): Promise<void>
  reorder(orderedIds: readonly EntityId[]): Promise<void>
  remove(id: EntityId): Promise<void>
}
