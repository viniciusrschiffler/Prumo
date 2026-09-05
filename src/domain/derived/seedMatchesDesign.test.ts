import { DatabaseSync } from 'node:sqlite'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildSeedData } from '../../../scripts/seed/seedData.ts'
import { createDateShifter, DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import { splitSqlStatements } from '@/infra/database/splitSqlStatements'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { BaselineTask } from '@/domain/schemas/baselineSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import { calculateBlockedDays } from './calculateBlockedDays'
import { calculateDeviationInDays, isDelayed } from './calculateDeviationInDays'
import { calculateProgress } from './calculateProgress'
import { calculateTotalEffort } from './calculateTotalEffort'
import { calculateWeeklyCapacity, isOverallocated } from './calculateWeeklyCapacity'
import { deriveBaselinePeriod, deriveProjectPeriod } from './deriveProjectPeriod'
import { listActivePersonIds } from './listActivePersonIds'

const MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('../../infra/database/migrations', import.meta.url),
)

let database: DatabaseSync

function selectRows<TRow>(query: string, values: unknown[] = []): TRow[] {
  return database.prepare(query).all(...(values as never[])) as TRow[]
}

function readTasks(projectId: string): Task[] {
  return selectRows<Record<string, never>>(
    'SELECT * FROM task WHERE project_id = ?',
    [projectId],
  ).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    title: row.title,
    status: row.status,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    actualStart: row.actual_start,
    actualEnd: row.actual_end,
    estimatedHours: row.estimated_hours,
    sortOrder: row.sort_order,
  }))
}

function readBaselineTasks(baselineId: string): BaselineTask[] {
  return selectRows<Record<string, never>>(
    'SELECT * FROM baseline_task WHERE baseline_id = ?',
    [baselineId],
  ).map((row) => ({
    baselineId: row.baseline_id,
    taskId: row.task_id,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    estimatedHours: row.estimated_hours,
  }))
}

function readAllocations(projectId?: string): Allocation[] {
  const query =
    projectId === undefined
      ? 'SELECT a.* FROM allocation a'
      : 'SELECT a.* FROM allocation a JOIN task t ON t.id = a.task_id WHERE t.project_id = ?'

  return selectRows<Record<string, never>>(query, projectId === undefined ? [] : [projectId]).map(
    (row) => ({
      id: row.id,
      taskId: row.task_id,
      personId: row.person_id,
      startDate: row.start_date,
      endDate: row.end_date,
      percentage: row.percentage,
      endedAt: row.ended_at,
      endedReason: row.ended_reason,
    }),
  )
}

function readEvents(projectId: string): ProjectEvent[] {
  return selectRows<Record<string, never>>(
    'SELECT * FROM project_event WHERE project_id = ?',
    [projectId],
  ).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    eventDate: row.event_date,
    title: row.title,
    bodyMarkdown: row.body_md,
    revertsEventId: row.reverts_event_id,
    riskOpen: row.risk_open !== 0,
    expectedResumeAt: row.expected_resume_at,
    createdAt: row.created_at,
  }))
}

function readPerson(id: string): Person {
  const row = selectRows<Record<string, never>>('SELECT * FROM person WHERE id = ?', [id])[0]

  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    role: row.role,
    weeklyCapacityHours: row.weekly_capacity_hours,
    active: row.active !== 0,
  }
}

beforeAll(() => {
  database = new DatabaseSync(':memory:')
  database.exec('PRAGMA foreign_keys = ON')

  for (const file of readdirSync(MIGRATIONS_DIRECTORY).filter((name) => name.endsWith('.sql')).sort()) {
    for (const statement of splitSqlStatements(
      readFileSync(join(MIGRATIONS_DIRECTORY, file), 'utf8'),
    )) {
      database.exec(statement)
    }
  }

  // Sem deslocamento: as datas ficam iguais às do design, então os números são comparáveis.
  for (const seed of buildSeedData(createDateShifter(DESIGN_TODAY))) {
    const placeholders = seed.columns.map(() => '?').join(', ')
    const statement = database.prepare(
      `INSERT INTO ${seed.table} (${seed.columns.join(', ')}) VALUES (${placeholders})`,
    )

    for (const row of seed.rows) {
      statement.run(...(row as never[]))
    }
  }
})

