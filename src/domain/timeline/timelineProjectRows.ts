import { groupBy } from '@/domain/collections/groupBy'
import { calculateBlockedDays } from '@/domain/derived/calculateBlockedDays'
import { deriveBaselinePeriod } from '@/domain/derived/deriveProjectPeriod'
import { selectCurrentBaseline } from '@/domain/derived/selectCurrentBaseline'
import { buildProjectRows, type ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { BaselineTask } from '@/domain/schemas/baselineSchema'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { Task } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import { collectBlockedOverlays, findPausedOverlay } from './timelineOverlays'

export type TimelineTaskRow = {
  id: EntityId
  projectId: EntityId
  title: string
  phaseColor: string | null
  period: DatePeriod | null
  plannedPeriod: DatePeriod | null
  baselinePeriod: DatePeriod | null
  deviationInDays: number | null
  hasAssignee: boolean
  canMove: boolean
  canResizeStart: boolean
  canResizeEnd: boolean
}

export type TimelineProjectRow = {
  id: EntityId
  name: string
  phaseColor: string | null
  period: DatePeriod | null
  baselinePeriod: DatePeriod | null
  blockedPeriods: readonly DatePeriod[]
  pausedPeriod: DatePeriod | null
  isBlocked: boolean
  blockedDays: number
  deviationInDays: number | null
  itemCount: number
  tasks: readonly TimelineTaskRow[]
}

export function toTaskPeriod(task: Task): DatePeriod | null {
  const start = task.actualStart ?? task.plannedStart
  const end = task.actualEnd ?? task.plannedEnd

  if (start === null || end === null || end < start) {
    return null
  }

  return { start, end }
}

export function toPlannedPeriod(task: Task): DatePeriod | null {
  if (
    task.plannedStart === null ||
    task.plannedEnd === null ||
    task.plannedEnd < task.plannedStart
  ) {
    return null
  }

  return { start: task.plannedStart, end: task.plannedEnd }
}

function toBaselinePeriod(baselineTask: BaselineTask | undefined): DatePeriod | null {
  if (
    baselineTask?.plannedStart === undefined ||
    baselineTask.plannedStart === null ||
    baselineTask.plannedEnd === null
  ) {
    return null
  }

  return { start: baselineTask.plannedStart, end: baselineTask.plannedEnd }
}

// Arrastar reescreve o plano, então a borda que a realidade já fixou não se move: uma tarefa
// em andamento tem o começo travado no actual_start e o fim ainda livre.
function toTaskRow(
  task: Task,
  phaseColor: string | null,
  deviationInDays: number | null,
  hasAssignee: boolean,
  baselineTask: BaselineTask | undefined,
): TimelineTaskRow {
  const plannedPeriod = toPlannedPeriod(task)
  const isPlanned = plannedPeriod !== null

  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    phaseColor,
    period: toTaskPeriod(task),
    plannedPeriod,
    baselinePeriod: toBaselinePeriod(baselineTask),
    deviationInDays,
    hasAssignee,
    canMove: isPlanned && task.actualStart === null && task.actualEnd === null,
    canResizeStart: isPlanned && task.actualStart === null,
    canResizeEnd: isPlanned && task.actualEnd === null,
  }
}

function compareByPeriodThenName(first: TimelineProjectRow, second: TimelineProjectRow): number {
  if (first.period === null || second.period === null) {
    return first.period === second.period ? 0 : first.period === null ? 1 : -1
  }

  return (
    first.period.start.localeCompare(second.period.start) ||
    first.name.localeCompare(second.name, 'pt-BR')
  )
}

export function buildTimelineProjectRows(
  snapshot: ProjectsSnapshot,
  today: IsoDate,
): TimelineProjectRow[] {
  const eventsByProject = groupBy(snapshot.events, (event) => event.projectId)
  const baselinesByProject = groupBy(snapshot.baselines, (baseline) => baseline.projectId)
  const baselineTasksByBaseline = groupBy(snapshot.baselineTasks, (entry) => entry.baselineId)

  return buildProjectRows(snapshot)
    .filter((row) => row.project.archivedAt === null)
    .map((row) => {
      const events = eventsByProject.get(row.project.id) ?? []
      const currentBaseline = selectCurrentBaseline(baselinesByProject.get(row.project.id) ?? [])
      const baselineTasks = baselineTasksByBaseline.get(currentBaseline?.id ?? '') ?? []
      const baselineTasksByTaskId = new Map(baselineTasks.map((entry) => [entry.taskId, entry]))
      const tasks = row.tasks
        .filter((taskRow) => taskRow.task.status !== 'cancelled')
        .map((taskRow) =>
          toTaskRow(
            taskRow.task,
            taskRow.phase?.color ?? null,
            taskRow.deviationInDays,
            taskRow.people.length > 0,
            baselineTasksByTaskId.get(taskRow.task.id),
          ),
        )

      return {
        id: row.project.id,
        name: row.project.name,
        phaseColor: row.currentPhase?.color ?? null,
        period: row.period,
        baselinePeriod: deriveBaselinePeriod(baselineTasks),
        blockedPeriods: collectBlockedOverlays(events, today),
        pausedPeriod: findPausedOverlay(row.project, row.period),
        isBlocked: row.project.status === 'blocked',
        blockedDays: calculateBlockedDays(events, { start: row.project.createdAt.slice(0, 10), end: today }),
        deviationInDays: row.deviationInDays,
        itemCount: tasks.length,
        tasks,
      }
    })
    .toSorted(compareByPeriodThenName)
}
