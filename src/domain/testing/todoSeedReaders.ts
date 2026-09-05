import type { DatabaseSync } from 'node:sqlite'
import type { Todo, TodoRecurrence, TodoTag } from '@/domain/schemas/todoSchema'
import type { TodosSnapshot } from '@/domain/todos/todoRow'
import { readProjectsSnapshot } from './seedReaders'

type TodoRow = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  priority: Todo['priority']
  status: Todo['status']
  project_id: string | null
  task_id: string | null
  completed_at: string | null
  recurrence_id: string | null
}

type TodoTagRow = {
  todo_id: string
  tag_id: string
}

type TodoRecurrenceRow = {
  id: string
  title: string
  rule: string
  quantity: number
  last_generated_at: string | null
  active: number
}

function selectRows<TRow>(database: DatabaseSync, query: string): TRow[] {
  return database.prepare(query).all() as TRow[]
}

function toTodo(row: TodoRow): Todo {
  return {
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
  }
}

function toRecurrence(row: TodoRecurrenceRow): TodoRecurrence {
  return {
    id: row.id,
    title: row.title,
    rule: row.rule,
    quantity: row.quantity,
    lastGeneratedAt: row.last_generated_at,
    active: row.active !== 0,
  }
}

function toTodoTag(row: TodoTagRow): TodoTag {
  return { todoId: row.todo_id, tagId: row.tag_id }
}

export function readTodosSnapshot(database: DatabaseSync): TodosSnapshot {
  const projectsSnapshot = readProjectsSnapshot(database)

  return {
    todos: selectRows<TodoRow>(database, 'SELECT * FROM todo').map(toTodo),
    todoTags: selectRows<TodoTagRow>(database, 'SELECT * FROM todo_tag').map(toTodoTag),
    recurrences: selectRows<TodoRecurrenceRow>(
      database,
      'SELECT * FROM todo_recurrence ORDER BY title',
    ).map(toRecurrence),
    projects: projectsSnapshot.projects,
    tasks: projectsSnapshot.tasks,
    phases: projectsSnapshot.phases,
    tags: projectsSnapshot.tags,
  }
}
