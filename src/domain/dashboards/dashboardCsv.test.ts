import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import type { ProjectEventType } from '@/domain/schemas/projectEventSchema'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { buildDashboardCsv, buildDashboardCsvFileName } from './dashboardCsv'
import { buildDashboardSummary, type DashboardSummary } from './dashboardSummary'

const EVENT_TYPE_LABELS: Record<ProjectEventType, string> = {
  decision: 'Decisão',
  scope_change: 'Mudança de escopo',
  replan: 'Replanejamento',
  block: 'Bloqueio',
  unblock: 'Desbloqueio',
  reallocation: 'Realocação',
  risk: 'Risco',
  note: 'Nota',
}

let summary: DashboardSummary
let lines: string[]

function rowsOf(section: string): string[][] {
  return lines
    .map((line) => line.split(','))
    .filter((fields) => fields[0] === section)
}

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  summary = buildDashboardSummary({
    snapshot: readProjectsSnapshot(database),
    today: DESIGN_TODAY,
    weekStart: 'monday',
    periodKey: '90d',
  })
  lines = buildDashboardCsv({
    summary,
    periodLabel: '90 dias',
    eventTypeLabels: EVENT_TYPE_LABELS,
  }).split('\n')
})

describe('buildDashboardCsv', () => {
  it('Should open with the four column names', () => {
    expect(lines[0]).toBe('secao,item,valor,unidade')
  })

  it('Should carry the window the numbers were measured over', () => {
    expect(rowsOf('período')).toEqual([
      ['período', 'janela', '90 dias', ''],
      ['período', 'início', '2026-06-05', 'data'],
      ['período', 'fim', '2026-09-03', 'data'],
      ['período', 'projetos com atividade', '4', 'projetos'],
    ])
  })

  it('Should carry the five indicators the screen prints', () => {
    expect(rowsOf('indicador')).toEqual([
      ['indicador', 'projetos entregues', '0', 'projetos'],
      ['indicador', 'atraso médio', '8', 'dias'],
      ['indicador', 'esforço planejado', '396', 'horas'],
      ['indicador', 'uso de capacidade', '73.38', '%'],
      ['indicador', 'dias bloqueado', '31', 'dias'],
    ])
  })

  it('Should leave the value empty for the phase with no measured average', () => {
    const external = rowsOf('tempo médio em cada fase').find(
      (fields) => fields[1] === 'Homologação externa',
    )

    expect(external).toEqual(['tempo médio em cada fase', 'Homologação externa', '', 'dias'])
  })

  it('Should name the event types in Portuguese, which the domain does not know by itself', () => {
    expect(rowsOf('eventos por tipo').map((fields) => fields[1])).toEqual([
      'Decisão',
      'Mudança de escopo',
      'Replanejamento',
      'Bloqueio',
      'Desbloqueio',
      'Realocação',
      'Risco',
      'Nota',
    ])
  })

  it('Should quote the field that carries a comma, so it stays a single column', () => {
    const quoted = buildDashboardCsv({
      summary: {
        ...summary,
        blockedByProject: [
          { projectId: 'p1', name: 'Portal, do parceiro', phaseColor: null, blockedDays: 23 },
        ],
      },
      periodLabel: '90 dias',
      eventTypeLabels: EVENT_TYPE_LABELS,
    })

    expect(quoted).toContain('dias bloqueado por projeto,"Portal, do parceiro",23,dias')
  })

  it('Should double the quote inside a quoted field', () => {
    const quoted = buildDashboardCsv({
      summary: {
        ...summary,
        blockedByProject: [
          { projectId: 'p1', name: 'Portal "beta"', phaseColor: null, blockedDays: 8 },
        ],
      },
      periodLabel: '90 dias',
      eventTypeLabels: EVENT_TYPE_LABELS,
    })

    expect(quoted).toContain('dias bloqueado por projeto,"Portal ""beta""",8,dias')
  })

  it('Should print every project of the allocation chart three times, one per unit', () => {
    expect(rowsOf('pessoas alocadas por projeto')).toHaveLength(
      summary.allocationByProject.length * 3,
    )
  })
})

describe('buildDashboardCsvFileName', () => {
  it('Should name the file after the window it carries', () => {
    expect(buildDashboardCsvFileName(summary)).toBe('paineis-90d-2026-09-03.csv')
  })
})
