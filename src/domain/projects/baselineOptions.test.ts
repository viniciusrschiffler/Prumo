import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { compareAgainstBaseline, listBaselineOptions } from './baselineOptions'
import type { ProjectsSnapshot } from './projectRow'

const GATEWAY_CURRENT_END = '2026-09-29'

let seed: ProjectsSnapshot

function gatewayBaselines(snapshot: ProjectsSnapshot) {
  return snapshot.baselines.filter((baseline) => baseline.projectId === 'gateway')
}

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  seed = readProjectsSnapshot(database)
})

describe('listBaselineOptions', () => {
  it('Should put the current baseline on top, as the design select does', () => {
    const options = listBaselineOptions(gatewayBaselines(seed), seed.baselineTasks)

    expect(options.map((option) => [option.baseline.version, option.isCurrent])).toEqual([
      [2, true],
      [1, false],
    ])
  })

  it('Should carry the reason and the moment each baseline was frozen', () => {
    const options = listBaselineOptions(gatewayBaselines(seed), seed.baselineTasks)

    expect(options[0]?.baseline).toMatchObject({
      reason: 'mudança de escopo',
      createdAt: '2026-08-12T10:30:00Z',
    })
    expect(options[1]?.baseline.reason).toBe('plano inicial')
  })

  it('Should read the window each baseline froze', () => {
    const options = listBaselineOptions(gatewayBaselines(seed), seed.baselineTasks)

    expect(options.map((option) => option.period)).toEqual([
      { start: '2026-03-12', end: '2026-09-18' },
      { start: '2026-03-12', end: '2026-06-26' },
    ])
  })

  it('Should return nothing for a project with no baseline', () => {
    expect(listBaselineOptions([], seed.baselineTasks)).toEqual([])
  })
})

describe('compareAgainstBaseline', () => {
  it('Should be eleven days late against the current baseline, the number of the design', () => {
    const comparison = compareAgainstBaseline(
      null,
      gatewayBaselines(seed),
      seed.baselineTasks,
      GATEWAY_CURRENT_END,
    )

    expect(comparison.baseline?.version).toBe(2)
    expect(comparison.deviationInDays).toBe(11)
    expect(comparison.isDelayed).toBe(true)
  })

  it('Should measure a much larger gap when the first baseline is chosen', () => {
    const comparison = compareAgainstBaseline(
      'bl-gw-1',
      gatewayBaselines(seed),
      seed.baselineTasks,
      GATEWAY_CURRENT_END,
    )

    expect(comparison.baseline?.version).toBe(1)
    expect(comparison.deviationInDays).toBe(95)
  })

  it('Should fall back to the current baseline when the chosen one no longer exists', () => {
    const comparison = compareAgainstBaseline(
      'apagada',
      gatewayBaselines(seed),
      seed.baselineTasks,
      GATEWAY_CURRENT_END,
    )

    expect(comparison.baseline?.version).toBe(2)
  })

  it('Should report no deviation for a project that has no baseline', () => {
    expect(compareAgainstBaseline(null, [], [], GATEWAY_CURRENT_END)).toEqual({
      baseline: null,
      period: null,
      deviationInDays: null,
      isDelayed: false,
    })
  })

  it('Should report no deviation while the project has no end of its own', () => {
    const comparison = compareAgainstBaseline(
      null,
      gatewayBaselines(seed),
      seed.baselineTasks,
      null,
    )

    expect(comparison.deviationInDays).toBeNull()
    expect(comparison.isDelayed).toBe(false)
  })
})
