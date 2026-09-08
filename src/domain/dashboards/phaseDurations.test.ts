import { describe, expect, it } from 'vitest'
import { buildTask } from '@/domain/testing/entityBuilders'
import { buildProjectRow } from '@/domain/testing/projectRowBuilders'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import type { ProjectActivity } from './dashboardActivity'
import { buildPhaseDurations, findPhaseBottleneck, findSlowestPhaseId } from './phaseDurations'

function buildPhase(id: string, name: string, sortOrder: number, active = true): Phase {
  return { id, name, sortOrder, color: 'oklch(0.545 0.16 292)', active }
}

const DEVELOPMENT = buildPhase('development', 'Desenvolvimento', 0)
const INTERNAL = buildPhase('internal', 'Homologação interna', 1)
const PRODUCTION = buildPhase('production', 'Produção', 2)

function buildActivity(tasks: readonly Task[]): ProjectActivity {
  return {
    row: buildProjectRow(),
    tasksInPeriod: tasks,
    events: [],
    eventsInPeriod: [],
    allocationsInPeriod: [],
    blockedDays: 0,
  }
}

describe('buildPhaseDurations', () => {
  it('Should print one row per active phase, in the configured order', () => {
    const rows = buildPhaseDurations([buildActivity([])], [PRODUCTION, DEVELOPMENT, INTERNAL])

    expect(rows.map((row) => row.phase.name)).toEqual([
      'Produção',
      'Desenvolvimento',
      'Homologação interna',
    ])
  })

  it('Should leave out the inactive phase, which no new task can reach', () => {
    const retired = buildPhase('retired', 'Fase aposentada', 3, false)
    const rows = buildPhaseDurations([buildActivity([])], [DEVELOPMENT, retired])

    expect(rows.map((row) => row.phase.id)).toEqual(['development'])
  })

  it('Should give no average to the phase with no task in the window', () => {
    const rows = buildPhaseDurations(
      [buildActivity([buildTask({ id: 't1', phaseId: 'development' })])],
      [DEVELOPMENT, INTERNAL],
    )

    expect(rows.find((row) => row.phase.id === 'internal')).toMatchObject({
      averageDays: null,
      taskCount: 0,
    })
  })

  it('Should average the days of every task of the phase, across projects', () => {
    const rows = buildPhaseDurations(
      [
        buildActivity([
          buildTask({ id: 't1', phaseId: 'development', plannedStart: '2026-03-01', plannedEnd: '2026-03-10' }),
        ]),
        buildActivity([
          buildTask({ id: 't2', phaseId: 'development', plannedStart: '2026-04-01', plannedEnd: '2026-04-21' }),
        ]),
      ],
      [DEVELOPMENT],
    )

    expect(rows[0]).toMatchObject({ averageDays: 14.5, taskCount: 2 })
  })
})

describe('findPhaseBottleneck', () => {
  it('Should compare the slowest phase with the fastest one, not with the first of the list', () => {
    const rows = buildPhaseDurations(
      [
        buildActivity([
          buildTask({ id: 't1', phaseId: 'development', plannedStart: '2026-03-01', plannedEnd: '2026-03-10' }),
          buildTask({ id: 't2', phaseId: 'internal', plannedStart: '2026-03-01', plannedEnd: '2026-03-30' }),
          buildTask({ id: 't3', phaseId: 'production', plannedStart: '2026-03-01', plannedEnd: '2026-03-05' }),
        ]),
      ],
      [DEVELOPMENT, INTERNAL, PRODUCTION],
    )

    expect(findPhaseBottleneck(rows)).toMatchObject({
      slowest: INTERNAL,
      fastest: PRODUCTION,
      ratio: 7.25,
    })
  })

  it('Should say nothing when a single phase was measured, because there is nothing to compare it with', () => {
    const rows = buildPhaseDurations(
      [buildActivity([buildTask({ id: 't1', phaseId: 'development' })])],
      [DEVELOPMENT, INTERNAL],
    )

    expect(findPhaseBottleneck(rows)).toBeNull()
  })

  it('Should say nothing when no phase was measured at all', () => {
    expect(findPhaseBottleneck(buildPhaseDurations([buildActivity([])], [DEVELOPMENT]))).toBeNull()
  })
})

describe('findSlowestPhaseId', () => {
  it('Should point at the phase that paints its number red', () => {
    const rows = buildPhaseDurations(
      [
        buildActivity([
          buildTask({ id: 't1', phaseId: 'development', plannedStart: '2026-03-01', plannedEnd: '2026-03-10' }),
          buildTask({ id: 't2', phaseId: 'internal', plannedStart: '2026-03-01', plannedEnd: '2026-03-30' }),
        ]),
      ],
      [DEVELOPMENT, INTERNAL],
    )

    expect(findSlowestPhaseId(rows)).toBe('internal')
  })

  it('Should point at nobody when no phase has a measured average', () => {
    expect(findSlowestPhaseId(buildPhaseDurations([buildActivity([])], [DEVELOPMENT]))).toBeNull()
  })
})
