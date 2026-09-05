import { z } from 'zod'
import type { NewProject } from '@/domain/projects/newProject'
import type {
  NewProjectTag,
  ProjectRepository,
} from '@/domain/repositories/ProjectRepository'
import { projectSchema, type Project } from '@/domain/schemas/projectSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { BatchStatement } from '@/infra/database/SqlGateway'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, name, description, status, priority, owner_person_id,
         planned_start, planned_end, created_at, archived_at
  FROM project
  ORDER BY name
`

const INSERT_PROJECT = `
  INSERT INTO project (id, name, description, status, priority, owner_person_id,
                       planned_start, planned_end, created_at, archived_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
`

const INSERT_BASELINE = `
  INSERT INTO baseline (id, project_id, version, created_at, reason)
  VALUES (?, ?, ?, ?, ?)
`

const INSERT_TAG = 'INSERT INTO tag (id, name) VALUES (?, ?) ON CONFLICT (name) DO NOTHING'

const LINK_TAG = `
  INSERT INTO project_tag (project_id, tag_id)
  SELECT ?, id FROM tag WHERE name = ?
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

function toCreateStatements(
  newProject: NewProject,
  tags: readonly NewProjectTag[],
): BatchStatement[] {
  const { project, baseline } = newProject

  return [
    {
      query: INSERT_PROJECT,
      values: [
        project.id,
        project.name,
        project.description,
        project.status,
        project.priority,
        project.ownerPersonId,
        project.plannedStart,
        project.plannedEnd,
        project.createdAt,
      ],
    },
    {
      query: INSERT_BASELINE,
      values: [baseline.id, baseline.projectId, baseline.version, baseline.createdAt, baseline.reason],
    },
    ...tags.flatMap((tag) => [
      { query: INSERT_TAG, values: [tag.id, tag.name] },
      { query: LINK_TAG, values: [project.id, tag.name] },
    ]),
  ]
}

export class SqliteProjectRepository implements ProjectRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Project[]> {
    return parseRows(projectRowSchema, 'project', await this.#gateway.select<unknown[]>(SELECT_ALL))
  }

  async create(newProject: NewProject, tags: readonly NewProjectTag[]): Promise<void> {
    await this.#gateway.executeBatch(toCreateStatements(newProject, tags))
  }
}
