import { beforeEach, describe, expect, it } from 'vitest'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteNoteRepository } from './SqliteNoteRepository'

const INSERT_NOTE = `
  INSERT INTO note (path, project_id, project_event_id, updated_at)
  VALUES (?, ?, ?, ?)
`

let gateway: SqlGateway
let repository: SqliteNoteRepository

beforeEach(async () => {
  gateway = createInMemoryGateway()
  repository = new SqliteNoteRepository(gateway)
  await gateway.executeBatch([
    {
      query: 'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
      values: ['gateway', 'Migração do gateway', 'active', 'P1', '2026-02-20T09:00:00Z'],
    },
  ])
})

describe('SqliteNoteRepository', () => {
  it('Should keep the project a note is linked to', async () => {
    await gateway.executeBatch([
      {
        query: INSERT_NOTE,
        values: ['notas/migracao-do-gateway.md', 'gateway', null, '2026-09-03T09:12:00Z'],
      },
    ])

    expect((await repository.listAll())[0]).toEqual({
      path: 'notas/migracao-do-gateway.md',
      projectId: 'gateway',
      projectEventId: null,
      updatedAt: '2026-09-03T09:12:00Z',
    })
  })

  it('Should order the notes by the most recently changed', async () => {
    await gateway.executeBatch([
      { query: INSERT_NOTE, values: ['notas/antiga.md', null, null, '2026-08-16T11:00:00Z'] },
      { query: INSERT_NOTE, values: ['notas/recente.md', null, null, '2026-09-03T09:12:00Z'] },
    ])

    expect((await repository.listAll()).map((note) => note.path)).toEqual([
      'notas/recente.md',
      'notas/antiga.md',
    ])
  })
})
