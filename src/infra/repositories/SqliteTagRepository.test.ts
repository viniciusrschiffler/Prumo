import { beforeEach, describe, expect, it } from 'vitest'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteTagRepository } from './SqliteTagRepository'

let gateway: SqlGateway
let repository: SqliteTagRepository

async function seedProjectWithTags(projectId: string, tagIds: readonly string[]): Promise<void> {
  await gateway.executeBatch([
    {
      query: 'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
      values: [projectId, projectId, 'active', 'P1', '2026-02-20T09:00:00Z'],
    },
    ...tagIds.map((tagId) => ({
      query: 'INSERT INTO project_tag (project_id, tag_id) VALUES (?, ?)',
      values: [projectId, tagId],
    })),
  ])
}

async function seedTags(names: readonly string[]): Promise<void> {
  await gateway.executeBatch(
    names.map((name) => ({ query: 'INSERT INTO tag (id, name) VALUES (?, ?)', values: [name, name] })),
  )
}

beforeEach(() => {
  gateway = createInMemoryGateway()
  repository = new SqliteTagRepository(gateway)
})

describe('SqliteTagRepository', () => {
  it('Should list the tags in alphabetical order', async () => {
    await seedTags(['pagamentos', 'infra', 'mobile'])

    expect((await repository.listAll()).map((tag) => tag.name)).toEqual([
      'infra',
      'mobile',
      'pagamentos',
    ])
  })

  it('Should list the pairs that link a project to its tags', async () => {
    await seedTags(['pagamentos', 'infra'])
    await seedProjectWithTags('gateway', ['pagamentos', 'infra'])

    expect(await repository.listProjectTags()).toEqual([
      { projectId: 'gateway', tagId: 'infra' },
      { projectId: 'gateway', tagId: 'pagamentos' },
    ])
  })

  it('Should drop the pairs of a removed project', async () => {
    await seedTags(['infra'])
    await seedProjectWithTags('gateway', ['infra'])

    await gateway.executeBatch([{ query: 'DELETE FROM project WHERE id = ?', values: ['gateway'] }])

    expect(await repository.listProjectTags()).toEqual([])
    expect(await repository.listAll()).toHaveLength(1)
  })
})
