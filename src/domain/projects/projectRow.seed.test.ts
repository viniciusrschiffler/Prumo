import { DatabaseSync } from 'node:sqlite'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildSeedData } from '../../../scripts/seed/seedData.ts'
import { createDateShifter, DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { splitSqlStatements } from '@/infra/database/splitSqlStatements'
import { buildProjectRows, type ProjectRow } from './projectRow'
import { sumProjectsTotals } from './projectTotals'

const MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('../../infra/database/migrations', import.meta.url),
)

let rows: ProjectRow[]

function rowOf(projectId: string): ProjectRow {
  const row = rows.find((candidate) => candidate.project.id === projectId)

  if (row === undefined) {
    throw new Error(`projeto ${projectId} não encontrado nas linhas montadas`)
  }

  return row
}

beforeAll(() => {
  const database = new DatabaseSync(':memory:')
  database.exec('PRAGMA foreign_keys = ON')

  const migrations = readdirSync(MIGRATIONS_DIRECTORY)
    .filter((name) => name.endsWith('.sql'))
    .sort()

  for (const file of migrations) {
    for (const statement of splitSqlStatements(
      readFileSync(join(MIGRATIONS_DIRECTORY, file), 'utf8'),
    )) {
      database.exec(statement)
    }
  }

  for (const seed of buildSeedData(createDateShifter(DESIGN_TODAY))) {
    const placeholders = seed.columns.map(() => '?').join(', ')
    const statement = database.prepare(
      `INSERT INTO ${seed.table} (${seed.columns.join(', ')}) VALUES (${placeholders})`,
    )

    for (const row of seed.rows) {
      statement.run(...(row as never[]))
    }
  }

  rows = buildProjectRows(readProjectsSnapshot(database))
})

describe('buildProjectRows sobre o seed', () => {
  it('Should build one row per project', () => {
    expect(rows.map((row) => row.project.id).toSorted()).toEqual([
      'campo',
      'erp',
      'gateway',
      'observabilidade',
      'parceiro',
    ])
  })

  it('Should show the 320h and the eleven days of delay the design prints for the gateway', () => {
    const gateway = rowOf('gateway')

    expect(gateway.effortHours).toBe(320)
    expect(gateway.deviationInDays).toBe(11)
    expect(gateway.isDelayed).toBe(true)
  })

  it('Should show the 168h and the twenty three days of delay of the partner portal', () => {
    const parceiro = rowOf('parceiro')

    expect(parceiro.effortHours).toBe(168)
    expect(parceiro.deviationInDays).toBe(23)
  })

  it('Should show the field app two days ahead of its baseline', () => {
    expect(rowOf('campo').deviationInDays).toBe(-2)
    expect(rowOf('campo').isDelayed).toBe(false)
  })

  it('Should report the partner portal as having only ended allocations', () => {
    const parceiro = rowOf('parceiro')

    expect(parceiro.people).toEqual([])
    expect(parceiro.hasOnlyEndedAllocations).toBe(true)
  })

  it('Should list the two people still allocated to the gateway', () => {
    expect(rowOf('gateway').people.map((person) => person.initials)).toEqual(['AN', 'RB'])
  })

  it('Should weight the gateway progress by the completed hours', () => {
    const progress = rowOf('gateway').hoursProgress

    expect(progress.totalHours).toBe(320)
    expect(progress.completedHours).toBe(40)
  })

  it('Should count one of four gateway tasks as done in the task view', () => {
    expect(rowOf('gateway').taskProgress).toEqual({
      doneCount: 1,
      countedCount: 4,
      ratio: 0.25,
    })
  })

  it('Should place the gateway in Desenvolvimento, where its open task lives', () => {
    expect(rowOf('gateway').currentPhase?.name).toBe('Desenvolvimento')
  })

  it('Should leave the cancelled project with no phase, no effort and no period', () => {
    const erp = rowOf('erp')

    expect(erp.currentPhase).toBeNull()
    expect(erp.effortHours).toBe(0)
    expect(erp.period).toBeNull()
    expect(erp.countedTaskCount).toBe(0)
  })

  it('Should flag the two projects that carry an open risk', () => {
    expect(rows.filter((row) => row.hasOpenRisk).map((row) => row.project.id).toSorted()).toEqual([
      'gateway',
      'parceiro',
    ])
  })

  it('Should carry the tags of each project', () => {
    expect(rowOf('gateway').tagNames.toSorted()).toEqual(['infra', 'pagamentos'])
  })

  it('Should measure the eleven days of the rewrite task against the current baseline', () => {
    const rewrite = rowOf('gateway').tasks.find((row) => row.task.id === 'gw-rew')

    expect(rewrite?.deviationInDays).toBe(11)
  })

  it('Should leave the unplanned partner task with no period to compare', () => {
    const homologation = rowOf('parceiro').tasks.find((row) => row.task.id === 'pp-hom')

    expect(homologation?.isPlanned).toBe(false)
    expect(homologation?.deviationInDays).toBeNull()
  })

  it('Should total the effort and the derived counters of the whole board', () => {
    expect(sumProjectsTotals(rows)).toEqual({
      effortHours: 320 + 168 + 140 + 96,
      taskCount: 10,
      projectCount: 5,
      delayedCount: 2,
      atRiskCount: 2,
    })
  })
})
