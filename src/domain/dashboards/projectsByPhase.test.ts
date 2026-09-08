import { describe, expect, it } from 'vitest'
import { buildProjectRow } from '@/domain/testing/projectRowBuilders'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { ProjectActivity } from './dashboardActivity'
import { countProjectsByPhase } from './projectsByPhase'

function buildPhase(id: string, name: string, sortOrder: number, active = true): Phase {
  return { id, name, sortOrder, color: 'oklch(0.545 0.16 292)', active }
}

const DEVELOPMENT = buildPhase('development', 'Desenvolvimento', 0)
const PRODUCTION = buildPhase('production', 'Produção', 1)

function buildActivity(id: string, currentPhase: Phase | null): ProjectActivity {
  return {
    row: buildProjectRow({ id, name: id }, { currentPhase }),
    tasksInPeriod: [],
    events: [],
    eventsInPeriod: [],
    allocationsInPeriod: [],
    blockedDays: 0,
  }
}

describe('countProjectsByPhase', () => {
  it('Should count each project once, in the phase of its first open task', () => {
    const counts = countProjectsByPhase(
      [
        buildActivity('gateway', DEVELOPMENT),
        buildActivity('portal', DEVELOPMENT),
        buildActivity('field', PRODUCTION),
      ],
      [DEVELOPMENT, PRODUCTION],
    )

    expect(counts.map((entry) => [entry.phase.name, entry.projectCount])).toEqual([
      ['Desenvolvimento', 2],
      ['Produção', 1],
    ])
  })

  it('Should draw the column of the phase nobody is in, so the chart keeps its shape', () => {
    const counts = countProjectsByPhase([buildActivity('gateway', DEVELOPMENT)], [DEVELOPMENT, PRODUCTION])

    expect(counts.find((entry) => entry.phase.id === 'production')?.projectCount).toBe(0)
  })

  it('Should leave out the inactive phase', () => {
    const retired = buildPhase('retired', 'Fase aposentada', 2, false)
    const counts = countProjectsByPhase([buildActivity('gateway', DEVELOPMENT)], [DEVELOPMENT, retired])

    expect(counts.map((entry) => entry.phase.id)).toEqual(['development'])
  })

  it('Should count nowhere the project whose tasks are all closed', () => {
    const counts = countProjectsByPhase([buildActivity('gateway', null)], [DEVELOPMENT, PRODUCTION])

    expect(counts.map((entry) => entry.projectCount)).toEqual([0, 0])
  })
})
