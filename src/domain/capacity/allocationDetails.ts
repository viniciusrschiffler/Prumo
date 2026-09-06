import { addDays, isoWeekNumber, startOfWeek } from '@/domain/dates/isoDateMath'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'
import type { WeekStart } from '@/domain/settings/appSettings'
import type { Task } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export type AllocationDetail = {
  allocation: Allocation
  task: Task
  project: Project
  phaseColor: string | null
  firstWeekNumber: number
  lastWeekNumber: number
  isProjectPaused: boolean
}

export type AllocationIndex = {
  tasksById: ReadonlyMap<EntityId, Task>
  projectsById: ReadonlyMap<EntityId, Project>
  phasesById: ReadonlyMap<EntityId, Phase>
  weekStart: WeekStart
}

export type AllocationIndexInput = {
  tasks: readonly Task[]
  projects: readonly Project[]
  phases: readonly Phase[]
  weekStart: WeekStart
}

export function buildAllocationIndex(input: AllocationIndexInput): AllocationIndex {
  return {
    tasksById: new Map(input.tasks.map((task) => [task.id, task])),
    projectsById: new Map(input.projects.map((project) => [project.id, project])),
    phasesById: new Map(input.phases.map((phase) => [phase.id, phase])),
    weekStart: input.weekStart,
  }
}

function weekNumberOf(date: IsoDate, weekStart: WeekStart): number {
  return isoWeekNumber(startOfWeek(date, weekStart))
}

// Uma alocação encerrada parou de consumir capacidade no dia do encerramento, e é esse dia
// que o rótulo de período precisa mostrar — não o fim que o plano previa e não aconteceu.
export function effectiveEndOf(allocation: Allocation): IsoDate {
  if (allocation.endedAt === null) {
    return allocation.endDate
  }

  const endedOn = addDays(allocation.endedAt.slice(0, 10), -1)

  return endedOn < allocation.endDate ? endedOn : allocation.endDate
}

export function toAllocationDetail(
  allocation: Allocation,
  index: AllocationIndex,
): AllocationDetail | null {
  const task = index.tasksById.get(allocation.taskId)
  const project = task === undefined ? undefined : index.projectsById.get(task.projectId)

  if (task === undefined || project === undefined) {
    return null
  }

  return {
    allocation,
    task,
    project,
    phaseColor: index.phasesById.get(task.phaseId)?.color ?? null,
    firstWeekNumber: weekNumberOf(allocation.startDate, index.weekStart),
    lastWeekNumber: weekNumberOf(effectiveEndOf(allocation), index.weekStart),
    isProjectPaused: project.pausedAt !== null,
  }
}

export function isLiveDuring(allocation: Allocation, period: DatePeriod): boolean {
  return allocation.startDate <= period.end && period.start <= effectiveEndOf(allocation)
}

export function listAllocationsDuring(
  personId: EntityId,
  period: DatePeriod,
  allocations: readonly Allocation[],
  index: AllocationIndex,
): AllocationDetail[] {
  return allocations
    .filter((allocation) => allocation.personId === personId)
    .filter((allocation) => isLiveDuring(allocation, period))
    .map((allocation) => toAllocationDetail(allocation, index))
    .filter((detail) => detail !== null)
    .toSorted((first, second) => second.allocation.percentage - first.allocation.percentage)
}
