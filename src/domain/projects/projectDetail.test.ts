import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { findProjectDetail, type ProjectDetail } from './projectDetail'
import type { ProjectsSnapshot } from './projectRow'

let seed: ProjectsSnapshot
let gateway: ProjectDetail

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  seed = readProjectsSnapshot(database)
  gateway = findProjectDetail(seed, 'gateway', null) as ProjectDetail
})

describe('findProjectDetail', () => {
  it('Should return nothing for a project that does not exist', () => {
    expect(findProjectDetail(seed, 'inexistente', null)).toBeNull()
  })

  it('Should carry the header the design shows for the gateway', () => {
    expect(gateway.row.project).toMatchObject({
      name: 'Migração do gateway',
      status: 'active',
      priority: 'P1',
    })
    expect(gateway.row.tagNames).toEqual(['pagamentos', 'infra'])
  })

  it('Should total the metric strip with the numbers printed on the design', () => {
    expect(gateway.row.effortHours).toBe(320)
    expect(gateway.row.people.map((person) => person.initials)).toEqual(['AN', 'RB'])
    expect(gateway.row.period).toEqual({ start: '2026-03-12', end: '2026-09-29' })
    expect(gateway.comparison.deviationInDays).toBe(11)
    expect(gateway.comparison.baseline?.version).toBe(2)
  })

  it('Should weight the progress by the hours already concluded', () => {
    expect(gateway.row.hoursProgress).toEqual({
      completedHours: 40,
      totalHours: 320,
      ratio: 0.125,
    })
  })

  it('Should measure against the baseline the reader picks', () => {
    const againstFirst = findProjectDetail(seed, 'gateway', 'bl-gw-1') as ProjectDetail

    expect(againstFirst.comparison.baseline?.version).toBe(1)
    expect(againstFirst.comparison.deviationInDays).toBe(95)
  })

  it('Should gather the four tasks, the eight allocations and the eight events', () => {
    expect(gateway.row.tasks).toHaveLength(4)
    expect(gateway.allocationRows).toHaveLength(8)
    expect(gateway.feed).toHaveLength(8)
  })

  it('Should count the notes linked to this project only', () => {
    expect(gateway.noteCount).toBe(2)
  })

  it('Should report the open risk the design badges', () => {
    expect(gateway.row.hasOpenRisk).toBe(true)
  })

  it('Should find the conflict the inline alert of the design describes', () => {
    const rafael = gateway.conflicts.find((conflict) => conflict.person.id === 'rafael')

    expect(rafael).toMatchObject({
      totalPercentage: 150,
      period: { start: '2026-06-01', end: '2026-06-26' },
    })
  })

  it('Should hold a project with no task, baseline or event without breaking', () => {
    const empty = findProjectDetail(
      { ...seed, tasks: [], allocations: [], baselines: [], events: [], notes: [] },
      'gateway',
      null,
    ) as ProjectDetail

    expect(empty.row.effortHours).toBe(0)
    expect(empty.row.period).toBeNull()
    expect(empty.baselineOptions).toEqual([])
    expect(empty.comparison.deviationInDays).toBeNull()
    expect(empty.feed).toEqual([])
    expect(empty.noteCount).toBe(0)
  })
})
