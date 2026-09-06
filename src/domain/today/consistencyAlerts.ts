import { differenceInDays, isoWeekNumber, startOfWeek, toIsoDateOf } from '@/domain/dates/isoDateMath'
import {
  findPersonOverloads,
  type ConflictContribution,
} from '@/domain/projects/allocationConflicts'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Note } from '@/domain/schemas/noteSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Project } from '@/domain/schemas/projectSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import type { WeekStart } from '@/domain/settings/appSettings'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import { selectStartingTasks } from './todayAgenda'

export type UnassignedTask = {
  task: Task
  project: Project
}

export type OverloadAlert = {
  kind: 'overload'
  id: string
  person: Person
  period: DatePeriod
  firstWeekNumber: number
  lastWeekNumber: number
  totalPercentage: number
  contributions: readonly ConflictContribution[]
}

export type UnassignedAlert = {
  kind: 'unassigned'
  id: string
  tasks: readonly UnassignedTask[]
}

export type StaleProjectAlert = {
  kind: 'stale'
  id: string
  project: Project
  lastActivityDate: IsoDate | null
  idleDays: number
}

export type ConsistencyAlert = OverloadAlert | UnassignedAlert | StaleProjectAlert

export type ConsistencyAlertsInput = {
  projects: readonly Project[]
  tasks: readonly Task[]
  events: readonly ProjectEvent[]
  notes: readonly Note[]
  allocations: readonly Allocation[]
  people: readonly Person[]
  today: IsoDate
  weekStart: WeekStart
  staleAfterDays: number
}

const IDLE_STATUSES = new Set<Project['status']>(['completed', 'cancelled'])

function weekNumberOf(date: IsoDate, weekStart: WeekStart): number {
  return isoWeekNumber(startOfWeek(date, weekStart))
}

// A sobrecarga só alerta se alcança hoje ou o futuro. Os outros dois alertas do design falam
// do agora, e um vermelho sobre um mês que já passou não tem ação possível.
function findOverloadAlerts(input: ConsistencyAlertsInput): OverloadAlert[] {
  return findPersonOverloads(input.people, input.allocations)
    .filter((overload) => overload.period.end >= input.today)
    .map((overload) => ({
      kind: 'overload' as const,
      id: `overload-${overload.person.id}-${overload.period.start}`,
      person: overload.person,
      period: overload.period,
      firstWeekNumber: weekNumberOf(overload.period.start, input.weekStart),
      lastWeekNumber: weekNumberOf(overload.period.end, input.weekStart),
      totalPercentage: overload.totalPercentage,
      contributions: toContributions(overload.allocations, input),
    }))
}

function toContributions(
  allocations: readonly Allocation[],
  input: ConsistencyAlertsInput,
): ConflictContribution[] {
  const tasksById = new Map(input.tasks.map((task) => [task.id, task]))
  const projectsById = new Map(input.projects.map((project) => [project.id, project]))

  return allocations.map((allocation) => {
    const task = tasksById.get(allocation.taskId) ?? null
    const project = task === null ? null : (projectsById.get(task.projectId) ?? null)

    return {
      allocation,
      taskTitle: task?.title ?? '',
      projectName: project?.name ?? '',
      isSameProject: false,
    }
  })
}

function findUnassignedAlert(input: ConsistencyAlertsInput): UnassignedAlert[] {
  const projectsById = new Map(input.projects.map((project) => [project.id, project]))
  const allocatedTaskIds = new Set(
    input.allocations
      .filter((allocation) => allocation.endedAt === null)
      .map((allocation) => allocation.taskId),
  )

  const tasks = selectStartingTasks(input.tasks, input.projects, input.today)
    .filter((task) => !allocatedTaskIds.has(task.id))
    .map((task) => ({ task, project: projectsById.get(task.projectId) }))
    .filter((entry): entry is UnassignedTask => entry.project !== undefined)

  return tasks.length === 0 ? [] : [{ kind: 'unassigned', id: 'unassigned-today', tasks }]
}

function findLastActivityDate(
  project: Project,
  input: ConsistencyAlertsInput,
): IsoDate | null {
  const dates = [
    ...input.events
      .filter((event) => event.projectId === project.id)
      .map((event) => event.eventDate),
    ...input.tasks
      .filter((task) => task.projectId === project.id && task.actualEnd !== null)
      .map((task) => task.actualEnd ?? ''),
    ...input.notes
      .filter((note) => note.projectId === project.id)
      .map((note) => toIsoDateOf(note.updatedAt)),
  ]

  return dates.toSorted().at(-1) ?? null
}

function toStaleAlert(
  project: Project,
  input: ConsistencyAlertsInput,
): StaleProjectAlert | null {
  const lastActivityDate = findLastActivityDate(project, input)
  const idleDays =
    lastActivityDate === null
      ? differenceInDays(toIsoDateOf(project.createdAt), input.today)
      : differenceInDays(lastActivityDate, input.today)

  if (idleDays <= input.staleAfterDays) {
    return null
  }

  return { kind: 'stale', id: `stale-${project.id}`, project, lastActivityDate, idleDays }
}

function findStaleAlerts(input: ConsistencyAlertsInput): StaleProjectAlert[] {
  return input.projects
    .filter((project) => project.archivedAt === null && !IDLE_STATUSES.has(project.status))
    .map((project) => toStaleAlert(project, input))
    .filter((alert) => alert !== null)
    .toSorted((first, second) => second.idleDays - first.idleDays)
}

const KIND_ORDER: Record<ConsistencyAlert['kind'], number> = {
  overload: 0,
  unassigned: 1,
  stale: 2,
}

export function findConsistencyAlerts(input: ConsistencyAlertsInput): ConsistencyAlert[] {
  return [
    ...findOverloadAlerts(input),
    ...findUnassignedAlert(input),
    ...findStaleAlerts(input),
  ].toSorted((first, second) => KIND_ORDER[first.kind] - KIND_ORDER[second.kind])
}
