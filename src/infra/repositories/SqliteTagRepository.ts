import { z } from 'zod'
import type { TagRepository } from '@/domain/repositories/TagRepository'
import { projectTagSchema, tagSchema, type ProjectTag, type Tag } from '@/domain/schemas/tagSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = 'SELECT id, name FROM tag ORDER BY name'
const SELECT_PROJECT_TAGS = `
  SELECT project_tag.project_id, project_tag.tag_id
  FROM project_tag
  JOIN tag ON tag.id = project_tag.tag_id
  ORDER BY project_tag.project_id, tag.name
`

const tagRowSchema = z.object({ id: z.string(), name: z.string() }).pipe(tagSchema)

const projectTagRowSchema = z
  .object({ project_id: z.string(), tag_id: z.string() })
  .transform((row) => ({ projectId: row.project_id, tagId: row.tag_id }))
  .pipe(projectTagSchema)

export class SqliteTagRepository implements TagRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Tag[]> {
    return parseRows(tagRowSchema, 'tag', await this.#gateway.select<unknown[]>(SELECT_ALL))
  }

  async listProjectTags(): Promise<ProjectTag[]> {
    return parseRows(
      projectTagRowSchema,
      'project_tag',
      await this.#gateway.select<unknown[]>(SELECT_PROJECT_TAGS),
    )
  }
}
