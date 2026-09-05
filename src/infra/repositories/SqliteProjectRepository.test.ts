import { beforeEach, describe, expect, it } from 'vitest'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteProjectRepository } from './SqliteProjectRepository'

const INSERT_PROJECT = `
  INSERT INTO project (id, name, description, status, priority, owner_person_id,
                       planned_start, planned_end, created_at, archived_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`

let gateway: SqlGateway
let repository: SqliteProjectRepository

async function seedProject(values: readonly unknown[]): Promise<void> {
  await gateway.executeBatch([{ query: INSERT_PROJECT, values }])
}

beforeEach(() => {
  gateway = createInMemoryGateway()
  repository = new SqliteProjectRepository(gateway)
})

describe('SqliteProjectRepository', () => {
  it('Should return an empty list when no project was created yet', async () => {
    expect(await repository.listAll()).toEqual([])
  })

  it('Should map every column to its camel case field', async () => {
    await seedProject([
      'gateway',
      'Migração do gateway',
      'Troca do gateway de pagamentos.',
      'active',
      'P1',
      null,
      '2026-03-12',
      '2026-09-29',
      '2026-02-20T09:00:00Z',
      null,
    ])

    expect(await repository.listAll()).toEqual([
      {
        id: 'gateway',
        name: 'Migração do gateway',
        description: 'Troca do gateway de pagamentos.',
        status: 'active',
        priority: 'P1',
        ownerPersonId: null,
        plannedStart: '2026-03-12',
        plannedEnd: '2026-09-29',
        createdAt: '2026-02-20T09:00:00Z',
        archivedAt: null,
      },
    ])
  })

  it('Should order the projects by name', async () => {
    await seedProject(['b', 'Portal do parceiro', null, 'blocked', 'P0', null, null, null, '2026-01-15T09:00:00Z', null])
    await seedProject(['a', 'App de campo v2', null, 'paused', 'P2', null, null, null, '2026-06-01T09:00:00Z', null])

    expect((await repository.listAll()).map((project) => project.name)).toEqual([
      'App de campo v2',
      'Portal do parceiro',
    ])
  })

  it('Should refuse a row whose timestamp is not a valid instant', async () => {
    await seedProject([
      'torto',
      'Projeto torto',
      null,
      'active',
      'P1',
      null,
      null,
      null,
      '20/02/2026',
      null,
    ])

    await expect(repository.listAll()).rejects.toMatchObject({ code: 'INVALID_RECORD_SHAPE' })
  })

  it('Should refuse a row whose planned end precedes its planned start', async () => {
    await seedProject([
      'torto',
      'Projeto torto',
      null,
      'active',
      'P1',
      null,
      '2026-09-29',
      '2026-03-12',
      '2026-02-20T09:00:00Z',
      null,
    ])

    await expect(repository.listAll()).rejects.toMatchObject({ code: 'INVALID_RECORD_SHAPE' })
  })
})

describe('SqliteProjectRepository.create', () => {
  const newProject = {
    project: {
      id: 'portal',
      name: 'Portal do cliente',
      description: 'Autoatendimento.',
      status: 'discovery' as const,
      priority: 'P2' as const,
      ownerPersonId: null,
      plannedStart: '2026-09-14',
      plannedEnd: '2026-12-18',
      createdAt: '2026-09-05T12:00:00Z',
      archivedAt: null,
    },
    baseline: {
      id: 'bl-portal',
      projectId: 'portal',
      version: 1,
      createdAt: '2026-09-05T12:00:00Z',
      reason: 'plano inicial',
    },
    tagNames: ['financeiro', 'web'],
  }

  const tags = [
    { id: 'tag-financeiro', name: 'financeiro' },
    { id: 'tag-web', name: 'web' },
  ]

  it('Should store the project the draft describes', async () => {
    await repository.create(newProject, tags)

    expect(await repository.listAll()).toEqual([newProject.project])
  })

  it('Should create the first baseline in the same write', async () => {
    await repository.create(newProject, tags)

    const baselines = await gateway.select<{ id: string; version: number; reason: string }[]>(
      'SELECT id, version, reason FROM baseline WHERE project_id = ?',
      ['portal'],
    )

    expect(baselines).toEqual([{ id: 'bl-portal', version: 1, reason: 'plano inicial' }])
  })

  it('Should leave the first baseline with no frozen task, because there is none yet', async () => {
    await repository.create(newProject, tags)

    expect(await gateway.select<unknown[]>('SELECT * FROM baseline_task')).toEqual([])
  })

  it('Should create the tags it does not know yet and link them', async () => {
    await repository.create(newProject, tags)

    const linked = await gateway.select<{ name: string }[]>(
      'SELECT tag.name FROM project_tag JOIN tag ON tag.id = project_tag.tag_id ORDER BY tag.name',
    )

    expect(linked).toEqual([{ name: 'financeiro' }, { name: 'web' }])
  })

  it('Should reuse a tag that already exists instead of duplicating it', async () => {
    await gateway.executeBatch([
      { query: 'INSERT INTO tag (id, name) VALUES (?, ?)', values: ['infra', 'web'] },
    ])

    await repository.create(newProject, tags)

    const stored = await gateway.select<{ id: string }[]>('SELECT id FROM tag WHERE name = ?', [
      'web',
    ])

    expect(stored).toEqual([{ id: 'infra' }])
  })

  it('Should write nothing at all when one statement of the batch fails', async () => {
    await repository.create(newProject, tags)

    await expect(repository.create(newProject, tags)).rejects.toThrow()

    expect(
      await gateway.select<{ total: number }[]>('SELECT count(*) AS total FROM baseline'),
    ).toEqual([{ total: 1 }])
  })
})

