import { beforeEach, describe, expect, it } from 'vitest'
import type { Reallocation } from '@/domain/capacity/reallocationWrite'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteAllocationRepository } from './SqliteAllocationRepository'

const NOW = '2026-09-03T12:00:00Z'

let gateway: SqlGateway
let repository: SqliteAllocationRepository

async function seedProject(): Promise<void> {
  await gateway.executeBatch([
    {
      query: 'INSERT INTO person (id, name, initials, weekly_capacity_hours, active) VALUES (?, ?, ?, ?, ?)',
      values: ['rafael', 'Rafael Brito', 'RB', 40, 1],
    },
    {
      query: 'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
      values: ['observabilidade', 'Observabilidade', 'active', 'P2', '2026-05-10T09:00:00Z'],
    },
    {
      query:
        'INSERT INTO task (id, project_id, phase_id, title, status, planned_start, planned_end, estimated_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      values: [
        'ob-inst',
        'observabilidade',
        'development',
        'Instrumentar serviços críticos',
        'in_progress',
        '2026-08-31',
        '2026-10-30',
        80,
      ],
    },
    {
      query:
        'INSERT INTO allocation (id, task_id, person_id, start_date, end_date, percentage) VALUES (?, ?, ?, ?, ?, ?)',
      values: ['al-ob-1', 'ob-inst', 'rafael', '2026-08-31', '2026-10-30', 100],
    },
  ])
}

function buildReallocationPayload(overrides: Partial<Reallocation> = {}): Reallocation {
  return {
    endedAllocationId: 'al-ob-1',
    endedAt: NOW,
    endedReason: 'realocação aplicada no simulador de impacto',
    resumedAllocation: {
      id: 'al-ob-2',
      taskId: 'ob-inst',
      personId: 'rafael',
      startDate: '2026-09-24',
      endDate: '2026-11-20',
      percentage: 100,
      endedAt: null,
      endedReason: null,
    },
    taskId: 'ob-inst',
    taskPeriod: { start: '2026-08-31', end: '2026-11-20' },
    event: {
      id: 'ev-realloc',
      projectId: 'observabilidade',
      type: 'reallocation',
      eventDate: '2026-09-03',
      title: 'Rafael Brito sai de Instrumentar serviços críticos',
      bodyMarkdown: 'Sai por 3 semanas.',
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: '2026-09-24',
      createdAt: NOW,
    },
    baseline: {
      id: 'bl-ob-2',
      projectId: 'observabilidade',
      version: 2,
      createdAt: NOW,
      reason: 'realocação',
    },
    baselineTasks: [
      {
        baselineId: 'bl-ob-2',
        taskId: 'ob-inst',
        plannedStart: '2026-08-31',
        plannedEnd: '2026-11-20',
        estimatedHours: 80,
      },
    ],
    ...overrides,
  }
}

beforeEach(async () => {
  gateway = createInMemoryGateway()
  repository = new SqliteAllocationRepository(gateway)
  await seedProject()
})

describe('SqliteAllocationRepository', () => {
  it('Should end the old allocation without deleting it and open the new one', async () => {
    await repository.applyReallocation(buildReallocationPayload())

    const allocations = await repository.listAll()

    expect(allocations).toHaveLength(2)
    expect(allocations.find((allocation) => allocation.id === 'al-ob-1')).toMatchObject({
      endedAt: NOW,
      endedReason: 'realocação aplicada no simulador de impacto',
    })
    expect(allocations.find((allocation) => allocation.id === 'al-ob-2')?.endedAt).toBeNull()
  })

  it('Should move the planned end of the task in the same batch', async () => {
    await repository.applyReallocation(buildReallocationPayload())

    const rows = await gateway.select<{ planned_end: string }[]>(
      'SELECT planned_end FROM task WHERE id = ?',
      ['ob-inst'],
    )

    expect(rows[0]?.planned_end).toBe('2026-11-20')
  })

  it('Should register the reallocation event linked to the task', async () => {
    await repository.applyReallocation(buildReallocationPayload())

    const events = await gateway.select<{ type: string; expected_resume_at: string }[]>(
      'SELECT type, expected_resume_at FROM project_event WHERE id = ?',
      ['ev-realloc'],
    )
    const links = await gateway.select<{ task_id: string }[]>(
      'SELECT task_id FROM project_event_task WHERE project_event_id = ?',
      ['ev-realloc'],
    )

    expect(events[0]).toMatchObject({ type: 'reallocation', expected_resume_at: '2026-09-24' })
    expect(links.map((link) => link.task_id)).toEqual(['ob-inst'])
  })

  it('Should freeze the new baseline with the shifted dates', async () => {
    await repository.applyReallocation(buildReallocationPayload())

    const baselineTasks = await gateway.select<{ planned_end: string }[]>(
      'SELECT planned_end FROM baseline_task WHERE baseline_id = ?',
      ['bl-ob-2'],
    )

    expect(baselineTasks[0]?.planned_end).toBe('2026-11-20')
  })

  it('Should write nothing at all when one statement of the batch fails', async () => {
    const invalid = buildReallocationPayload({
      baseline: {
        id: 'bl-ob-2',
        projectId: 'nao-existe',
        version: 2,
        createdAt: NOW,
        reason: 'realocação',
      },
    })

    await expect(repository.applyReallocation(invalid)).rejects.toThrow()

    const allocations = await repository.listAll()

    expect(allocations).toHaveLength(1)
    expect(allocations[0]?.endedAt).toBeNull()
  })

  it('Should skip the new allocation when the absence outlasts the task', async () => {
    await repository.applyReallocation(buildReallocationPayload({ resumedAllocation: null }))

    expect(await repository.listAll()).toHaveLength(1)
  })
})
