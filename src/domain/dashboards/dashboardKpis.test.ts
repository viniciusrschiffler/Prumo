import { describe, expect, it } from 'vitest'
import { buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import { buildProjectRow } from '@/domain/testing/projectRowBuilders'
import type { ProjectRow } from '@/domain/projects/projectRow'
import type { Task } from '@/domain/schemas/taskSchema'
import type { ProjectActivity } from './dashboardActivity'
import { buildDashboardKpis } from './dashboardKpis'

const PERIOD = { start: '2026-06-01', end: '2026-08-31' }
const ANA = buildPerson({ id: 'ana', name: 'Ana Nogueira', weeklyCapacityHours: 40 })

function buildActivity(row: ProjectRow, tasks: readonly Task[] = []): ProjectActivity {
  return {
    row,
    tasksInPeriod: tasks,
    events: [],
    eventsInPeriod: [],
    allocationsInPeriod: [],
    blockedDays: 0,
  }
}

function buildDeliveredRow(id: string, end: string): ProjectRow {
  return buildProjectRow(
    { id, name: id },
    {
      taskProgress: { doneCount: 2, countedCount: 2, ratio: 1 },
      period: { start: '2026-03-01', end },
    },
  )
}

describe('buildDashboardKpis', () => {
  it('Should count as delivered the project whose counted tasks all finished inside the window', () => {
    const kpis = buildDashboardKpis(
      [buildActivity(buildDeliveredRow('gateway', '2026-07-15'))],
      [],
      [ANA],
      PERIOD,
    )

    expect(kpis.deliveredProjectCount).toBe(1)
  })

  it('Should not count as delivered the project that finished before the window opened', () => {
    const kpis = buildDashboardKpis(
      [buildActivity(buildDeliveredRow('gateway', '2026-04-15'))],
      [],
      [ANA],
      PERIOD,
    )

    expect(kpis.deliveredProjectCount).toBe(0)
  })

  it('Should not count as delivered the project that still has an open task', () => {
    const row = buildProjectRow(
      { id: 'gateway' },
      {
        taskProgress: { doneCount: 1, countedCount: 2, ratio: 0.5 },
        period: { start: '2026-03-01', end: '2026-07-15' },
      },
    )

    expect(buildDashboardKpis([buildActivity(row)], [], [ANA], PERIOD).deliveredProjectCount).toBe(0)
  })

  it('Should average the deviation, letting an early project offset a late one', () => {
    const kpis = buildDashboardKpis(
      [
        buildActivity(buildProjectRow({ id: 'gateway' }, { deviationInDays: 11 })),
        buildActivity(buildProjectRow({ id: 'field' }, { deviationInDays: -2 })),
      ],
      [],
      [ANA],
      PERIOD,
    )

    expect(kpis.averageDeviationInDays).toBe(5)
  })

  it('Should ignore the project with no baseline to compare against', () => {
    const kpis = buildDashboardKpis(
      [
        buildActivity(buildProjectRow({ id: 'gateway' }, { deviationInDays: 8 })),
        buildActivity(buildProjectRow({ id: 'portal' }, { deviationInDays: null })),
      ],
      [],
      [ANA],
      PERIOD,
    )

    expect(kpis.averageDeviationInDays).toBe(8)
  })

  it('Should have no average deviation when no project has a baseline', () => {
    const kpis = buildDashboardKpis(
      [buildActivity(buildProjectRow({ id: 'gateway' }, { deviationInDays: null }))],
      [],
      [ANA],
      PERIOD,
    )

    expect(kpis.averageDeviationInDays).toBeNull()
  })

  it('Should add the estimated hours of the tasks that cross the window', () => {
    const kpis = buildDashboardKpis(
      [
        buildActivity(buildProjectRow({ id: 'gateway' }), [
          buildTask({ id: 't1', estimatedHours: 40 }),
          buildTask({ id: 't2', estimatedHours: 60 }),
        ]),
      ],
      [],
      [ANA],
      PERIOD,
    )

    expect(kpis.plannedEffortHours).toBe(100)
  })

  it('Should add the blocked days of every project on the chart', () => {
    const kpis = buildDashboardKpis(
      [
        { ...buildActivity(buildProjectRow({ id: 'portal' })), blockedDays: 23 },
        { ...buildActivity(buildProjectRow({ id: 'gateway' })), blockedDays: 8 },
      ],
      [],
      [ANA],
      PERIOD,
    )

    expect(kpis.blockedDays).toBe(31)
  })

  it('Should read the capacity usage from the workload rows', () => {
    const kpis = buildDashboardKpis(
      [],
      [{ person: ANA, averagePercentage: 50, averageHours: 20 }],
      [ANA],
      PERIOD,
    )

    expect(kpis.capacityUsagePercentage).toBe(50)
  })
})
