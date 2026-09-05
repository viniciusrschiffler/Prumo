import { describe, expect, it } from 'vitest'
import { buildProjectRow } from '@/domain/testing/projectRowBuilders'
import { sortProjectRows } from './projectSort'

const GATEWAY = buildProjectRow(
  { id: 'gateway', name: 'Migração do gateway', priority: 'P1' },
  { deviationInDays: 11, effortHours: 320, period: { start: '2026-03-12', end: '2026-09-29' } },
)
const PARCEIRO = buildProjectRow(
  { id: 'parceiro', name: 'Portal do parceiro', priority: 'P0' },
  { deviationInDays: 23, effortHours: 168, period: { start: '2026-02-02', end: '2026-03-16' } },
)
const CAMPO = buildProjectRow(
  { id: 'campo', name: 'App de campo v2', priority: 'P2' },
  { deviationInDays: -2, effortHours: 140, period: { start: '2026-07-01', end: '2026-10-02' } },
)
const DESCOBERTA = buildProjectRow({ id: 'novo', name: 'Autoatendimento', priority: 'P2' })

const ROWS = [GATEWAY, PARCEIRO, CAMPO, DESCOBERTA]

function idsOf(rows: readonly { project: { id: string } }[]): string[] {
  return rows.map((row) => row.project.id)
}

describe('sortProjectRows', () => {
  it('Should put the most urgent priority first', () => {
    expect(idsOf(sortProjectRows(ROWS, 'priority'))).toEqual([
      'parceiro',
      'gateway',
      'campo',
      'novo',
    ])
  })

  it('Should put the most delayed project first', () => {
    expect(idsOf(sortProjectRows(ROWS, 'deviation'))).toEqual([
      'parceiro',
      'gateway',
      'campo',
      'novo',
    ])
  })

  it('Should put the earliest end first', () => {
    expect(idsOf(sortProjectRows(ROWS, 'plannedEnd'))).toEqual([
      'parceiro',
      'gateway',
      'campo',
      'novo',
    ])
  })

  it('Should put the largest effort first', () => {
    expect(idsOf(sortProjectRows(ROWS, 'effort'))).toEqual([
      'gateway',
      'parceiro',
      'campo',
      'novo',
    ])
  })

  it('Should send the project with no number to the end instead of treating it as the smallest', () => {
    expect(idsOf(sortProjectRows(ROWS, 'deviation')).at(-1)).toBe('novo')
    expect(idsOf(sortProjectRows(ROWS, 'plannedEnd')).at(-1)).toBe('novo')
  })

  it('Should break a tie by the project name', () => {
    const tied = [
      buildProjectRow({ id: 'b', name: 'Zebra', priority: 'P1' }),
      buildProjectRow({ id: 'a', name: 'Abacate', priority: 'P1' }),
    ]

    expect(idsOf(sortProjectRows(tied, 'priority'))).toEqual(['a', 'b'])
  })

  it('Should leave the received list untouched', () => {
    sortProjectRows(ROWS, 'effort')

    expect(idsOf(ROWS)).toEqual(['gateway', 'parceiro', 'campo', 'novo'])
  })
})
