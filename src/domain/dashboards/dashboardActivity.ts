import { groupBy } from '@/domain/collections/groupBy'
import { periodsOverlap } from '@/domain/dates/isoDateMath'
import { calculateBlockedDays } from '@/domain/derived/calculateBlockedDays'
import { effectiveEndOf } from '@/domain/derived/calculateWeeklyCapacity'
import { toTaskPeriod } from '@/domain/derived/taskPeriods'
import type { ProjectRow, ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export type ProjectActivity = {
  row: ProjectRow
  tasksInPeriod: readonly Task[]
  events: readonly ProjectEvent[]
  eventsInPeriod: readonly ProjectEvent[]
  allocationsInPeriod: readonly Allocation[]
  blockedDays: number
}

function isWithin(date: IsoDate, period: DatePeriod): boolean {
  return date >= period.start && date <= period.end
}

export function isAllocationLiveIn(allocation: Allocation, period: DatePeriod): boolean {
  return periodsOverlap({ start: allocation.startDate, end: effectiveEndOf(allocation) }, period)
}

function isTaskInPeriod(task: Task, period: DatePeriod): boolean {
  const taskPeriod = toTaskPeriod(task)

  return taskPeriod !== null && periodsOverlap(taskPeriod, period)
}

function toActivity(
  row: ProjectRow,
  period: DatePeriod,
  eventsByProject: Map<EntityId, ProjectEvent[]>,
  allocationsByTask: Map<EntityId, Allocation[]>,
): ProjectActivity {
  const tasks = row.tasks
    .map((taskRow) => taskRow.task)
    .filter((task) => task.status !== 'cancelled')
  const events = eventsByProject.get(row.project.id) ?? []

  return {
    row,
    tasksInPeriod: tasks.filter((task) => isTaskInPeriod(task, period)),
    events,
    eventsInPeriod: events.filter((event) => isWithin(event.eventDate, period)),
    allocationsInPeriod: tasks
      .flatMap((task) => allocationsByTask.get(task.id) ?? [])
      .filter((allocation) => isAllocationLiveIn(allocation, period)),
    blockedDays: calculateBlockedDays(events, period),
  }
}

function hasActivity(activity: ProjectActivity): boolean {
  return (
    activity.eventsInPeriod.length > 0 ||
    activity.tasksInPeriod.length > 0 ||
    activity.allocationsInPeriod.length > 0
  )
}

// "Projeto com atividade" é o que deu sinal de vida na janela: um evento registrado, uma tarefa
// que a atravessa ou alguém alocado nela. O arquivado fica fora, como na Timeline e na TodoList.
export function listProjectActivity(
  rows: readonly ProjectRow[],
  snapshot: ProjectsSnapshot,
  period: DatePeriod,
): ProjectActivity[] {
  const eventsByProject = groupBy(snapshot.events, (event) => event.projectId)
  const allocationsByTask = groupBy(snapshot.allocations, (allocation) => allocation.taskId)

  return rows
    .filter((row) => row.project.archivedAt === null)
    .map((row) => toActivity(row, period, eventsByProject, allocationsByTask))
    .filter(hasActivity)
}
