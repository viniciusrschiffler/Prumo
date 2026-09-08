import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { DASHBOARD_PERIOD_KEYS, type DashboardPeriodKey } from './dashboardPeriod'
import { buildDashboardSummary, type DashboardSummary } from './dashboardSummary'

let snapshot: ProjectsSnapshot
const summaries = new Map<DashboardPeriodKey, DashboardSummary>()

function summaryOf(periodKey: DashboardPeriodKey): DashboardSummary {
  const summary = summaries.get(periodKey)

  if (summary === undefined) {
    throw new Error(`o resumo de ${periodKey} não foi montado`)
  }

  return summary
}

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  snapshot = readProjectsSnapshot(database)

  for (const periodKey of DASHBOARD_PERIOD_KEYS) {
    summaries.set(
      periodKey,
      buildDashboardSummary({ snapshot, today: DESIGN_TODAY, weekStart: 'monday', periodKey }),
    )
  }
})

describe('Janela dos Painéis sobre o seed', () => {
  it('Should open the three windows on the dates the design subhead prints', () => {
    expect(summaryOf('30d').period).toEqual({ start: '2026-08-04', end: '2026-09-03' })
    expect(summaryOf('90d').period).toEqual({ start: '2026-06-05', end: '2026-09-03' })
    expect(summaryOf('12m').period).toEqual({ start: '2025-09-03', end: '2026-09-03' })
  })

  it('Should find four projects with activity, as the design subhead prints', () => {
    expect(summaryOf('30d').projectCount).toBe(4)
    expect(summaryOf('90d').projectCount).toBe(4)
    expect(summaryOf('12m').projectCount).toBe(4)
  })

  it('Should leave the archived project out of every window', () => {
    const archived = snapshot.projects.filter((project) => project.archivedAt !== null)
    const names = summaryOf('12m').allocationByProject.map((row) => row.name)

    expect(archived.length).toBeGreaterThan(0)
    expect(names).not.toContain(archived[0]?.name)
  })
})

describe('Indicadores sobre o seed', () => {
  // O mockup imprime 1, 2 e 6 projetos entregues. Nenhum projeto do seed tem todas as tarefas
  // contadas concluídas, então o número honesto é zero nos três períodos.
  it('Should deliver no project in any window, against the 1, 2 and 6 of the mockup', () => {
    expect(summaryOf('30d').kpis.deliveredProjectCount).toBe(0)
    expect(summaryOf('90d').kpis.deliveredProjectCount).toBe(0)
    expect(summaryOf('12m').kpis.deliveredProjectCount).toBe(0)
  })

  it('Should average the deviation at +8d, and not at the +11d of a single project', () => {
    expect(summaryOf('30d').kpis.averageDeviationInDays).toBe(8)
    expect(summaryOf('90d').kpis.averageDeviationInDays).toBe(8)
    expect(summaryOf('12m').kpis.averageDeviationInDays).toBe(8)
  })

  it('Should grow the planned effort with the window', () => {
    expect(summaryOf('30d').kpis.plannedEffortHours).toBe(236)
    expect(summaryOf('90d').kpis.plannedEffortHours).toBe(396)
    expect(summaryOf('12m').kpis.plannedEffortHours).toBe(604)
  })

  it('Should read the capacity usage against the active team only', () => {
    expect(Math.round(summaryOf('30d').kpis.capacityUsagePercentage)).toBe(66)
    expect(Math.round(summaryOf('90d').kpis.capacityUsagePercentage)).toBe(73)
    expect(Math.round(summaryOf('12m').kpis.capacityUsagePercentage)).toBe(36)
  })

  it('Should count 23 blocked days in the last month and 31 in the last quarter', () => {
    expect(summaryOf('30d').kpis.blockedDays).toBe(23)
    expect(summaryOf('90d').kpis.blockedDays).toBe(31)
    expect(summaryOf('12m').kpis.blockedDays).toBe(31)
  })
})

describe('Pessoas alocadas por projeto sobre o seed', () => {
  it('Should peak the gateway at 150 per cent, and not at the 200 of the mockup', () => {
    expect(
      summaryOf('90d').allocationByProject.map((row) => [row.name, row.peakPercentage]),
    ).toEqual([
      ['Migração do gateway', 150],
      ['Observabilidade', 100],
      ['Portal do parceiro', 100],
      ['App de campo v2', 30],
    ])
  })

  it('Should leave Observabilidade at zero in the last month, the ended case the mockup draws', () => {
    const row = summaryOf('30d').allocationByProject.find(
      (candidate) => candidate.name === 'Observabilidade',
    )

    expect(row).toMatchObject({ peakPercentage: 0, personCount: 0, allocationCount: 0 })
  })

  it('Should count the allocations of the window, not the people, in the chart header', () => {
    expect(summaryOf('30d').allocationCount).toBe(7)
    expect(summaryOf('90d').allocationCount).toBe(10)
    expect(summaryOf('12m').allocationCount).toBe(13)
  })

  it('Should mark the Portal as blocked and the field app as paused', () => {
    const rows = summaryOf('90d').allocationByProject

    expect(rows.find((row) => row.name === 'Portal do parceiro')?.isBlocked).toBe(true)
    expect(rows.find((row) => row.name === 'App de campo v2')?.isPaused).toBe(true)
  })
})

