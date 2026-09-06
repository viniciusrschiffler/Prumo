import { groupBy } from '@/domain/collections/groupBy'
import { earliestDate, latestDate } from '@/domain/dates/isoDateMath'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { Task } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import { collectBlockedOverlays, findPausedOverlay } from './timelineOverlays'
import { toTaskPeriod } from './timelineProjectRows'

export type TimelinePhaseProjectRow = {
  id: string
  projectId: EntityId
  name: string
  period: DatePeriod | null
  blockedPeriods: readonly DatePeriod[]
  pausedPeriod: DatePeriod | null
}

export type TimelinePhaseRow = {
  id: EntityId
  name: string
  color: string
  taskCount: number
  effortHours: number
  itemCount: number
  projects: readonly TimelinePhaseProjectRow[]
}

function mergePeriods(tasks: readonly Task[]): DatePeriod | null {
  return tasks
    .map(toTaskPeriod)
    .filter((period) => period !== null)
    .reduce<DatePeriod | null>(
      (merged, period) =>
        merged === null
          ? period
          : {
              start: earliestDate(merged.start, period.start),
              end: latestDate(merged.end, period.end),
            },
      null,
    )
}

export function buildTimelinePhaseRows(
  snapshot: ProjectsSnapshot,
  today: IsoDate,
): TimelinePhaseRow[] {
  const liveProjects = snapshot.projects.filter((project) => project.archivedAt === null)
  const projectsById = new Map(liveProjects.map((project) => [project.id, project]))
  const eventsByProject = groupBy(snapshot.events, (event) => event.projectId)
  const countedTasks = snapshot.tasks.filter(
    (task) => task.status !== 'cancelled' && projectsById.has(task.projectId),
  )
  const tasksByPhase = groupBy(countedTasks, (task) => task.phaseId)

  return snapshot.phases
    .filter((phase) => phase.active)
    .flatMap<TimelinePhaseRow>((phase) => {
      const tasks = tasksByPhase.get(phase.id) ?? []

      if (tasks.length === 0) {
        return []
      }

      const projects = [...groupBy(tasks, (task) => task.projectId)].flatMap<
        TimelinePhaseProjectRow
      >(([projectId, phaseTasks]) => {
        const project = projectsById.get(projectId)

        if (project === undefined) {
          return []
        }

        const period = mergePeriods(phaseTasks)

        return [
          {
            id: `${phase.id}:${projectId}`,
            projectId,
            name: project.name,
            period,
            blockedPeriods: collectBlockedOverlays(eventsByProject.get(projectId) ?? [], today),
            pausedPeriod: findPausedOverlay(project, period),
          },
        ]
      })

      return [
        {
          id: phase.id,
          name: phase.name,
          color: phase.color,
          taskCount: tasks.length,
          effortHours: tasks.reduce((total, task) => total + (task.estimatedHours ?? 0), 0),
          itemCount: projects.length,
          projects,
        },
      ]
    })
}
