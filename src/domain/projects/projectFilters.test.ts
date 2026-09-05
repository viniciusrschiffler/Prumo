import { describe, expect, it } from 'vitest'
import { buildProjectRow } from '@/domain/testing/projectRowBuilders'
import {
  ALL_STATUSES,
  countProjectsByStatus,
  countProjectsMatchingView,
  filterProjectRows,
  parseProjectsViewFilters,
  type ProjectFilter,
} from './projectFilters'

const GATEWAY = buildProjectRow(
  { id: 'gateway', name: 'Migração do gateway', status: 'active', priority: 'P1' },
  { tagNames: ['pagamentos', 'infra'], isDelayed: true, hasOpenRisk: true },
)
const PARCEIRO = buildProjectRow(
  { id: 'parceiro', name: 'Portal do parceiro', status: 'blocked', priority: 'P0', ownerPersonId: null },
  { tagNames: ['parceiro'] },
)
const CAMPO = buildProjectRow({
  id: 'campo',
  name: 'App de campo v2',
  status: 'paused',
  priority: 'P2',
})

const ROWS = [GATEWAY, PARCEIRO, CAMPO]

function idsOf(rows: readonly { project: { id: string } }[]): string[] {
  return rows.map((row) => row.project.id)
}

describe('filterProjectRows', () => {
  const noFilter: ProjectFilter = { status: ALL_STATUSES, search: '', viewFilters: null }

  it('Should return every project when nothing is filtered', () => {
    expect(idsOf(filterProjectRows(ROWS, noFilter))).toEqual(['gateway', 'parceiro', 'campo'])
  })

  it('Should keep only the projects of the chosen status', () => {
    expect(idsOf(filterProjectRows(ROWS, { ...noFilter, status: 'blocked' }))).toEqual(['parceiro'])
  })

  it('Should match the search against the project name', () => {
    expect(idsOf(filterProjectRows(ROWS, { ...noFilter, search: 'portal' }))).toEqual(['parceiro'])
  })

  it('Should match the search against a tag as well', () => {
    expect(idsOf(filterProjectRows(ROWS, { ...noFilter, search: 'infra' }))).toEqual(['gateway'])
  })

  it('Should ignore the case typed in the search', () => {
    expect(idsOf(filterProjectRows(ROWS, { ...noFilter, search: 'MIGRAÇÃO' }))).toEqual(['gateway'])
  })

  it('Should combine the status with the search', () => {
    expect(filterProjectRows(ROWS, { ...noFilter, status: 'active', search: 'portal' })).toEqual([])
  })

  it('Should apply the priority list of a saved view', () => {
    const filtered = filterProjectRows(ROWS, {
      ...noFilter,
      viewFilters: { priority: ['P0', 'P1'] },
    })

    expect(idsOf(filtered)).toEqual(['gateway', 'parceiro'])
  })

  it('Should apply the project without owner filter of a saved view', () => {
    expect(idsOf(filterProjectRows(ROWS, { ...noFilter, viewFilters: { withoutOwner: true } }))).toEqual(
      ['parceiro'],
    )
  })

  it('Should apply the derived delayed and at risk filters of a saved view', () => {
    expect(idsOf(filterProjectRows(ROWS, { ...noFilter, viewFilters: { delayed: true } }))).toEqual([
      'gateway',
    ])
    expect(idsOf(filterProjectRows(ROWS, { ...noFilter, viewFilters: { atRisk: true } }))).toEqual([
      'gateway',
    ])
  })
})

describe('countProjectsByStatus', () => {
  it('Should count every project under the all bucket', () => {
    expect(countProjectsByStatus(ROWS).get(ALL_STATUSES)).toBe(3)
  })

  it('Should count each status separately', () => {
    const counts = countProjectsByStatus(ROWS)

    expect(counts.get('active')).toBe(1)
    expect(counts.get('blocked')).toBe(1)
  })

  it('Should leave a status nobody uses without an entry', () => {
    expect(countProjectsByStatus(ROWS).get('completed')).toBeUndefined()
  })
})

describe('countProjectsMatchingView', () => {
  it('Should count what the saved view would show without applying it', () => {
    expect(countProjectsMatchingView(ROWS, { status: ['active', 'blocked'] })).toBe(2)
  })
})

describe('parseProjectsViewFilters', () => {
  it('Should read the filters the seed stores for the critical projects view', () => {
    expect(
      parseProjectsViewFilters('{"priority":["P0","P1"],"status":["active","blocked"]}'),
    ).toEqual({ priority: ['P0', 'P1'], status: ['active', 'blocked'] })
  })

  it('Should read the filters of the view without owner', () => {
    expect(parseProjectsViewFilters('{"withoutOwner":true}')).toEqual({ withoutOwner: true })
  })

  it('Should tolerate a key this version does not know', () => {
    expect(parseProjectsViewFilters('{"withoutOwner":true,"fase":"dev"}')).toEqual({
      withoutOwner: true,
    })
  })

  it('Should refuse text that is not JSON', () => {
    expect(parseProjectsViewFilters('não é json')).toBeNull()
  })

  it('Should refuse a status that is outside the enum', () => {
    expect(parseProjectsViewFilters('{"status":["atrasado"]}')).toBeNull()
  })
})