describe('Projetos por fase sobre o seed', () => {
  it('Should place three projects in development and one in external homologation', () => {
    expect(
      summaryOf('90d').projectsByPhase.map((entry) => [entry.phase.name, entry.projectCount]),
    ).toEqual([
      ['Desenvolvimento', 3],
      ['Homologação interna', 0],
      ['Homologação externa', 1],
      ['Produção', 0],
    ])
  })

  it('Should add up to the four projects with activity, because each counts one phase only', () => {
    const total = summaryOf('90d').projectsByPhase.reduce(
      (sum, entry) => sum + entry.projectCount,
      0,
    )

    expect(total).toBe(summaryOf('90d').projectCount)
  })
})

describe('Tempo médio em cada fase sobre o seed', () => {
  it('Should measure no average for the phase with no task in the quarter', () => {
    expect(summaryOf('90d').phaseDurations.map((row) => [row.phase.name, row.averageDays])).toEqual([
      ['Desenvolvimento', 43],
      ['Homologação interna', 34],
      ['Homologação externa', null],
      ['Produção', 18],
    ])
  })

  it('Should reach the external homologation only in the twelve-month window', () => {
    expect(summaryOf('12m').phaseDurations.map((row) => [row.phase.name, row.averageDays])).toEqual([
      ['Desenvolvimento', 36.75],
      ['Homologação interna', 34],
      ['Homologação externa', 42],
      ['Produção', 18],
    ])
  })

  // O mockup compara o gargalo com a primeira fase e a chama de desenvolvimento. Sobre o seed
  // é o próprio desenvolvimento que é o gargalo no trimestre, então a comparação que sempre diz
  // alguma coisa é contra a fase mais rápida.
  it('Should name development the bottleneck of the quarter, against production', () => {
    expect(summaryOf('90d').bottleneck).toMatchObject({
      slowest: { name: 'Desenvolvimento' },
      fastest: { name: 'Produção' },
    })
  })

  it('Should hand the bottleneck to the external homologation over twelve months', () => {
    expect(summaryOf('12m').bottleneck).toMatchObject({
      slowest: { name: 'Homologação externa' },
      fastest: { name: 'Produção' },
    })
  })
})

describe('Dias de projeto bloqueado sobre o seed', () => {
  it('Should print one column per month of the window, the empty ones included', () => {
    expect(
      summaryOf('90d').blockedByMonth.map((month) => [month.monthStart, month.blockedDays]),
    ).toEqual([
      ['2026-06-01', 0],
      ['2026-07-01', 8],
      ['2026-08-01', 21],
      ['2026-09-01', 2],
    ])
  })

  it('Should draw thirteen columns over twelve months, and not the six the mockup picks', () => {
    expect(summaryOf('12m').blockedByMonth).toHaveLength(13)
  })

  it('Should add the months up to exactly the blocked days of the window', () => {
    const total = summaryOf('90d').blockedByMonth.reduce(
      (sum, month) => sum + month.blockedDays,
      0,
    )

    expect(total).toBe(summaryOf('90d').kpis.blockedDays)
  })

  it('Should list the Portal at 23 days and the gateway at 8, as the mockup does', () => {
    expect(summaryOf('90d').blockedByProject.map((row) => [row.name, row.blockedDays])).toEqual([
      ['Portal do parceiro', 23],
      ['Migração do gateway', 8],
    ])
  })
})

describe('Distribuição de carga sobre o seed', () => {
  it('Should leave the inactive person out of the chart', () => {
    expect(summaryOf('90d').workload.map((row) => row.person.name)).toEqual([
      'Rafael Brito',
      'Ana Nogueira',
      'Marcos Teles',
    ])
  })

  it('Should keep everybody under the line in the quarter, against the 121 the mockup gives Rafael', () => {
    expect(summaryOf('90d').workload.map((row) => Math.round(row.averagePercentage))).toEqual([
      96, 89, 21,
    ])
  })
})

describe('Eventos registrados por tipo sobre o seed', () => {
  it('Should draw eight columns, because replan was born after the mockup', () => {
    expect(summaryOf('90d').events.map((entry) => [entry.type, entry.count])).toEqual([
      ['decision', 3],
      ['scope_change', 1],
      ['replan', 0],
      ['block', 2],
      ['unblock', 1],
      ['reallocation', 1],
      ['risk', 2],
      ['note', 2],
    ])
  })

  it('Should count twelve events in the quarter, and not the thirty of the mockup', () => {
    expect(summaryOf('30d').eventCount).toBe(9)
    expect(summaryOf('90d').eventCount).toBe(12)
    expect(summaryOf('12m').eventCount).toBe(12)
  })
})
