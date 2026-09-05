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
