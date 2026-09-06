import { z } from 'zod'
import type { Reallocation } from '@/domain/capacity/reallocationWrite'
import type { AllocationRepository } from '@/domain/repositories/AllocationRepository'
import { allocationSchema, type Allocation } from '@/domain/schemas/allocationSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { BatchStatement, SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, task_id, person_id, start_date, end_date, percentage, ended_at, ended_reason
  FROM allocation
  ORDER BY start_date, id
`

const END_ALLOCATION = 'UPDATE allocation SET ended_at = ?, ended_reason = ? WHERE id = ?'

const INSERT_ALLOCATION = `
  INSERT INTO allocation (id, task_id, person_id, start_date, end_date, percentage,
                          ended_at, ended_reason)
  VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)
`

const UPDATE_TASK_SCHEDULE = 'UPDATE task SET planned_start = ?, planned_end = ? WHERE id = ?'

const INSERT_EVENT = `
  INSERT INTO project_event (id, project_id, type, event_date, title, body_md,
                             reverts_event_id, risk_open, expected_resume_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, NULL, 0, ?, ?)
`

const LINK_EVENT_TASK =
  'INSERT INTO project_event_task (project_event_id, task_id) VALUES (?, ?)'

const INSERT_BASELINE =
  'INSERT INTO baseline (id, project_id, version, created_at, reason) VALUES (?, ?, ?, ?, ?)'

const INSERT_BASELINE_TASK = `
  INSERT INTO baseline_task (baseline_id, task_id, planned_start, planned_end, estimated_hours)
  VALUES (?, ?, ?, ?, ?)
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

function toScheduleStatements(reallocation: Reallocation): BatchStatement[] {
  const { resumedAllocation, taskPeriod } = reallocation
  const statements: BatchStatement[] = []

  if (resumedAllocation !== null) {
    statements.push({
      query: INSERT_ALLOCATION,
      values: [
        resumedAllocation.id,
        resumedAllocation.taskId,
        resumedAllocation.personId,
        resumedAllocation.startDate,
        resumedAllocation.endDate,
        resumedAllocation.percentage,
      ],
    })
  }

  if (taskPeriod !== null) {
    statements.push({
      query: UPDATE_TASK_SCHEDULE,
      values: [taskPeriod.start, taskPeriod.end, reallocation.taskId],
    })
  }

  return statements
}

function toReallocationStatements(reallocation: Reallocation): BatchStatement[] {
  const { event, baseline } = reallocation

  return [
    {
      query: END_ALLOCATION,
      values: [reallocation.endedAt, reallocation.endedReason, reallocation.endedAllocationId],
    },
    ...toScheduleStatements(reallocation),
    {
      query: INSERT_EVENT,
      values: [
        event.id,
        event.projectId,
        event.type,
        event.eventDate,
        event.title,
        event.bodyMarkdown,
        event.expectedResumeAt,
        event.createdAt,
      ],
    },
    { query: LINK_EVENT_TASK, values: [event.id, reallocation.taskId] },
    {
      query: INSERT_BASELINE,
      values: [
        baseline.id,
        baseline.projectId,
        baseline.version,
        baseline.createdAt,
        baseline.reason,
      ],
    },
    ...reallocation.baselineTasks.map((baselineTask) => ({
      query: INSERT_BASELINE_TASK,
      values: [
        baselineTask.baselineId,
        baselineTask.taskId,
        baselineTask.plannedStart,
        baselineTask.plannedEnd,
        baselineTask.estimatedHours,
      ],
    })),
  ]
}

export class SqliteAllocationRepository implements AllocationRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Allocation[]> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_ALL)

    return parseRows(allocationRowSchema, 'allocation', rows)
  }

  // Encerrar a alocação, deslocar a tarefa, registrar o evento e congelar a baseline vão no
  // mesmo lote: metade disso gravada deixaria o projeto se comparando com um plano que a
  // outra metade já desmentiu.
  async applyReallocation(reallocation: Reallocation): Promise<void> {
    await this.#gateway.executeBatch(toReallocationStatements(reallocation))
  }
}
