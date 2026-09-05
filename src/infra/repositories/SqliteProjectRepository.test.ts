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
