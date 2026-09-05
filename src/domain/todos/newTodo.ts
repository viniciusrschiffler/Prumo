import type { EntityId, IsoDate, Priority } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'
import {
  classifyDue,
  type DueGroupBucket,
  type TodoGroupingContext,
  type TodoGroupMode,
} from './todoGrouping'

export const DEFAULT_TODO_PRIORITY: Priority = 'P2'

export type NewTodoDraft = {
  title: string
  description: string
  projectId: EntityId | null
  dueDate: IsoDate | null
  priority: Priority
  tagNames: readonly string[]
}

export type NewTodo = {
  id: EntityId
  title: string
  description: string | null
  projectId: EntityId | null
  dueDate: IsoDate | null
  priority: Priority
  tags: readonly { id: EntityId; name: string }[]
}

export type NewTodoErrors = {
  title?: string
}

export type TodoGroupPreview =
  | { kind: 'due'; bucket: DueGroupBucket }
  | { kind: 'project'; project: Project | null }
  | { kind: 'priority'; priority: Priority }

export function validateNewTodo(draft: NewTodoDraft): NewTodoErrors {
  return draft.title.trim() === '' ? { title: 'Escreva o que precisa ser feito.' } : {}
}

function toUniqueNames(tagNames: readonly string[]): string[] {
  return [...new Set(tagNames.map((name) => name.trim()).filter((name) => name !== ''))]
}

export function buildNewTodo(
  draft: NewTodoDraft,
  ids: { todoId: EntityId; tagIds: readonly EntityId[] },
): NewTodo {
  const names = toUniqueNames(draft.tagNames)
  const description = draft.description.trim()

  return {
    id: ids.todoId,
    title: draft.title.trim(),
    description: description === '' ? null : description,
    projectId: draft.projectId,
    dueDate: draft.dueDate,
    priority: draft.priority,
    tags: names.map((name, index) => ({ id: ids.tagIds[index] ?? name, name })),
  }
}

export function previewTodoGroup(
  draft: NewTodoDraft,
  mode: TodoGroupMode,
  context: TodoGroupingContext,
  projects: readonly Project[],
): TodoGroupPreview {
  if (mode === 'priority') {
    return { kind: 'priority', priority: draft.priority }
  }

  if (mode === 'project') {
    return {
      kind: 'project',
      project: projects.find((project) => project.id === draft.projectId) ?? null,
    }
  }

  return { kind: 'due', bucket: classifyDue(draft.dueDate, context) }
}
