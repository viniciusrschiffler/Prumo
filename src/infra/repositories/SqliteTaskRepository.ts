import { z } from 'zod'
import type { NewTask } from '@/domain/projects/newTask'
import type { TaskRepository } from '@/domain/repositories/TaskRepository'
import {
  taskDependencySchema,
  taskSchema,
  type Task,
  type TaskDependency,
} from '@/domain/schemas/taskSchema'
import type { TaskReschedule } from '@/domain/timeline/timelineSchedule'
import { parseRows } from '@/infra/database/parseRow'
import type { BatchStatement, SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, project_id, phase_id, title, status, planned_start, planned_end,
         actual_start, actual_end, estimated_hours, sort_order
  FROM task
  ORDER BY project_id, sort_order
`

const SELECT_DEPENDENCIES = `
  SELECT task_id, depends_on_task_id
  FROM task_dependency
`

const INSERT_TASK = `
  INSERT INTO task (id, project_id, phase_id, title, status, planned_start, planned_end,
                    actual_start, actual_end, estimated_hours, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)
`

const INSERT_ALLOCATION = `
  INSERT INTO allocation (id, task_id, person_id, start_date, end_date, percentage,
                          ended_at, ended_reason)
  VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)
`

const UPDATE_TASK_SCHEDULE = 'UPDATE task SET planned_start = ?, planned_end = ? WHERE id = ?'

const INSERT_REPLAN_EVENT = `
  INSERT INTO project_event (id, project_id, type, event_date, title, body_md,
                             reverts_event_id, risk_open, expected_resume_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, NULL, 0, NULL, ?)
`

const LINK_EVENT_TASK =
  'INSERT INTO project_event_task (project_event_id, task_id) VALUES (?, ?)'

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

const taskDependencyRowSchema = z
  .object({
    task_id: z.string(),
    depends_on_task_id: z.string(),
  })
  .transform((row) => ({
    taskId: row.task_id,
    dependsOnTaskId: row.depends_on_task_id,
  }))
  .pipe(taskDependencySchema)

function toCreateStatements(newTask: NewTask): BatchStatement[] {
  const { task } = newTask

  return [
    {
      query: INSERT_TASK,
      values: [
        task.id,
        task.projectId,
        task.phaseId,
        task.title,
        task.status,
        task.plannedStart,
        task.plannedEnd,
        task.estimatedHours,
        task.sortOrder,
      ],
    },
    ...newTask.allocations.map((allocation) => ({
      query: INSERT_ALLOCATION,
      values: [
        allocation.id,
        allocation.taskId,
        allocation.personId,
        allocation.startDate,
        allocation.endDate,
        allocation.percentage,
      ],
    })),
  ]
}

export class SqliteTaskRepository implements TaskRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Task[]> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_ALL)

    return parseRows(taskRowSchema, 'task', rows)
  }

  async listDependencies(): Promise<TaskDependency[]> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_DEPENDENCIES)

    return parseRows(taskDependencyRowSchema, 'task_dependency', rows)
  }

  // Tarefa e alocações vão no mesmo lote: gravar a tarefa sem quem a executa perderia a
  // atribuição sem nada na tela dizendo que faltou.
  async create(newTask: NewTask): Promise<void> {
    await this.#gateway.executeBatch(toCreateStatements(newTask))
  }

  // O replanejamento e o evento que o registra vão no mesmo lote: mover a barra sem deixar
  // rastro apagaria do histórico a decisão que o desvio da baseline vai cobrar depois.
  async reschedule(change: TaskReschedule): Promise<void> {
    const { event } = change

    await this.#gateway.executeBatch([
      {
        query: UPDATE_TASK_SCHEDULE,
        values: [change.period.start, change.period.end, change.taskId],
      },
      {
        query: INSERT_REPLAN_EVENT,
        values: [
          event.id,
          event.projectId,
          event.type,
          event.eventDate,
          event.title,
          event.bodyMarkdown,
          event.createdAt,
        ],
      },
      { query: LINK_EVENT_TASK, values: [event.id, change.taskId] },
    ])
  }
}
