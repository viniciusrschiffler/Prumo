import { z } from 'zod'
import type { ProjectRepository } from '@/domain/repositories/ProjectRepository'
import { projectSchema, type Project } from '@/domain/schemas/projectSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, name, description, status, priority, owner_person_id,
         planned_start, planned_end, created_at, archived_at
  FROM project
  ORDER BY name
`

const projectRowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    status: z.string(),
    priority: z.string(),
    owner_person_id: z.string().nullable(),
    planned_start: z.string().nullable(),
    planned_end: z.string().nullable(),
    created_at: z.string(),
    archived_at: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    ownerPersonId: row.owner_person_id,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  }))
  .pipe(projectSchema)

export class SqliteProjectRepository implements ProjectRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Project[]> {
    return parseRows(projectRowSchema, 'project', await this.#gateway.select<unknown[]>(SELECT_ALL))
  }
}
