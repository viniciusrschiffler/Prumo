import { beforeEach, describe, expect, it } from 'vitest'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteProjectEventRepository } from './SqliteProjectEventRepository'

const INSERT_EVENT = `
  INSERT INTO project_event (id, project_id, type, event_date, title, body_md,
                             reverts_event_id, risk_open, expected_resume_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`

let gateway: SqlGateway
let repository: SqliteProjectEventRepository

async function seedEvent(values: readonly unknown[]): Promise<void> {
  await gateway.executeBatch([{ query: INSERT_EVENT, values }])
}

beforeEach(async () => {
  gateway = createInMemoryGateway()
  repository = new SqliteProjectEventRepository(gateway)
  await gateway.executeBatch([
    {
      query: 'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
      values: ['gateway', 'Migração do gateway', 'active', 'P1', '2026-02-20T09:00:00Z'],
    },
  ])
})

describe('SqliteProjectEventRepository', () => {
  it('Should read the open risk flag as a boolean', async () => {
    await seedEvent([
      'ev-risk',
      'gateway',
      'risk',
      '2026-08-21',
      'Homologação externa depende de terceiro',
      null,
      null,
      1,
      null,
      '2026-08-21T17:05:00Z',
    ])

    expect((await repository.listAll())[0]?.riskOpen).toBe(true)
  })

  it('Should keep the expected resume date of a block', async () => {
    await seedEvent([
      'ev-block',
      'gateway',
      'block',
      '2026-07-22',
      'Sem ambiente de homologação',
      'Infra sem capacidade até 30/07.',
      null,
      0,
      '2026-07-30',
      '2026-07-22T16:40:00Z',
    ])

    expect((await repository.listAll())[0]).toMatchObject({
      type: 'block',
      expectedResumeAt: '2026-07-30',
      riskOpen: false,
    })
  })

  it('Should order the events by date', async () => {
    await seedEvent(['ev-b', 'gateway', 'note', '2026-09-03', 'Depois', null, null, 0, null, '2026-09-03T09:12:00Z'])
    await seedEvent(['ev-a', 'gateway', 'note', '2026-08-16', 'Antes', null, null, 0, null, '2026-08-16T11:00:00Z'])

    expect((await repository.listAll()).map((event) => event.id)).toEqual(['ev-a', 'ev-b'])
  })

  it('Should keep the link to the event a decision reverts', async () => {
    await seedEvent(['ev-dec1', 'gateway', 'decision', '2026-07-14', 'Trocar de provedor', null, null, 0, null, '2026-07-14T15:30:00Z'])
    await seedEvent(['ev-dec2', 'gateway', 'decision', '2026-08-05', 'Manter o provedor', null, 'ev-dec1', 0, null, '2026-08-05T14:00:00Z'])

    const reverting = (await repository.listAll()).find((event) => event.id === 'ev-dec2')

    expect(reverting?.revertsEventId).toBe('ev-dec1')
  })
})

describe('Gravação de evento', () => {
  it('Should write a registered risk with its open flag', async () => {
    await repository.create({
      id: 'ev-novo',
      projectId: 'gateway',
      type: 'risk',
      eventDate: '2026-09-05',
      title: 'Fornecedor sem resposta',
      bodyMarkdown: 'Sem retorno desde 20/08.',
      revertsEventId: null,
      riskOpen: true,
      expectedResumeAt: null,
      createdAt: '2026-09-05T10:00:00Z',
    })

    expect((await repository.listAll())[0]).toMatchObject({
      id: 'ev-novo',
      type: 'risk',
      riskOpen: true,
      bodyMarkdown: 'Sem retorno desde 20/08.',
    })
  })

  it('Should list the tasks a event touches', async () => {
    await seedEvent([
      'ev-realloc',
      'gateway',
      'reallocation',
      '2026-08-28',
      'Rafael Brito 100% → 50%',
      null,
      null,
      0,
      null,
      '2026-08-28T11:20:00Z',
    ])
    await gateway.executeBatch([
      {
        query: `
          INSERT INTO task (id, project_id, phase_id, title, status, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        values: ['gw-rew', 'gateway', 'development', 'Rewrite do roteador', 'in_progress', 2],
      },
      {
        query: 'INSERT INTO project_event_task (project_event_id, task_id) VALUES (?, ?)',
        values: ['ev-realloc', 'gw-rew'],
      },
    ])

    expect(await repository.listEventTasks()).toEqual([
      { projectEventId: 'ev-realloc', taskId: 'gw-rew' },
    ])
  })
})
