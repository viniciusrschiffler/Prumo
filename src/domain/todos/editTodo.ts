import type { EntityId, IsoDate, Priority } from '@/domain/schemas/primitives'
import type { Todo } from '@/domain/schemas/todoSchema'
import { normalizeTodoDraft, type NewTodoDraft, type TodoTagDraft } from './newTodo'

export type TodoUpdate = {
  id: EntityId
  title: string
  description: string | null
  projectId: EntityId | null
  taskId: EntityId | null
  dueDate: IsoDate | null
  priority: Priority
  tags: readonly TodoTagDraft[]
}

export type TodoEditContext = {
  todo: Todo
  tagNames: readonly string[]
}

export function toTodoDraft(context: TodoEditContext): NewTodoDraft {
  const { todo } = context

  return {
    title: todo.title,
    description: todo.description ?? '',
    projectId: todo.projectId,
    dueDate: todo.dueDate,
    priority: todo.priority,
    tagNames: context.tagNames,
  }
}

// Trocar o projeto solta a tarefa: ela pertence ao projeto de antes, e mantê-la ligada
// deixaria o todo apontando para trabalho de outro projeto. É a mesma regra do "@" da linha.
export function buildTodoUpdate(
  todo: Todo,
  draft: NewTodoDraft,
  tagIds: readonly EntityId[],
): TodoUpdate {
  const normalized = normalizeTodoDraft(draft, tagIds)

  return {
    id: todo.id,
    title: normalized.title,
    description: normalized.description,
    projectId: draft.projectId,
    taskId: draft.projectId === todo.projectId ? todo.taskId : null,
    dueDate: draft.dueDate,
    priority: draft.priority,
    tags: normalized.tags,
  }
}
