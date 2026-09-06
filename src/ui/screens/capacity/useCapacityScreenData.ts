import { useMemo } from 'react'
import { buildAllocationIndex } from '@/domain/capacity/allocationDetails'
import {
  findInactiveWithFutureWork,
  findOverloadAlerts,
} from '@/domain/capacity/capacityAlerts'
import { buildCapacityMatrix } from '@/domain/capacity/capacityMatrix'
import { findMostAvailablePerson } from '@/domain/capacity/capacitySlack'
import { buildCapacityWindow } from '@/domain/capacity/capacityWindow'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { WeekStart } from '@/domain/settings/appSettings'

export type CapacityScreenDataInput = {
  snapshot: ProjectsSnapshot
  today: IsoDate
  weekStart: WeekStart
  projectId: EntityId | null
}

export function useCapacityScreenData({
  snapshot,
  today,
  weekStart,
  projectId,
}: CapacityScreenDataInput) {
  const window = useMemo(
    () => buildCapacityWindow(today, weekStart),
    [today, weekStart],
  )

  const index = useMemo(
    () =>
      buildAllocationIndex({
        tasks: snapshot.tasks,
        projects: snapshot.projects,
        phases: snapshot.phases,
        weekStart,
      }),
    [snapshot.tasks, snapshot.projects, snapshot.phases, weekStart],
  )

  const matrix = useMemo(
    () =>
      buildCapacityMatrix({
        people: snapshot.people,
        allocations: snapshot.allocations,
        tasks: snapshot.tasks,
        window,
        projectId,
      }),
    [snapshot.people, snapshot.allocations, snapshot.tasks, window, projectId],
  )

  const overloadAlerts = useMemo(
    () => findOverloadAlerts({ matrix, allocations: snapshot.allocations, index, window }),
    [matrix, snapshot.allocations, index, window],
  )

  const inactiveAlerts = useMemo(
    () =>
      findInactiveWithFutureWork({
        people: snapshot.people,
        allocations: snapshot.allocations,
        index,
        window,
      }),
    [snapshot.people, snapshot.allocations, index, window],
  )

  const mostAvailable = useMemo(() => findMostAvailablePerson(matrix), [matrix])

  const filterableProjects = useMemo(
    () =>
      snapshot.projects
        .filter((project) => project.archivedAt === null)
        .toSorted((first, second) => first.name.localeCompare(second.name, 'pt-BR')),
    [snapshot.projects],
  )

  return { window, index, matrix, overloadAlerts, inactiveAlerts, mostAvailable, filterableProjects }
}
