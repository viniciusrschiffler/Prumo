import type { EntityId, IsoDate, IsoDateTime, Priority } from '@/domain/schemas/primitives'
import { isBoardStatus, type Todo, type TodoBoardStatus } from '@/domain/schemas/todoSchema'
import { normalizeTodoDraft, type NewTodoDraft, type TodoTagDraft } from './newTodo'
import { buildTodoStatusChange } from './todoEdits'

export type TodoUpdate = {
  id: EntityId
  title: string
  description: string | null
  projectId: EntityId | null
  taskId: EntityId | null
  dueDate: IsoDate | null
  priority: Priority
  status: TodoBoardStatus
  completedAt: IsoDateTime | null
  tags: readonly TodoTagDraft[]
}

export type TodoEditContext = {
  todo: Todo
  tagNames: readonly string[]
}

// Nenhum caminho do app grava `cancelled`, e o formulário não oferece essa opção: se um todo
// cancelado chegasse aqui, ele abriria como Backlog em vez de sem coluna nenhuma.
export function toTodoDraft(context: TodoEditContext): NewTodoDraft {
  const { todo } = context

  return {
    title: todo.title,
    description: todo.description ?? '',
    projectId: todo.projectId,
    dueDate: todo.dueDate,
    priority: todo.priority,
    status: isBoardStatus(todo.status) ? todo.status : 'open',
    tagNames: context.tagNames,
  }
}

// Trocar o projeto solta a tarefa: ela pertence ao projeto de antes, e mantê-la ligada
// deixaria o todo apontando para trabalho de outro projeto. É a mesma regra do "@" da linha.
export function buildTodoUpdate(
  todo: Todo,
  draft: NewTodoDraft,
  tagIds: readonly EntityId[],
  now: IsoDateTime,
): TodoUpdate {
  const normalized = normalizeTodoDraft(draft, tagIds)
  // Quem já estava concluído mantém o carimbo original: reeditar o título não é reconcluir.
  const change = buildTodoStatusChange(draft.status, now, todo.completedAt)

  return {
    id: todo.id,
    title: normalized.title,
    description: normalized.description,
    projectId: draft.projectId,
    taskId: draft.projectId === todo.projectId ? todo.taskId : null,
    dueDate: draft.dueDate,
    priority: draft.priority,
    status: change.status,
    completedAt: change.completedAt,
    tags: normalized.tags,
  }
}
