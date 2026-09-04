import { beforeEach, describe, expect, it } from 'vitest'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteNavigationCountsRepository } from './SqliteNavigationCountsRepository'

let gateway: SqlGateway
let repository: SqliteNavigationCountsRepository

async function insertProject(id: string, archivedAt: string | null): Promise<void> {
  await gateway.executeBatch([
    {
      query:
        'INSERT INTO project (id, name, status, priority, created_at, archived_at) VALUES (?, ?, ?, ?, ?, ?)',
      values: [id, id, 'active', 'P1', '2026-03-01T12:00:00Z', archivedAt],
    },
  ])
}

async function insertTodo(id: string, status: string): Promise<void> {
  await gateway.executeBatch([
    {
      query: 'INSERT INTO todo (id, title, priority, status) VALUES (?, ?, ?, ?)',
      values: [id, id, 'P2', status],
    },
  ])
}

beforeEach(() => {
  gateway = createInMemoryGateway()
  repository = new SqliteNavigationCountsRepository(gateway)
})

describe('SqliteNavigationCountsRepository', () => {
  it('Should report zero on an empty database', async () => {
    expect(await repository.read()).toEqual({ projects: 0, todos: 0 })
  })

  it('Should leave archived projects out of the count', async () => {
    await insertProject('vivo', null)
    await insertProject('arquivado', '2026-05-01T12:00:00Z')

    expect((await repository.read()).projects).toBe(1)
  })

  it('Should count only the open todos', async () => {
    await insertTodo('aberto', 'open')
    await insertTodo('feito', 'done')
    await insertTodo('cancelado', 'cancelled')

    expect((await repository.read()).todos).toBe(1)
  })
})
