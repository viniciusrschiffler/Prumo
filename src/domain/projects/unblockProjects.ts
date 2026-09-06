import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { EntityId, IsoDate, IsoDateTime } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import { BLOCKED_ALLOCATION_REASON } from './blockProjects'

export type ProjectUnblock = {
  projectId: EntityId
  event: ProjectEvent
  resumedAllocations: readonly Allocation[]
}

export type UnblockProjectDraft = {
  reason: string
}

export type UnblockProjectInput = {
  projectId: EntityId
  blockEvent: ProjectEvent
  tasks: readonly Task[]
  allocations: readonly Allocation[]
  draft: UnblockProjectDraft
  eventId: EntityId
  allocationIds: readonly EntityId[]
  today: IsoDate
  now: IsoDateTime
}

export function validateUnblockProject(draft: UnblockProjectDraft): string | null {
  return draft.reason.trim() === '' ? 'Diga o que destravou o projeto.' : null
}

// Só volta o que aquele bloqueio encerrou. Uma alocação encerrada antes dele foi encerrada
// por outro motivo e ressuscitá-la desfaria uma decisão que ninguém pediu para desfazer.
export function listAllocationsEndedByBlock(
  input: Pick<UnblockProjectInput, 'blockEvent' | 'tasks' | 'allocations'>,
): Allocation[] {
  const taskIds = new Set(input.tasks.map((task) => task.id))

  return input.allocations.filter(
    (allocation) =>
      taskIds.has(allocation.taskId) &&
      allocation.endedReason === BLOCKED_ALLOCATION_REASON &&
      allocation.endedAt !== null &&
      allocation.endedAt >= input.blockEvent.createdAt,
  )
}

// A pessoa volta no dia do desbloqueio e fica até o fim atual da tarefa. Quando esse fim já
// passou não há a que voltar, e a alocação nova não nasce — a mesma regra da realocação.
function toResumedAllocation(
  allocation: Allocation,
  allocationId: EntityId | undefined,
  tasksById: ReadonlyMap<EntityId, Task>,
  today: IsoDate,
): Allocation | null {
  const plannedEnd = tasksById.get(allocation.taskId)?.plannedEnd ?? null

  if (allocationId === undefined || plannedEnd === null || plannedEnd < today) {
    return null
  }

  return {
    id: allocationId,
    taskId: allocation.taskId,
    personId: allocation.personId,
    startDate: today,
    endDate: plannedEnd,
    percentage: allocation.percentage,
    endedAt: null,
    endedReason: null,
  }
}

function describeResumedAllocations(count: number): string | null {
  if (count === 0) {
    return null
  }

  return count === 1
    ? '1 alocação recriada no desbloqueio.'
    : `${count} alocações recriadas no desbloqueio.`
}

export function buildProjectUnblock(input: UnblockProjectInput): ProjectUnblock {
  const tasksById = new Map(input.tasks.map((task) => [task.id, task]))
  const resumedAllocations = listAllocationsEndedByBlock(input)
    .map((allocation, index) =>
      toResumedAllocation(allocation, input.allocationIds[index], tasksById, input.today),
    )
    .filter((allocation) => allocation !== null)

  return {
    projectId: input.projectId,
    resumedAllocations,
    event: {
      id: input.eventId,
      projectId: input.projectId,
      type: 'unblock',
      eventDate: input.today,
      title: input.draft.reason.trim(),
      bodyMarkdown: describeResumedAllocations(resumedAllocations.length),
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: null,
      createdAt: input.now,
    },
  }
}
