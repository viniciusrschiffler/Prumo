import { z } from 'zod'
import type {
  NoteContent,
  NoteLink,
  NoteRepository,
} from '@/domain/repositories/NoteRepository'
import { noteSchema, type Note } from '@/domain/schemas/noteSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { BatchStatement, SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT path, project_id, project_event_id, updated_at
  FROM note
  ORDER BY updated_at DESC
`

const UPSERT_TIMESTAMP = `
  INSERT INTO note (path, project_id, project_event_id, updated_at)
  VALUES (?, NULL, NULL, ?)
  ON CONFLICT (path) DO UPDATE SET updated_at = excluded.updated_at
`

const UPSERT_LINKS = `
  INSERT INTO note (path, project_id, project_event_id, updated_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT (path) DO UPDATE SET
    project_id = excluded.project_id,
    project_event_id = excluded.project_event_id,
    updated_at = excluded.updated_at
`

const DELETE_SEARCH = 'DELETE FROM note_search WHERE path = ?'
const INSERT_SEARCH = 'INSERT INTO note_search (path, content) VALUES (?, ?)'
const DELETE_NOTE = 'DELETE FROM note WHERE path = ?'
const SEARCH_PATHS = `
  SELECT path
  FROM note_search
  WHERE note_search MATCH ?
  ORDER BY rank
`

const noteRowSchema = z
  .object({
    path: z.string(),
    project_id: z.string().nullable(),
    project_event_id: z.string().nullable(),
    updated_at: z.string(),
  })
  .transform((row) => ({
    path: row.path,
    projectId: row.project_id,
    projectEventId: row.project_event_id,
    updatedAt: row.updated_at,
  }))
  .pipe(noteSchema)

const searchRowSchema = z.object({ path: z.string() })

function toContentStatements(content: NoteContent): BatchStatement[] {
  return [
    { query: UPSERT_TIMESTAMP, values: [content.path, content.updatedAt] },
    { query: DELETE_SEARCH, values: [content.path] },
    { query: INSERT_SEARCH, values: [content.path, content.content] },
  ]
}

export class SqliteNoteRepository implements NoteRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Note[]> {
    return parseRows(noteRowSchema, 'note', await this.#gateway.select<unknown[]>(SELECT_ALL))
  }

  // O vínculo não vai junto do conteúdo: gravar o texto não pode apagar o projeto que já
  // estava ligado, e o `ON CONFLICT` só mexe no que cada operação de fato mudou.
  async saveContent(content: NoteContent): Promise<void> {
    await this.#gateway.executeBatch(toContentStatements(content))
  }

  async setLinks(link: NoteLink): Promise<void> {
    await this.#gateway.executeBatch([
      {
        query: UPSERT_LINKS,
        values: [link.path, link.projectId, link.projectEventId, link.updatedAt],
      },
    ])
  }

  async remove(path: string): Promise<void> {
    await this.#gateway.executeBatch([
      { query: DELETE_SEARCH, values: [path] },
      { query: DELETE_NOTE, values: [path] },
    ])
  }

  async searchPaths(ftsQuery: string): Promise<string[]> {
    const rows = parseRows(
      searchRowSchema,
      'note_search',
      await this.#gateway.select<unknown[]>(SEARCH_PATHS, [ftsQuery]),
    )

    return rows.map((row) => row.path)
  }
}
