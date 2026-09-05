import { beforeEach, describe, expect, it } from 'vitest'
import { countTasksByPhase } from '@/domain/derived/countTasksByPhase'
import { countActiveAllocationsByPerson } from '@/domain/derived/countActiveAllocationsByPerson'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteAllocationRepository } from './SqliteAllocationRepository'
import { SqliteTaskRepository } from './SqliteTaskRepository'

let gateway: SqlGateway
let taskRepository: SqliteTaskRepository
let allocationRepository: SqliteAllocationRepository

async function seedProject(): Promise<void> {
  await gateway.executeBatch([
    {
      query: 'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
      values: ['gateway', 'Migração do gateway', 'active', 'P1', '2026-02-20T09:00:00Z'],
    },
    {
      query:
        'INSERT INTO person (id, name, initials, role, weekly_capacity_hours, active) VALUES (?, ?, ?, ?, ?, ?)',
      values: ['ana', 'Ana Nogueira', 'AN', 'Desenvolvimento', 40, 1],
    },
  ])
}

async function insertTask(
  id: string,
  phaseId: string,
  status: string,
  estimatedHours: number | null = 40,
): Promise<void> {
  await gateway.executeBatch([
    {
      query: `
        INSERT INTO task (id, project_id, phase_id, title, status, planned_start, planned_end,
                          estimated_hours, sort_order)
        VALUES (?, 'gateway', ?, ?, ?, '2026-03-12', '2026-03-27', ?, 1)
      `,
      values: [id, phaseId, id, status, estimatedHours],
    },
  ])
}

beforeEach(async () => {
  gateway = createInMemoryGateway()
  taskRepository = new SqliteTaskRepository(gateway)
  allocationRepository = new SqliteAllocationRepository(gateway)
  await seedProject()
})

describe('SqliteTaskRepository', () => {
  it('Should return an empty list on a database with no task', async () => {
    expect(await taskRepository.listAll()).toEqual([])
  })

  it('Should read a task back with the domain field names', async () => {
    await insertTask('gw-prov', 'development', 'done')

    expect(await taskRepository.listAll()).toEqual([
      {
        id: 'gw-prov',
        projectId: 'gateway',
        phaseId: 'development',
        title: 'gw-prov',
        status: 'done',
        plannedStart: '2026-03-12',
        plannedEnd: '2026-03-27',
        actualStart: null,
        actualEnd: null,
        estimatedHours: 40,
        sortOrder: 1,
      },
    ])
  })

  it('Should round trip a null estimate', async () => {
    await insertTask('gw-prov', 'development', 'todo', null)

    expect((await taskRepository.listAll())[0]?.estimatedHours).toBeNull()
  })

  it('Should feed the count per phase used by the Fases table', async () => {
    await insertTask('gw-prov', 'development', 'done')
    await insertTask('gw-rew', 'development', 'cancelled')
    await insertTask('gw-cut', 'production', 'todo')

    const counts = countTasksByPhase(await taskRepository.listAll())

    expect(counts.get('development')).toBe(2)
    expect(counts.get('production')).toBe(1)
  })

  // O status já é barrado por CHECK no banco; o período invertido não é, e é o que sobra
  // para o schema do domínio pegar.
  it('Should reject a planned period that ends before it starts', async () => {
    await gateway.executeBatch([
      {
        query: `
          INSERT INTO task (id, project_id, phase_id, title, status, planned_start, planned_end,
                            sort_order)
          VALUES ('torta', 'gateway', 'development', 'Torta', 'todo', '2026-03-27', '2026-03-12', 1)
        `,
      },
    ])

    await expect(taskRepository.listAll()).rejects.toMatchObject({
      code: 'INVALID_RECORD_SHAPE',
    })
  })
})

describe('SqliteAllocationRepository', () => {
  async function insertAllocation(
    id: string,
    endedAt: string | null,
    endedReason: string | null,
  ): Promise<void> {
    await gateway.executeBatch([
      {
        query: `
          INSERT INTO allocation (id, task_id, person_id, start_date, end_date, percentage,
                                  ended_at, ended_reason)
          VALUES (?, 'gw-prov', 'ana', '2026-03-12', '2026-03-27', 50, ?, ?)
        `,
        values: [id, endedAt, endedReason],
      },
    ])
  }

  beforeEach(async () => {
    await insertTask('gw-prov', 'development', 'done')
  })

  it('Should return an empty list on a database with no allocation', async () => {
    expect(await allocationRepository.listAll()).toEqual([])
  })

  it('Should read an ended allocation without losing the reason', async () => {
    await insertAllocation('al-1', '2026-07-22T16:40:00Z', 'projeto bloqueado')

    expect((await allocationRepository.listAll())[0]).toMatchObject({
      endedAt: '2026-07-22T16:40:00Z',
      endedReason: 'projeto bloqueado',
    })
  })

  it('Should feed the active count that the Pessoas table shows', async () => {
    await insertAllocation('al-1', null, null)
    await insertAllocation('al-2', null, null)
    await insertAllocation('al-3', '2026-07-22T16:40:00Z', 'projeto bloqueado')

    expect(countActiveAllocationsByPerson(await allocationRepository.listAll()).get('ana')).toBe(2)
  })
})
