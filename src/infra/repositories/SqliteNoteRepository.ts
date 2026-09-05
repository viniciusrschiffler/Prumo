import { z } from 'zod'
import type { NoteRepository } from '@/domain/repositories/NoteRepository'
import { noteSchema, type Note } from '@/domain/schemas/noteSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT path, project_id, project_event_id, updated_at
  FROM note
  ORDER BY updated_at DESC
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

export class SqliteNoteRepository implements NoteRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Note[]> {
    return parseRows(noteRowSchema, 'note', await this.#gateway.select<unknown[]>(SELECT_ALL))
  }
}
