import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildTask } from '@/domain/testing/entityBuilders'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { buildProjectRows, type ProjectTaskRow } from './projectRow'
import { groupTasksByPhase, sumTaskGroups } from './taskGroups'

const PHASES = [
  { id: 'development', name: 'Desenvolvimento', sortOrder: 1, color: 'oklch(0.5 0.1 292)', active: true },
  { id: 'production', name: 'Produção', sortOrder: 2, color: 'oklch(0.5 0.1 152)', active: true },
]

function buildRow(overrides: Partial<ProjectTaskRow> = {}): ProjectTaskRow {
  return {
    task: buildTask(),
    phase: PHASES[0] ?? null,
    people: [],
    hasOnlyEndedAllocations: false,
    deviationInDays: null,
    isPlanned: true,
    ...overrides,
  }
}

let gatewayGroups: ReturnType<typeof groupTasksByPhase>

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()
  const snapshot = readProjectsSnapshot(database)
  const gateway = buildProjectRows(snapshot).find((row) => row.project.id === 'gateway')

  gatewayGroups = groupTasksByPhase(gateway?.tasks ?? [], snapshot.phases)
})

describe('groupTasksByPhase', () => {
  it('Should open the three phase groups the design shows for the gateway', () => {
    expect(gatewayGroups.map((group) => group.phase?.name)).toEqual([
      'Desenvolvimento',
      'Homologação interna',
      'Produção',
    ])
  })

  it('Should subtotal each phase with the hours and window of the design', () => {
    expect(
      gatewayGroups.map((group) => ({
        tasks: group.countedTaskCount,
        hours: group.effortHours,
        period: group.period,
      })),
    ).toEqual([
      { tasks: 2, hours: 160, period: { start: '2026-03-12', end: '2026-05-15' } },
      { tasks: 1, hours: 80, period: { start: '2026-05-18', end: '2026-06-26' } },
      { tasks: 1, hours: 80, period: { start: '2026-09-01', end: '2026-09-29' } },
    ])
  })

  it('Should keep the phase order of the register, not the order the tasks appear in', () => {
    const groups = groupTasksByPhase(
      [
        buildRow({ task: buildTask({ id: 'later', phaseId: 'production' }), phase: PHASES[1] }),
        buildRow({ task: buildTask({ id: 'earlier', phaseId: 'development' }), phase: PHASES[0] }),
      ],
      PHASES,
    )

    expect(groups.map((group) => group.phase?.id)).toEqual(['development', 'production'])
  })

  it('Should not open a group for a phase without any visible task', () => {
    const groups = groupTasksByPhase([buildRow()], PHASES)

    expect(groups).toHaveLength(1)
  })

  it('Should gather the tasks of an unknown phase in a last group', () => {
    const groups = groupTasksByPhase(
      [buildRow(), buildRow({ task: buildTask({ id: 'orfa' }), phase: null })],
      PHASES,
    )

    expect(groups.map((group) => group.phase?.id)).toEqual(['development', undefined])
  })

  it('Should leave the cancelled task out of the count but keep it in the group', () => {
    const groups = groupTasksByPhase(
      [
        buildRow(),
        buildRow({ task: buildTask({ id: 'cancelada', status: 'cancelled', estimatedHours: 80 }) }),
      ],
      PHASES,
    )

    expect(groups[0]).toMatchObject({ countedTaskCount: 1, effortHours: 40 })
    expect(groups[0]?.tasks).toHaveLength(2)
  })
})

describe('sumTaskGroups', () => {
  it('Should total the footer the design prints for the gateway', () => {
    expect(sumTaskGroups(gatewayGroups)).toEqual({
      effortHours: 320,
      countedTaskCount: 4,
      period: { start: '2026-03-12', end: '2026-09-29' },
    })
  })

  it('Should total nothing when no group survives the filter', () => {
    expect(sumTaskGroups([])).toEqual({
      effortHours: 0,
      countedTaskCount: 0,
      period: null,
    })
  })
})
