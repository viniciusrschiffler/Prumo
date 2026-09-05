import { z } from 'zod'
import { PrumoError } from '@/domain/errors/PrumoError'
import type { TaskRepository } from '@/domain/repositories/TaskRepository'
import { taskSchema, type Task } from '@/domain/schemas/taskSchema'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, project_id, phase_id, title, status, planned_start, planned_end,
         actual_start, actual_end, estimated_hours, sort_order
  FROM task
  ORDER BY project_id, sort_order
`

const taskRowSchema = z
  .object({
    id: z.string(),
    project_id: z.string(),
    phase_id: z.string(),
    title: z.string(),
    status: z.string(),
    planned_start: z.string().nullable(),
    planned_end: z.string().nullable(),
    actual_start: z.string().nullable(),
    actual_end: z.string().nullable(),
    estimated_hours: z.number().nullable(),
    sort_order: z.number(),
  })
  .transform((row) => ({
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    title: row.title,
    status: row.status,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    actualStart: row.actual_start,
    actualEnd: row.actual_end,
    estimatedHours: row.estimated_hours,
    sortOrder: row.sort_order,
  }))
  .pipe(taskSchema)

function parseTaskRow(row: unknown): Task {
  const result = taskRowSchema.safeParse(row)

  if (!result.success) {
    throw new PrumoError(
      'INVALID_RECORD_SHAPE',
      `linha de task fora do formato: ${result.error.message}`,
      { cause: result.error },
    )
  }

  return result.data
}

export class SqliteTaskRepository implements TaskRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Task[]> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_ALL)

    return rows.map(parseTaskRow)
  }
}
