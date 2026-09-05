import { beforeEach, describe, expect, it } from 'vitest'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteBaselineRepository } from './SqliteBaselineRepository'

let gateway: SqlGateway
let repository: SqliteBaselineRepository

async function seedProjectWithTask(): Promise<void> {
  await gateway.executeBatch([
    {
      query: 'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
      values: ['gateway', 'Migração do gateway', 'active', 'P1', '2026-02-20T09:00:00Z'],
    },
    {
      query: 'INSERT INTO task (id, project_id, phase_id, title, status) VALUES (?, ?, ?, ?, ?)',
      values: ['gw-prov', 'gateway', 'development', 'Provisionar ambiente', 'done'],
    },
  ])
}

async function seedBaseline(id: string, version: number, reason: string): Promise<void> {
  await gateway.executeBatch([
    {
      query: 'INSERT INTO baseline (id, project_id, version, created_at, reason) VALUES (?, ?, ?, ?, ?)',
      values: [id, 'gateway', version, '2026-02-20T09:00:00Z', reason],
    },
  ])
}

beforeEach(async () => {
  gateway = createInMemoryGateway()
  repository = new SqliteBaselineRepository(gateway)
  await seedProjectWithTask()
})

describe('SqliteBaselineRepository', () => {
  it('Should list the baselines of a project ordered by version', async () => {
    await seedBaseline('bl-gw-2', 2, 'mudança de escopo')
    await seedBaseline('bl-gw-1', 1, 'plano inicial')

    expect((await repository.listAll()).map((baseline) => baseline.version)).toEqual([1, 2])
  })

  it('Should map the frozen period of a baseline task', async () => {
    await seedBaseline('bl-gw-1', 1, 'plano inicial')
    await gateway.executeBatch([
      {
        query:
          'INSERT INTO baseline_task (baseline_id, task_id, planned_start, planned_end, estimated_hours) VALUES (?, ?, ?, ?, ?)',
        values: ['bl-gw-1', 'gw-prov', '2026-03-12', '2026-03-27', 40],
      },
    ])

    expect(await repository.listTasks()).toEqual([
      {
        baselineId: 'bl-gw-1',
        taskId: 'gw-prov',
        plannedStart: '2026-03-12',
        plannedEnd: '2026-03-27',
        estimatedHours: 40,
      },
    ])
  })

  it('Should accept a baseline task with no planned period', async () => {
    await seedBaseline('bl-gw-1', 1, 'plano inicial')
    await gateway.executeBatch([
      {
        query:
          'INSERT INTO baseline_task (baseline_id, task_id, planned_start, planned_end, estimated_hours) VALUES (?, ?, ?, ?, ?)',
        values: ['bl-gw-1', 'gw-prov', null, null, 120],
      },
    ])

    expect((await repository.listTasks())[0]?.plannedStart).toBeNull()
  })
})
