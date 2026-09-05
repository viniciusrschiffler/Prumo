import { z } from 'zod'
import type { AllocationRepository } from '@/domain/repositories/AllocationRepository'
import { allocationSchema, type Allocation } from '@/domain/schemas/allocationSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, task_id, person_id, start_date, end_date, percentage, ended_at, ended_reason
  FROM allocation
  ORDER BY start_date, id
`

const allocationRowSchema = z
  .object({
    id: z.string(),
    task_id: z.string(),
    person_id: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    percentage: z.number(),
    ended_at: z.string().nullable(),
    ended_reason: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    taskId: row.task_id,
    personId: row.person_id,
    startDate: row.start_date,
    endDate: row.end_date,
    percentage: row.percentage,
    endedAt: row.ended_at,
    endedReason: row.ended_reason,
  }))
  .pipe(allocationSchema)

export class SqliteAllocationRepository implements AllocationRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Allocation[]> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_ALL)

    return parseRows(allocationRowSchema, 'allocation', rows)
  }
}
