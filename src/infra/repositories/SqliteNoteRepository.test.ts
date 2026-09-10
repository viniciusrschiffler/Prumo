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

describe('SqliteNoteRepository.saveContent', () => {
  it('Should create the row and index the content on the first save', async () => {
    await repository.saveContent({
      path: 'notas/nova.md',
      content: '# Nova\n\nconciliação automática',
      updatedAt: '2026-09-03T10:00:00Z',
    })

    expect((await repository.listAll())[0]).toEqual({
      path: 'notas/nova.md',
      projectId: null,
      projectEventId: null,
      updatedAt: '2026-09-03T10:00:00Z',
    })
    expect(await repository.searchPaths('"conciliação"')).toEqual(['notas/nova.md'])
  })

  // Gravar o texto não pode apagar o projeto que já estava ligado.
  it('Should keep the links a later save does not touch', async () => {
    await gateway.executeBatch([
      {
        query: INSERT_NOTE,
        values: ['notas/nova.md', 'gateway', null, '2026-09-03T09:00:00Z'],
      },
    ])

    await repository.saveContent({
      path: 'notas/nova.md',
      content: 'outro texto',
      updatedAt: '2026-09-03T10:00:00Z',
    })

    expect((await repository.listAll())[0]?.projectId).toBe('gateway')
  })

  it('Should not leave the previous text in the index', async () => {
    await repository.saveContent({
      path: 'notas/nova.md',
      content: 'jurídico',
      updatedAt: '2026-09-03T10:00:00Z',
    })
    await repository.saveContent({
      path: 'notas/nova.md',
      content: 'financeiro',
      updatedAt: '2026-09-03T11:00:00Z',
    })

    expect(await repository.searchPaths('"jurídico"')).toEqual([])
    expect(await repository.searchPaths('"financeiro"')).toEqual(['notas/nova.md'])
  })
})

describe('SqliteNoteRepository.setLinks', () => {
  it('Should link a file that had no row yet', async () => {
    await repository.setLinks({
      path: 'notas/solta.md',
      projectId: 'gateway',
      projectEventId: null,
      updatedAt: '2026-09-03T10:00:00Z',
    })

    expect((await repository.listAll())[0]?.projectId).toBe('gateway')
  })

  it('Should undo a link by writing null over it', async () => {
    await repository.setLinks({
      path: 'notas/solta.md',
      projectId: 'gateway',
      projectEventId: null,
      updatedAt: '2026-09-03T10:00:00Z',
    })
    await repository.setLinks({
      path: 'notas/solta.md',
      projectId: null,
      projectEventId: null,
      updatedAt: '2026-09-03T11:00:00Z',
    })

    expect((await repository.listAll())[0]?.projectId).toBeNull()
  })
})

describe('SqliteNoteRepository.removeAll', () => {
  it('Should take the note out of the table and out of the index', async () => {
    await repository.saveContent({
      path: 'notas/nova.md',
      content: 'conciliação',
      updatedAt: '2026-09-03T10:00:00Z',
    })

    await repository.removeAll(['notas/nova.md'])

    expect(await repository.listAll()).toEqual([])
    expect(await repository.searchPaths('"conciliação"')).toEqual([])
  })

  it('Should take every note of a deleted folder in one write', async () => {
    await repository.saveContent({
      path: 'notas/decisoes/provedor.md',
      content: 'conciliação',
      updatedAt: '2026-09-03T10:00:00Z',
    })
    await repository.saveContent({
      path: 'notas/decisoes/cutover.md',
      content: 'cutover',
      updatedAt: '2026-09-03T10:05:00Z',
    })
    await repository.saveContent({
      path: 'notas/solta.md',
      content: 'solta',
      updatedAt: '2026-09-03T10:10:00Z',
    })

    await repository.removeAll(['notas/decisoes/provedor.md', 'notas/decisoes/cutover.md'])

    expect((await repository.listAll()).map((note) => note.path)).toEqual(['notas/solta.md'])
    expect(await repository.searchPaths('"cutover"')).toEqual([])
  })

  it('Should write nothing when the deleted folder had no note', async () => {
    await expect(repository.removeAll([])).resolves.toBeUndefined()
  })
})
