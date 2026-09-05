import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { EntityId, IsoDate, IsoDateTime } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'

// A alocação encerrada por um bloqueio guarda esse motivo exato, o mesmo que o histórico
// mostra ao desbloquear e recriar.
export const BLOCKED_ALLOCATION_REASON = 'projeto bloqueado'

export type BlockProjectsDraft = {
  reason: string
  expectedResumeAt: IsoDate | null
}

export type ProjectBlock = {
  projectId: EntityId
  event: ProjectEvent
  endedAllocationIds: readonly EntityId[]
  endedAt: IsoDateTime
}

export function listOpenAllocationIds(
  taskIds: readonly EntityId[],
  allocations: readonly Allocation[],
): EntityId[] {
  const taskIdSet = new Set(taskIds)

  return allocations
    .filter((allocation) => allocation.endedAt === null && taskIdSet.has(allocation.taskId))
    .map((allocation) => allocation.id)
}

export function validateBlockProjects(draft: BlockProjectsDraft): string | null {
  return draft.reason.trim() === '' ? 'Diga por que o projeto está bloqueado.' : null
}

function describeEndedAllocations(count: number): string | null {
  if (count === 0) {
    return null
  }

  return count === 1
    ? '1 alocação encerrada no bloqueio.'
    : `${count} alocações encerradas no bloqueio.`
}

export function buildProjectBlock(
  projectId: EntityId,
  openAllocationIds: readonly EntityId[],
  draft: BlockProjectsDraft,
  eventId: EntityId,
  today: IsoDate,
  now: IsoDateTime,
): ProjectBlock {
  return {
    projectId,
    endedAllocationIds: openAllocationIds,
    endedAt: now,
    event: {
      id: eventId,
      projectId,
      type: 'block',
      eventDate: today,
      title: draft.reason.trim(),
      bodyMarkdown: describeEndedAllocations(openAllocationIds.length),
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: draft.expectedResumeAt,
      createdAt: now,
    },
  }
}
