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

export type TodoTagDraft = {
  id: EntityId
  name: string
}

export type NewTodo = {
  id: EntityId
  title: string
  description: string | null
  projectId: EntityId | null
  dueDate: IsoDate | null
  priority: Priority
  tags: readonly TodoTagDraft[]
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

export type NormalizedTodoFields = {
  title: string
  description: string | null
  tags: readonly TodoTagDraft[]
}

// Criar e editar aparam o mesmo texto e descartam a mesma tag repetida: o formulário é um só.
export function normalizeTodoDraft(
  draft: NewTodoDraft,
  tagIds: readonly EntityId[],
): NormalizedTodoFields {
  const description = draft.description.trim()

  return {
    title: draft.title.trim(),
    description: description === '' ? null : description,
    tags: toUniqueNames(draft.tagNames).map((name, index) => ({
      id: tagIds[index] ?? name,
      name,
    })),
  }
}

export function emptyTodoDraft(): NewTodoDraft {
  return {
    title: '',
    description: '',
    projectId: null,
    dueDate: null,
    priority: DEFAULT_TODO_PRIORITY,
    tagNames: [],
  }
}

export function buildNewTodo(
  draft: NewTodoDraft,
  ids: { todoId: EntityId; tagIds: readonly EntityId[] },
): NewTodo {
  const normalized = normalizeTodoDraft(draft, ids.tagIds)

  return {
    id: ids.todoId,
    title: normalized.title,
    description: normalized.description,
    projectId: draft.projectId,
    dueDate: draft.dueDate,
    priority: draft.priority,
    tags: normalized.tags,
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
