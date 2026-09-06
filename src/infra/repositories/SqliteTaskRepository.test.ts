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

describe('Gravação de tarefa', () => {
  it('Should write the task and its allocations in one batch', async () => {
    await taskRepository.create({
      task: {
        id: 'gw-conc',
        projectId: 'gateway',
        phaseId: 'production',
        title: 'Conciliação automática',
        status: 'todo',
        plannedStart: '2026-09-07',
        plannedEnd: '2026-10-09',
        actualStart: null,
        actualEnd: null,
        estimatedHours: 80,
        sortOrder: 5,
      },
      allocations: [
        {
          id: 'al-conc-1',
          taskId: 'gw-conc',
          personId: 'ana',
          startDate: '2026-09-07',
          endDate: '2026-10-09',
          percentage: 50,
          endedAt: null,
          endedReason: null,
        },
      ],
    })

    const written = (await taskRepository.listAll()).find((task) => task.id === 'gw-conc')
    const allocations = await gateway.select<{ id: string }[]>(
      'SELECT id FROM allocation WHERE task_id = ?',
      ['gw-conc'],
    )

    expect(written).toMatchObject({ title: 'Conciliação automática', estimatedHours: 80 })
    expect(allocations).toEqual([{ id: 'al-conc-1' }])
  })

  it('Should leave no task behind when an allocation of the batch is refused', async () => {
    const write = taskRepository.create({
      task: {
        id: 'gw-orfa',
        projectId: 'gateway',
        phaseId: 'production',
        title: 'Tarefa sem dono válido',
        status: 'todo',
        plannedStart: '2026-09-07',
        plannedEnd: '2026-10-09',
        actualStart: null,
        actualEnd: null,
        estimatedHours: 8,
        sortOrder: 6,
      },
      allocations: [
        {
          id: 'al-orfa',
          taskId: 'gw-orfa',
          personId: 'pessoa-inexistente',
          startDate: '2026-09-07',
          endDate: '2026-10-09',
          percentage: 50,
          endedAt: null,
          endedReason: null,
        },
      ],
    })

    await expect(write).rejects.toThrow()
    expect((await taskRepository.listAll()).some((task) => task.id === 'gw-orfa')).toBe(false)
  })
})

describe('Dependência entre tarefas', () => {
  it('Should list which task depends on which', async () => {
    await insertTask('gw-rew', 'development', 'in_progress')
    await insertTask('gw-tes', 'internal_homologation', 'todo')
    await gateway.executeBatch([
      {
        query: 'INSERT INTO task_dependency (task_id, depends_on_task_id) VALUES (?, ?)',
        values: ['gw-tes', 'gw-rew'],
      },
    ])

    expect(await taskRepository.listDependencies()).toEqual([
      { taskId: 'gw-tes', dependsOnTaskId: 'gw-rew' },
    ])
  })
})

describe('Replanejamento pela Timeline', () => {
  const reschedule = {
    taskId: 'gw-cut',
    period: { start: '2026-09-08', end: '2026-10-06' },
    event: {
      id: 'ev-replan',
      projectId: 'gateway',
      type: 'replan' as const,
      eventDate: '2026-09-06',
      title: 'Cutover em produção',
      bodyMarkdown: 'Início 01/09 → 08/09 · Fim 29/09 → 06/10',
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: null,
      createdAt: '2026-09-06T12:00:00Z',
    },
  }

  beforeEach(async () => {
    await insertTask('gw-cut', 'production', 'todo')
  })

  it('Should move only the plan, never the dates that already happened', async () => {
    await taskRepository.reschedule(reschedule)

    const task = (await taskRepository.listAll()).find((one) => one.id === 'gw-cut')

    expect([task?.plannedStart, task?.plannedEnd]).toEqual(['2026-09-08', '2026-10-06'])
    expect([task?.actualStart, task?.actualEnd]).toEqual([null, null])
  })

  it('Should record the replan event linked to the task, in the same write', async () => {
    await taskRepository.reschedule(reschedule)

    expect(
      await gateway.select<{ type: string; body_md: string }[]>(
        'SELECT type, body_md FROM project_event WHERE id = ?',
        ['ev-replan'],
      ),
    ).toEqual([{ type: 'replan', body_md: 'Início 01/09 → 08/09 · Fim 29/09 → 06/10' }])

    expect(
      await gateway.select<unknown[]>('SELECT task_id FROM project_event_task WHERE project_event_id = ?', [
        'ev-replan',
      ]),
    ).toEqual([{ task_id: 'gw-cut' }])
  })

  it('Should leave the plan untouched when the event cannot be written', async () => {
    await taskRepository.reschedule(reschedule)

    await expect(
      taskRepository.reschedule({
        ...reschedule,
        period: { start: '2026-11-02', end: '2026-11-30' },
      }),
    ).rejects.toThrow()

    const task = (await taskRepository.listAll()).find((one) => one.id === 'gw-cut')

    expect([task?.plannedStart, task?.plannedEnd]).toEqual(['2026-09-08', '2026-10-06'])
  })
})
