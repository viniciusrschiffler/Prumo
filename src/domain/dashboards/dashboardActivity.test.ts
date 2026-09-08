import { describe, expect, it } from 'vitest'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import { buildAllocation, buildProjectEvent, buildTask } from '@/domain/testing/entityBuilders'
import { buildProjectRow, buildProjectTaskRow } from '@/domain/testing/projectRowBuilders'
import { isAllocationLiveIn, listProjectActivity } from './dashboardActivity'

const PERIOD = { start: '2026-06-01', end: '2026-08-31' }

const EMPTY_SNAPSHOT: ProjectsSnapshot = {
  projects: [],
  tasks: [],
  taskDependencies: [],
  phases: [],
  people: [],
  allocations: [],
  baselines: [],
  baselineTasks: [],
  events: [],
  eventTasks: [],
  notes: [],
  tags: [],
  projectTags: [],
}

describe('isAllocationLiveIn', () => {
  it('Should call live what merely touches the window, not only what fits inside it', () => {
    const crossing = buildAllocation({ startDate: '2026-05-01', endDate: '2026-06-02' })

    expect(isAllocationLiveIn(crossing, PERIOD)).toBe(true)
  })

  it('Should stop counting an ended allocation on the day it closed', () => {
    const ended = buildAllocation({
      startDate: '2026-04-01',
      endDate: '2026-08-31',
      endedAt: '2026-06-01T09:00:00Z',
      endedReason: 'realocação',
    })

    expect(isAllocationLiveIn(ended, { start: '2026-06-02', end: '2026-08-31' })).toBe(false)
  })
})

describe('listProjectActivity', () => {
  it('Should leave out the archived project, as the Timeline and the TodoList do', () => {
    const row = buildProjectRow(
      { id: 'erp', name: 'ERP', archivedAt: '2026-05-01T09:00:00Z' },
      { tasks: [buildProjectTaskRow(buildTask({ projectId: 'erp' }))] },
    )

    expect(listProjectActivity([row], EMPTY_SNAPSHOT, PERIOD)).toHaveLength(0)
  })

  it('Should keep the project whose only sign of life is an event in the window', () => {
    const row = buildProjectRow({ id: 'portal', name: 'Portal do parceiro' })
    const snapshot: ProjectsSnapshot = {
      ...EMPTY_SNAPSHOT,
      events: [buildProjectEvent({ projectId: 'portal', eventDate: '2026-07-01' })],
    }

    expect(listProjectActivity([row], snapshot, PERIOD)).toHaveLength(1)
  })

  it('Should drop the project that gave no sign of life in the window', () => {
    const row = buildProjectRow({ id: 'portal', name: 'Portal do parceiro' })
    const snapshot: ProjectsSnapshot = {
      ...EMPTY_SNAPSHOT,
      events: [buildProjectEvent({ projectId: 'portal', eventDate: '2025-01-01' })],
    }

    expect(listProjectActivity([row], snapshot, PERIOD)).toHaveLength(0)
  })

  it('Should carry the whole event history, so a block opened before the window still counts its days', () => {
    const row = buildProjectRow({ id: 'portal', name: 'Portal do parceiro' })
    const snapshot: ProjectsSnapshot = {
      ...EMPTY_SNAPSHOT,
      events: [
        buildProjectEvent({ id: 'block', projectId: 'portal', type: 'block', eventDate: '2026-05-20' }),
        buildProjectEvent({ id: 'note', projectId: 'portal', eventDate: '2026-07-01' }),
      ],
    }
    const [activity] = listProjectActivity([row], snapshot, PERIOD)

    expect(activity?.events).toHaveLength(2)
    expect(activity?.eventsInPeriod).toHaveLength(1)
    expect(activity?.blockedDays).toBe(91)
  })

  it('Should not count the cancelled task, which weighs on no effort or period', () => {
    const cancelled = buildTask({
      id: 'cancelled',
      projectId: 'gateway',
      status: 'cancelled',
      plannedStart: '2026-06-10',
      plannedEnd: '2026-06-20',
    })
    const row = buildProjectRow(
      { id: 'gateway', name: 'Migração do gateway' },
      { tasks: [buildProjectTaskRow(cancelled)] },
    )
    const snapshot: ProjectsSnapshot = {
      ...EMPTY_SNAPSHOT,
      allocations: [buildAllocation({ taskId: 'cancelled', startDate: '2026-06-10', endDate: '2026-06-20' })],
    }

    expect(listProjectActivity([row], snapshot, PERIOD)).toHaveLength(0)
  })
})
