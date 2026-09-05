import { z } from 'zod'
import type { ProjectEventRepository } from '@/domain/repositories/ProjectEventRepository'
import {
  projectEventSchema,
  projectEventTaskSchema,
  type ProjectEvent,
  type ProjectEventTask,
} from '@/domain/schemas/projectEventSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, project_id, type, event_date, title, body_md, reverts_event_id,
         risk_open, expected_resume_at, created_at
  FROM project_event
  ORDER BY event_date, created_at
`

const SELECT_EVENT_TASKS = `
  SELECT project_event_id, task_id
  FROM project_event_task
`

const INSERT_EVENT = `
  INSERT INTO project_event (id, project_id, type, event_date, title, body_md,
                             reverts_event_id, risk_open, expected_resume_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

const projectEventTaskRowSchema = z
  .object({
    project_event_id: z.string(),
    task_id: z.string(),
  })
  .transform((row) => ({
    projectEventId: row.project_event_id,
    taskId: row.task_id,
  }))
  .pipe(projectEventTaskSchema)

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

  async listEventTasks(): Promise<ProjectEventTask[]> {
    return parseRows(
      projectEventTaskRowSchema,
      'project_event_task',
      await this.#gateway.select<unknown[]>(SELECT_EVENT_TASKS),
    )
  }

  async create(event: ProjectEvent): Promise<void> {
    await this.#gateway.executeBatch([
      {
        query: INSERT_EVENT,
        values: [
          event.id,
          event.projectId,
          event.type,
          event.eventDate,
          event.title,
          event.bodyMarkdown,
          event.revertsEventId,
          event.riskOpen ? 1 : 0,
          event.expectedResumeAt,
          event.createdAt,
        ],
      },
    ])
  }
}
