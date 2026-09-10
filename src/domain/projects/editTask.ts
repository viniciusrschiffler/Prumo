import { toPlannedPeriod } from '@/domain/derived/taskPeriods'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { EntityId, IsoDateTime } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import { buildTaskReschedule, hasScheduleChanged } from '@/domain/timeline/timelineSchedule'
import { toDescription, type NewTaskDraft, type TaskAssignee } from './newTask'

export const TASK_EDIT_ALLOCATION_REASON = 'alocação alterada na edição da tarefa'

export type TaskUpdate = {
  task: Task
  endedAllocationIds: readonly EntityId[]
  endedAt: IsoDateTime
  endedReason: string
  openedAllocations: readonly Allocation[]
  event: ProjectEvent | null
}

export type TaskEditContext = {
  task: Task
  allocations: readonly Allocation[]
}

export function listOpenAllocations(context: TaskEditContext): Allocation[] {
  return context.allocations.filter(
    (allocation) => allocation.taskId === context.task.id && allocation.endedAt === null,
  )
}

export function toTaskDraft(context: TaskEditContext): NewTaskDraft {
  const { task } = context

  return {
    projectId: task.projectId,
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    phaseId: task.phaseId,
    plannedStart: task.plannedStart,
    plannedEnd: task.plannedEnd,
    estimatedHours: task.estimatedHours,
    assignees: listOpenAllocations(context).map((allocation) => ({
      personId: allocation.personId,
      percentage: allocation.percentage,
    })),
  }
}

function isSameAssignee(allocation: Allocation, assignee: TaskAssignee): boolean {
  return (
    allocation.personId === assignee.personId && allocation.percentage === assignee.percentage
  )
}

export type TaskUpdateIds = {
  eventId: EntityId
  allocationIds: readonly EntityId[]
}

export type TaskUpdateInput = {
  context: TaskEditContext
  draft: NewTaskDraft
  ids: TaskUpdateIds
  now: IsoDateTime
}

// A alocação nunca é deletada: tirar a pessoa da tarefa preenche ended_at, e trocar o
// percentual dela encerra a de antes e abre outra. Mudar só a janela da tarefa não mexe em
// alocação nenhuma, a mesma leitura do arrasto da Timeline.
export function buildTaskUpdate(input: TaskUpdateInput): TaskUpdate {
  const { context, draft, ids, now } = input
  const { task } = context
  const { plannedStart, plannedEnd } = draft
  const open = listOpenAllocations(context)

  const kept = open.filter((allocation) =>
    draft.assignees.some((assignee) => isSameAssignee(allocation, assignee)),
  )
  const ended = open.filter((allocation) => !kept.includes(allocation))
  const added = draft.assignees.filter(
    (assignee) => !kept.some((allocation) => isSameAssignee(allocation, assignee)),
  )

  const updated: Task = {
    ...task,
    phaseId: draft.phaseId ?? task.phaseId,
    title: draft.title.trim(),
    description: toDescription(draft.description),
    status: draft.status,
    plannedStart: draft.plannedStart,
    plannedEnd: draft.plannedEnd,
    estimatedHours: draft.estimatedHours,
  }

  const before = toPlannedPeriod(task)
  const after = toPlannedPeriod(updated)

  return {
    task: updated,
    endedAllocationIds: ended.map((allocation) => allocation.id),
    endedAt: now,
    endedReason: TASK_EDIT_ALLOCATION_REASON,
    openedAllocations:
      plannedStart === null || plannedEnd === null
        ? []
        : added.map((assignee, index) => ({
            id: ids.allocationIds[index] ?? '',
            taskId: task.id,
            personId: assignee.personId,
            startDate: plannedStart,
            endDate: plannedEnd,
            percentage: assignee.percentage,
            endedAt: null,
            endedReason: null,
          })),
    event:
      before === null || after === null || !hasScheduleChanged(before, after)
        ? null
        : buildTaskReschedule({
            taskId: task.id,
            projectId: task.projectId,
            taskTitle: updated.title,
            before,
            after,
            eventId: ids.eventId,
            now,
          }).event,
  }
}
