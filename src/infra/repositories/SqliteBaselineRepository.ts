import { z } from 'zod'
import type { BaselineRepository } from '@/domain/repositories/BaselineRepository'
import {
  baselineSchema,
  baselineTaskSchema,
  type Baseline,
  type BaselineTask,
} from '@/domain/schemas/baselineSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, project_id, version, created_at, reason
  FROM baseline
  ORDER BY project_id, version
`

const SELECT_TASKS = `
  SELECT baseline_id, task_id, planned_start, planned_end, estimated_hours
  FROM baseline_task
  ORDER BY baseline_id, task_id
`

const baselineRowSchema = z
  .object({
    id: z.string(),
    project_id: z.string(),
    version: z.number(),
    created_at: z.string(),
    reason: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    projectId: row.project_id,
    version: row.version,
    createdAt: row.created_at,
    reason: row.reason,
  }))
  .pipe(baselineSchema)

const baselineTaskRowSchema = z
  .object({
    baseline_id: z.string(),
    task_id: z.string(),
    planned_start: z.string().nullable(),
    planned_end: z.string().nullable(),
    estimated_hours: z.number().nullable(),
  })
  .transform((row) => ({
    baselineId: row.baseline_id,
    taskId: row.task_id,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    estimatedHours: row.estimated_hours,
  }))
  .pipe(baselineTaskSchema)

export class SqliteBaselineRepository implements BaselineRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Baseline[]> {
    return parseRows(
      baselineRowSchema,
      'baseline',
      await this.#gateway.select<unknown[]>(SELECT_ALL),
    )
  }

  async listTasks(): Promise<BaselineTask[]> {
    return parseRows(
      baselineTaskRowSchema,
      'baseline_task',
      await this.#gateway.select<unknown[]>(SELECT_TASKS),
    )
  }
}
