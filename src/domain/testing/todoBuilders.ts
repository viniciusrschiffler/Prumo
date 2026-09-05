import type { Todo, TodoRecurrence } from '@/domain/schemas/todoSchema'
import type { TodoRow } from '@/domain/todos/todoRow'
import { buildProject } from './projectRowBuilders'

export function buildTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'todo-1',
    title: 'Fechar escopo',
    description: null,
    dueDate: '2026-09-03',
    priority: 'P2',
    status: 'open',
    projectId: null,
    taskId: null,
    completedAt: null,
    recurrenceId: null,
    ...overrides,
  }
}

export function buildTodoRow(todo: Partial<Todo> = {}, overrides: Partial<TodoRow> = {}): TodoRow {
  const built = buildTodo(todo)

  return {
    todo: built,
    project: built.projectId === null ? null : buildProject({ id: built.projectId }),
    phase: null,
    tags: [],
    ...overrides,
  }
}

export function buildTodoRecurrence(
  overrides: Partial<TodoRecurrence> = {},
): TodoRecurrence {
  return {
    id: 'rec-1',
    title: 'Revisão semanal de capacidade',
    rule: 'semanal-seg',
    quantity: 1,
    lastGeneratedAt: '2026-08-31T08:00:00Z',
    active: true,
    ...overrides,
  }
}
