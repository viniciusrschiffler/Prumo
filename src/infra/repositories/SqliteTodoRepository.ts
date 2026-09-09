import { z } from 'zod'
import type {
  TodoRepository,
  TodoStatusChange,
} from '@/domain/repositories/TodoRepository'
import type { EntityId, IsoDate, Priority } from '@/domain/schemas/primitives'
import {
  todoRecurrenceSchema,
  todoSchema,
  todoTagSchema,
  type Todo,
  type TodoRecurrence,
  type TodoTag,
} from '@/domain/schemas/todoSchema'
import type { TodoUpdate } from '@/domain/todos/editTodo'
import type { NewTodo } from '@/domain/todos/newTodo'
import { parseRows } from '@/infra/database/parseRow'
import type { BatchStatement, SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = `
  SELECT id, title, description, due_date, priority, status, project_id, task_id,
         completed_at, recurrence_id
  FROM todo
  ORDER BY due_date IS NULL, due_date, title
`

const SELECT_TODO_TAGS = `
  SELECT todo_tag.todo_id, todo_tag.tag_id
  FROM todo_tag
  JOIN tag ON tag.id = todo_tag.tag_id
  ORDER BY todo_tag.todo_id, tag.name
`

const SELECT_RECURRENCES = `
  SELECT id, title, rule, quantity, last_generated_at, active
  FROM todo_recurrence
  ORDER BY title
`

const INSERT_TODO = `
  INSERT INTO todo (id, title, description, due_date, priority, status, project_id,
                    task_id, completed_at, recurrence_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL)
`

const INSERT_TAG = 'INSERT INTO tag (id, name) VALUES (?, ?) ON CONFLICT (name) DO NOTHING'

const LINK_TAG = `
  INSERT INTO todo_tag (todo_id, tag_id)
  SELECT ?, id FROM tag WHERE name = ?
`

const UPDATE_TODO = `
  UPDATE todo
  SET title = ?, description = ?, due_date = ?, priority = ?, status = ?, completed_at = ?,
      project_id = ?, task_id = ?
  WHERE id = ?
`

const UNLINK_TAGS = 'DELETE FROM todo_tag WHERE todo_id = ?'

const UPDATE_STATUS = 'UPDATE todo SET status = ?, completed_at = ? WHERE id = ?'

const UPDATE_DUE_DATE = 'UPDATE todo SET due_date = ? WHERE id = ?'

const UPDATE_PRIORITY = 'UPDATE todo SET priority = ? WHERE id = ?'

const UPDATE_PROJECT = 'UPDATE todo SET project_id = ?, task_id = NULL WHERE id = ?'

const todoRowSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    due_date: z.string().nullable(),
    priority: z.string(),
    status: z.string(),
    project_id: z.string().nullable(),
    task_id: z.string().nullable(),
    completed_at: z.string().nullable(),
    recurrence_id: z.string().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    projectId: row.project_id,
    taskId: row.task_id,
    completedAt: row.completed_at,
    recurrenceId: row.recurrence_id,
  }))
  .pipe(todoSchema)

const todoTagRowSchema = z
  .object({ todo_id: z.string(), tag_id: z.string() })
  .transform((row) => ({ todoId: row.todo_id, tagId: row.tag_id }))
  .pipe(todoTagSchema)

const todoRecurrenceRowSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    rule: z.string(),
    quantity: z.number(),
    last_generated_at: z.string().nullable(),
    active: z.number(),
  })
  .transform((row) => ({
    id: row.id,
    title: row.title,
    rule: row.rule,
    quantity: row.quantity,
    lastGeneratedAt: row.last_generated_at,
    active: row.active !== 0,
  }))
  .pipe(todoRecurrenceSchema)

// A tag pode já existir com outro identificador, então o vínculo é resolvido por nome dentro
// da mesma transação em vez de reusar o identificador gerado aqui.
function toCreateStatements(todo: NewTodo): BatchStatement[] {
  return [
    {
      query: INSERT_TODO,
      values: [
        todo.id,
        todo.title,
        todo.description,
        todo.dueDate,
        todo.priority,
        todo.status,
        todo.projectId,
        todo.completedAt,
      ],
    },
    ...todo.tags.flatMap((tag) => [
      { query: INSERT_TAG, values: [tag.id, tag.name] },
      { query: LINK_TAG, values: [todo.id, tag.name] },
    ]),
  ]
}

// O vínculo com tag é reescrito inteiro, como no projeto: o formulário devolve a lista final.
function toUpdateStatements(update: TodoUpdate): BatchStatement[] {
  return [
    {
      query: UPDATE_TODO,
      values: [
        update.title,
        update.description,
        update.dueDate,
        update.priority,
        update.status,
        update.completedAt,
        update.projectId,
        update.taskId,
        update.id,
      ],
    },
    { query: UNLINK_TAGS, values: [update.id] },
    ...update.tags.flatMap((tag) => [
      { query: INSERT_TAG, values: [tag.id, tag.name] },
      { query: LINK_TAG, values: [update.id, tag.name] },
    ]),
  ]
}

export class SqliteTodoRepository implements TodoRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Todo[]> {
    return parseRows(todoRowSchema, 'todo', await this.#gateway.select<unknown[]>(SELECT_ALL))
  }

  async listTodoTags(): Promise<TodoTag[]> {
    return parseRows(
      todoTagRowSchema,
      'todo_tag',
      await this.#gateway.select<unknown[]>(SELECT_TODO_TAGS),
    )
  }

  async listRecurrences(): Promise<TodoRecurrence[]> {
    return parseRows(
      todoRecurrenceRowSchema,
      'todo_recurrence',
      await this.#gateway.select<unknown[]>(SELECT_RECURRENCES),
    )
  }

  async create(todo: NewTodo): Promise<void> {
    await this.#gateway.executeBatch(toCreateStatements(todo))
  }

  async update(update: TodoUpdate): Promise<void> {
    await this.#gateway.executeBatch(toUpdateStatements(update))
  }

  async setStatus(change: TodoStatusChange): Promise<void> {
    await this.#gateway.executeBatch([
      { query: UPDATE_STATUS, values: [change.status, change.completedAt, change.todoId] },
    ])
  }

  async setDueDate(todoId: EntityId, dueDate: IsoDate | null): Promise<void> {
    await this.#gateway.executeBatch([{ query: UPDATE_DUE_DATE, values: [dueDate, todoId] }])
  }

  async setPriority(todoId: EntityId, priority: Priority): Promise<void> {
    await this.#gateway.executeBatch([{ query: UPDATE_PRIORITY, values: [priority, todoId] }])
  }

  async setProject(todoId: EntityId, projectId: EntityId | null): Promise<void> {
    await this.#gateway.executeBatch([{ query: UPDATE_PROJECT, values: [projectId, todoId] }])
  }
}