describe('Migração do gateway', () => {
  it('Should total the 320h that the design shows', () => {
    expect(calculateTotalEffort(readTasks('gateway'))).toBe(320)
  })

  it('Should total 240h in the first baseline, matching the scope change event', () => {
    const firstBaselineHours = readBaselineTasks('bl-gw-1').reduce(
      (total, baselineTask) => total + (baselineTask.estimatedHours ?? 0),
      0,
    )

    expect(firstBaselineHours).toBe(240)
  })

  it('Should be eleven days late against the current baseline', () => {
    const current = deriveProjectPeriod(readTasks('gateway'))
    const baseline = deriveBaselinePeriod(readBaselineTasks('bl-gw-2'))
    const deviation = calculateDeviationInDays(current?.end ?? null, baseline?.end ?? null)

    expect(deviation).toBe(11)
    expect(isDelayed(deviation)).toBe(true)
  })

  it('Should count the eight days between the block and its unblock', () => {
    const blockedDays = calculateBlockedDays(readEvents('gateway'), {
      start: '2026-01-01',
      end: DESIGN_TODAY,
    })

    expect(blockedDays).toBe(8)
  })

  it('Should list the two people with an open allocation', () => {
    expect(listActivePersonIds(readAllocations('gateway')).toSorted()).toEqual(['ana', 'rafael'])
  })

  it('Should report progress weighted by the completed hours', () => {
    const progress = calculateProgress(readTasks('gateway'))

    expect(progress.totalHours).toBe(320)
    expect(progress.completedHours).toBe(40)
  })
})

describe('Portal do parceiro', () => {
  it('Should total the 168h that the design shows', () => {
    expect(calculateTotalEffort(readTasks('parceiro'))).toBe(168)
  })

  it('Should be twenty three days late', () => {
    const current = deriveProjectPeriod(readTasks('parceiro'))
    const baseline = deriveBaselinePeriod(readBaselineTasks('bl-pp-1'))

    expect(calculateDeviationInDays(current?.end ?? null, baseline?.end ?? null)).toBe(23)
  })

  it('Should have been blocked for twenty three days with no unblock yet', () => {
    const blockedDays = calculateBlockedDays(readEvents('parceiro'), {
      start: '2026-01-01',
      end: DESIGN_TODAY,
    })

    expect(blockedDays).toBe(23)
  })

  it('Should have no open allocation, keeping the closed ones in history', () => {
    const allocations = readAllocations('parceiro')

    expect(listActivePersonIds(allocations)).toEqual([])
    expect(allocations).toHaveLength(2)
    expect(allocations.every((allocation) => allocation.endedReason === 'projeto bloqueado')).toBe(
      true,
    )
  })
})

describe('App de campo v2', () => {
  it('Should be two days ahead of its baseline', () => {
    const current = deriveProjectPeriod(readTasks('campo'))
    const baseline = deriveBaselinePeriod(readBaselineTasks('bl-ac-1'))
    const deviation = calculateDeviationInDays(current?.end ?? null, baseline?.end ?? null)

    expect(deviation).toBe(-2)
    expect(isDelayed(deviation)).toBe(false)
  })
})

describe('Conflito de alocação do Rafael', () => {
  it('Should put Rafael at 150 percent on the week the design flags', () => {
    const capacity = calculateWeeklyCapacity(readPerson('rafael'), readAllocations(), {
      start: '2026-06-01',
      end: '2026-06-07',
    })

    expect(capacity.percentage).toBe(150)
    expect(capacity.hours).toBe(60)
    expect(isOverallocated(capacity)).toBe(true)
  })

  it('Should be back inside capacity after the reallocation', () => {
    const capacity = calculateWeeklyCapacity(readPerson('rafael'), readAllocations(), {
      start: '2026-08-31',
      end: '2026-09-06',
    })

    expect(isOverallocated(capacity)).toBe(false)
  })
})

describe('Janela de cutover', () => {
  it('Should start today with nobody allocated', () => {
    const cutover = readTasks('observabilidade').find((task) => task.id === 'ob-cut')
    const allocations = readAllocations().filter((allocation) => allocation.taskId === 'ob-cut')

    expect(cutover?.plannedStart).toBe(DESIGN_TODAY)
    expect(allocations).toEqual([])
  })
})
