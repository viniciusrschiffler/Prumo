import { z } from 'zod'
import type { ProjectEventRepository } from '@/domain/repositories/ProjectEventRepository'
import { projectEventSchema, type ProjectEvent } from '@/domain/schemas/projectEventSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, project_id, type, event_date, title, body_md, reverts_event_id,
         risk_open, expected_resume_at, created_at
  FROM project_event
  ORDER BY event_date, created_at
`

const projectEventRowSchema = z
  .object({
    id: z.string(),
    project_id: z.string(),
    type: z.string(),
    event_date: z.string(),
    title: z.string(),
    body_md: z.string().nullable(),
    reverts_event_id: z.string().nullable(),
    risk_open: z.number(),
    expected_resume_at: z.string().nullable(),
    created_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    eventDate: row.event_date,
    title: row.title,
    bodyMarkdown: row.body_md,
    revertsEventId: row.reverts_event_id,
    riskOpen: row.risk_open !== 0,
    expectedResumeAt: row.expected_resume_at,
    createdAt: row.created_at,
  }))
  .pipe(projectEventSchema)

export class SqliteProjectEventRepository implements ProjectEventRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<ProjectEvent[]> {
    return parseRows(
      projectEventRowSchema,
      'project_event',
      await this.#gateway.select<unknown[]>(SELECT_ALL),
    )
  }
}
