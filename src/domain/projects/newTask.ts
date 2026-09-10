import { deriveProjectPeriod } from '@/domain/derived/deriveProjectPeriod'
import { calculateTotalEffort } from '@/domain/derived/calculateTotalEffort'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'
import type { Task, TaskStatus } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import { findAllocationConflicts, type AllocationConflict } from './allocationConflicts'

const INITIAL_STATUS = 'todo'
const FIRST_SORT_ORDER = 1
const MIN_PERCENTAGE = 1
const MAX_PERCENTAGE = 100

export type TaskAssignee = {
  personId: EntityId
  percentage: number
}

export type NewTaskDraft = {
  projectId: EntityId
  title: string
  description: string
  status: TaskStatus
  phaseId: EntityId | null
  plannedStart: IsoDate | null
  plannedEnd: IsoDate | null
  estimatedHours: number | null
  assignees: readonly TaskAssignee[]
}

export type NewTaskIds = {
  taskId: EntityId
  allocationIds: readonly EntityId[]
}

export type NewTask = {
  task: Task
  allocations: readonly Allocation[]
}

export type NewTaskErrors = {
  title?: string
  phaseId?: string
  plannedEnd?: string
  estimatedHours?: string
  assignees?: string
}

export type TaskImpact = {
  effortBefore: number
  effortAfter: number
  periodBefore: DatePeriod | null
  periodAfter: DatePeriod | null
}

// A descrição em branco é ausência, não texto vazio: a coluna é anulável e a tela não tem o
// que mostrar quando ninguém escreveu nada.
export function toDescription(text: string): string | null {
  const trimmed = text.trim()

  return trimmed === '' ? null : trimmed
}

export function validateNewTask(draft: NewTaskDraft): NewTaskErrors {
  const errors: NewTaskErrors = {}

  if (draft.title.trim() === '') {
    errors.title = 'Dê um título à tarefa.'
  }

  if (draft.phaseId === null) {
    errors.phaseId = 'Escolha a fase da tarefa.'
  }

  if (
    draft.plannedStart !== null &&
    draft.plannedEnd !== null &&
    draft.plannedEnd < draft.plannedStart
  ) {
    errors.plannedEnd = 'O fim não pode ser anterior ao início.'
  }

  if (draft.estimatedHours !== null && draft.estimatedHours < 0) {
    errors.estimatedHours = 'A estimativa não pode ser negativa.'
  }

  if (draft.assignees.length > 0 && (draft.plannedStart === null || draft.plannedEnd === null)) {
    errors.assignees = 'Uma pessoa atribuída precisa de início e fim para alocar.'
  }

  if (
    draft.assignees.some(
      (assignee) =>
        assignee.percentage < MIN_PERCENTAGE || assignee.percentage > MAX_PERCENTAGE,
    )
  ) {
    errors.assignees = `A alocação de cada pessoa vai de ${MIN_PERCENTAGE}% a ${MAX_PERCENTAGE}%.`
  }

  return errors
}

export function emptyTaskDraft(projectId: EntityId, phaseId: EntityId | null): NewTaskDraft {
  return {
    projectId,
    title: '',
    description: '',
    status: INITIAL_STATUS,
    phaseId,
    plannedStart: null,
    plannedEnd: null,
    estimatedHours: null,
    assignees: [],
  }
}

export function nextSortOrder(tasks: readonly Task[]): number {
  return tasks.reduce((highest, task) => Math.max(highest, task.sortOrder + 1), FIRST_SORT_ORDER)
}

// A tarefa nova não congela baseline: quem congela é a mudança de escopo, que é evento
// próprio. Ela também não nasce com data real, só com o planejamento que o modal pediu.
export function buildNewTask(draft: NewTaskDraft, ids: NewTaskIds, sortOrder: number): NewTask {
  const { plannedStart, plannedEnd } = draft

  return {
    task: {
      id: ids.taskId,
      projectId: draft.projectId,
      phaseId: draft.phaseId ?? '',
      title: draft.title.trim(),
      description: toDescription(draft.description),
      status: draft.status,
      plannedStart,
      plannedEnd,
      actualStart: null,
      actualEnd: null,
      estimatedHours: draft.estimatedHours,
      sortOrder,
    },
    allocations:
      plannedStart === null || plannedEnd === null
        ? []
        : draft.assignees.map((assignee, index) => ({
            id: ids.allocationIds[index] ?? '',
            taskId: ids.taskId,
            personId: assignee.personId,
            startDate: plannedStart,
            endDate: plannedEnd,
            percentage: assignee.percentage,
            endedAt: null,
            endedReason: null,
          })),
  }
}

// O "antes" é o projeto como ele está hoje, com a tarefa editada dentro. O "depois" troca
// aquela tarefa pela versão do formulário, em vez de somar uma segunda cópia dela.
export function previewTaskImpact(
  currentTasks: readonly Task[],
  draft: NewTaskDraft,
  replacedTaskId: EntityId | null = null,
): TaskImpact {
  const preview: Task = {
    id: 'preview',
    projectId: draft.projectId,
    phaseId: draft.phaseId ?? '',
    title: draft.title,
    description: toDescription(draft.description),
    status: draft.status,
    plannedStart: draft.plannedStart,
    plannedEnd: draft.plannedEnd,
    actualStart: null,
    actualEnd: null,
    estimatedHours: draft.estimatedHours,
    sortOrder: 0,
  }
  const remaining =
    replacedTaskId === null
      ? currentTasks
      : currentTasks.filter((task) => task.id !== replacedTaskId)
  const withPreview = [...remaining, preview]

  return {
    effortBefore: calculateTotalEffort(currentTasks),
    effortAfter: calculateTotalEffort(withPreview),
    periodBefore: deriveProjectPeriod(currentTasks),
    periodAfter: deriveProjectPeriod(withPreview),
  }
}

export const PREVIEW_TASK_ID = 'nova-tarefa'

export type PreviewConflictsInput = {
  draft: NewTaskDraft
  tasks: readonly Task[]
  allocations: readonly Allocation[]
  projects: readonly Project[]
  people: readonly Person[]
}

// A prévia mede o conflito no mundo em que a tarefa já existe, então a tarefa e as alocações
// dela entram na varredura com um id que nunca chega ao banco.
export function previewAllocationConflicts(input: PreviewConflictsInput): AllocationConflict[] {
  const preview = buildNewTask(
    input.draft,
    {
      taskId: PREVIEW_TASK_ID,
      allocationIds: input.draft.assignees.map((_, index) => `${PREVIEW_TASK_ID}-${index}`),
    },
    0,
  )

  return findAllocationConflicts({
    projectId: input.draft.projectId,
    taskIds: [PREVIEW_TASK_ID],
    allocations: [...input.allocations, ...preview.allocations],
    tasks: [...input.tasks, preview.task],
    projects: input.projects,
    people: input.people,
  })
}
