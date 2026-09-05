import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { buildProjectRows, type ProjectTaskRow } from './projectRow'
import { countTasksByFilter, filterTaskRows } from './taskFilters'

function buildRow(overrides: Partial<ProjectTaskRow> = {}): ProjectTaskRow {
  return {
    task: buildTask(),
    phase: null,
    people: [],
    hasOnlyEndedAllocations: false,
    deviationInDays: null,
    isPlanned: true,
    ...overrides,
  }
}

let gatewayRows: readonly ProjectTaskRow[]

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()
  const snapshot = readProjectsSnapshot(database)

  gatewayRows =
    buildProjectRows(snapshot).find((row) => row.project.id === 'gateway')?.tasks ?? []
})

describe('filterTaskRows', () => {
  it('Should keep every task under the "Todas" filter', () => {
    expect(filterTaskRows(gatewayRows, 'all', '')).toHaveLength(4)
  })

  it('Should leave the concluded task out of the open ones', () => {
    const open = filterTaskRows(gatewayRows, 'open', '')

    expect(open.map((row) => row.task.id)).toEqual(['gw-rew', 'gw-tes', 'gw-cut'])
  })

  it('Should list only what runs past its baseline as delayed', () => {
    const delayed = filterTaskRows(gatewayRows, 'delayed', '')

    expect(delayed.map((row) => row.task.id)).toEqual(['gw-rew', 'gw-cut'])
  })

  it('Should flag as unassigned only the task nobody ever took', () => {
    const unassigned = filterTaskRows(gatewayRows, 'unassigned', '')

    expect(unassigned.map((row) => row.task.id)).toEqual(['gw-cut'])
  })

  it('Should not call unassigned a task whose allocations were all ended', () => {
    const rows = [buildRow({ people: [], hasOnlyEndedAllocations: true })]

    expect(filterTaskRows(rows, 'unassigned', '')).toEqual([])
  })

  it('Should search the title ignoring the case', () => {
    expect(filterTaskRows(gatewayRows, 'all', 'CARGA').map((row) => row.task.id)).toEqual([
      'gw-tes',
    ])
  })

  it('Should combine the filter with the search', () => {
    expect(filterTaskRows(gatewayRows, 'open', 'ambiente')).toEqual([])
  })

  it('Should ignore a search of blanks only', () => {
    expect(filterTaskRows(gatewayRows, 'all', '   ')).toHaveLength(4)
  })
})

describe('countTasksByFilter', () => {
  it('Should count each chip of the gateway', () => {
    expect(countTasksByFilter(gatewayRows)).toEqual({
      all: 4,
      open: 3,
      delayed: 2,
      unassigned: 1,
    })
  })

  it('Should count a task with people as assigned', () => {
    const rows = [buildRow({ people: [buildPerson()] })]

    expect(countTasksByFilter(rows).unassigned).toBe(0)
  })
})
