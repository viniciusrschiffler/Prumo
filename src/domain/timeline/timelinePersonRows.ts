import { findPersonOverloads } from '@/domain/projects/allocationConflicts'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { EntityId } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export type TimelineAllocationRow = {
  id: EntityId
  projectName: string
  taskTitle: string
  phaseColor: string | null
  period: DatePeriod
  percentage: number
  isEnded: boolean
}

export type TimelineOverload = {
  period: DatePeriod
  percentage: number
}

export type TimelinePersonRow = {
  id: EntityId
  name: string
  initials: string
  weeklyCapacityHours: number
  overloads: readonly TimelineOverload[]
  itemCount: number
  allocations: readonly TimelineAllocationRow[]
}

export function buildTimelinePersonRows(snapshot: ProjectsSnapshot): TimelinePersonRow[] {
  const activePeople = snapshot.people.filter((person) => person.active)
  const tasksById = new Map(snapshot.tasks.map((task) => [task.id, task]))
  const projectsById = new Map(snapshot.projects.map((project) => [project.id, project]))
  const overloadsByPerson = findPersonOverloads(activePeople, snapshot.allocations)

  return activePeople.map((person) => {
    const allocations = snapshot.allocations
      .filter((allocation) => allocation.personId === person.id)
      .flatMap<TimelineAllocationRow>((allocation) => {
        const task = tasksById.get(allocation.taskId)
        const project = task === undefined ? undefined : projectsById.get(task.projectId)

        if (task === undefined || project === undefined || project.archivedAt !== null) {
          return []
        }

        return [
          {
            id: allocation.id,
            projectName: project.name,
            taskTitle: task.title,
            phaseColor:
              snapshot.phases.find((phase) => phase.id === task.phaseId)?.color ?? null,
            period: { start: allocation.startDate, end: allocation.endDate },
            percentage: allocation.percentage,
            isEnded: allocation.endedAt !== null,
          },
        ]
      })
      .toSorted((first, second) => first.period.start.localeCompare(second.period.start))

    return {
      id: person.id,
      name: person.name,
      initials: person.initials,
      weeklyCapacityHours: person.weeklyCapacityHours,
      overloads: overloadsByPerson
        .filter((overload) => overload.person.id === person.id)
        .map((overload) => ({ period: overload.period, percentage: overload.totalPercentage })),
      itemCount: allocations.length,
      allocations,
    }
  })
}