describe('SqliteProjectRepository.setPriority', () => {
  it('Should reprioritize every project it receives at once', async () => {
    await seedProject(['a', 'A', null, 'active', 'P3', null, null, null, '2026-02-20T09:00:00Z', null])
    await seedProject(['b', 'B', null, 'active', 'P3', null, null, null, '2026-02-20T09:00:00Z', null])
    await seedProject(['c', 'C', null, 'active', 'P3', null, null, null, '2026-02-20T09:00:00Z', null])

    await repository.setPriority(['a', 'c'], 'P0')

    expect((await repository.listAll()).map((project) => [project.id, project.priority])).toEqual([
      ['a', 'P0'],
      ['b', 'P3'],
      ['c', 'P0'],
    ])
  })
})

describe('SqliteProjectRepository.blockMany', () => {
  const block = {
    projectId: 'parceiro',
    endedAt: '2026-09-05T12:00:00Z',
    endedAllocationIds: ['al-1'],
    event: {
      id: 'ev-block',
      projectId: 'parceiro',
      type: 'block' as const,
      eventDate: '2026-09-05',
      title: 'Aguardando validação jurídica',
      bodyMarkdown: '1 alocação encerrada no bloqueio.',
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: '2026-09-26',
      createdAt: '2026-09-05T12:00:00Z',
    },
  }

  beforeEach(async () => {
    await seedProject([
      'parceiro',
      'Portal do parceiro',
      null,
      'active',
      'P0',
      null,
      null,
      null,
      '2026-01-15T09:00:00Z',
      null,
    ])

    await gateway.executeBatch([
      {
        query: 'INSERT INTO person (id, name, initials) VALUES (?, ?, ?)',
        values: ['ana', 'Ana Nogueira', 'AN'],
      },
      {
        query: 'INSERT INTO task (id, project_id, phase_id, title, status) VALUES (?, ?, ?, ?, ?)',
        values: ['pp-jur', 'parceiro', 'development', 'Aprovação jurídica', 'blocked'],
      },
      {
        query:
          'INSERT INTO allocation (id, task_id, person_id, start_date, end_date, percentage) VALUES (?, ?, ?, ?, ?, ?)',
        values: ['al-1', 'pp-jur', 'ana', '2026-02-02', '2026-08-11', 50],
      },
    ])
  })

  it('Should move the project to blocked', async () => {
    await repository.blockMany([block])

    expect((await repository.listAll())[0]?.status).toBe('blocked')
  })

  it('Should record the block event with its reason and expected resume date', async () => {
    await repository.blockMany([block])

    expect(
      await gateway.select<{ type: string; title: string; expected_resume_at: string }[]>(
        'SELECT type, title, expected_resume_at FROM project_event',
      ),
    ).toEqual([
      {
        type: 'block',
        title: 'Aguardando validação jurídica',
        expected_resume_at: '2026-09-26',
      },
    ])
  })

  it('Should end the open allocation instead of deleting it', async () => {
    await repository.blockMany([block])

    expect(
      await gateway.select<{ id: string; ended_at: string; ended_reason: string }[]>(
        'SELECT id, ended_at, ended_reason FROM allocation',
      ),
    ).toEqual([
      { id: 'al-1', ended_at: '2026-09-05T12:00:00Z', ended_reason: 'projeto bloqueado' },
    ])
  })

  it('Should leave the project untouched when the event cannot be written', async () => {
    const broken = { ...block, event: { ...block.event, projectId: 'inexistente' } }

    await expect(repository.blockMany([broken])).rejects.toThrow()

    expect((await repository.listAll())[0]?.status).toBe('active')
    expect(await gateway.select<unknown[]>('SELECT * FROM project_event')).toEqual([])
  })
})
