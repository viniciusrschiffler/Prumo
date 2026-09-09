import { useCallback, useMemo } from 'react'
import { useTodosStore } from '@/app/stores/useTodosStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { EntityId } from '@/domain/schemas/primitives'
import type { TodoBoardDrop } from '@/domain/todos/todoBoard'
import { DEFAULT_TODO_PRIORITY, DEFAULT_TODO_STATUS, type NewTodoDraft } from '@/domain/todos/newTodo'
import type { QuickCapture } from '@/domain/todos/quickCapture'

export type TodoActions = {
  capture: (capture: QuickCapture) => void
  create: (draft: NewTodoDraft) => void
  update: (todoId: EntityId, draft: NewTodoDraft) => void
  toggle: (todoId: EntityId) => void
  drop: (todoId: EntityId, drop: TodoBoardDrop) => void
  snooze: (todoId: EntityId) => void
  link: (todoId: EntityId, projectId: EntityId | null) => void
}

export function useTodoActions(): TodoActions {
  const createTodo = useTodosStore((state) => state.createTodo)
  const updateTodo = useTodosStore((state) => state.updateTodo)
  const toggleTodo = useTodosStore((state) => state.toggleTodo)
  const applyBoardDrop = useTodosStore((state) => state.applyBoardDrop)
  const snoozeTodo = useTodosStore((state) => state.snoozeTodo)
  const linkProject = useTodosStore((state) => state.linkProject)
  const notify = useToastStore((state) => state.notify)

  const run = useCallback(
    (action: () => Promise<void>, failure: string) => {
      void action().catch((cause: unknown) => {
        console.error(failure, cause)
        notify(toPublicMessage(cause), 'danger')
      })
    },
    [notify],
  )

  return useMemo(
    () => ({
      capture: (capture) =>
        run(
          () =>
            createTodo({
              title: capture.title,
              description: '',
              projectId: capture.projectId,
              dueDate: capture.dueDate,
              priority: capture.priority ?? DEFAULT_TODO_PRIORITY,
              status: DEFAULT_TODO_STATUS,
              tagNames: capture.tagNames,
            }),
          'Não foi possível capturar o todo.',
        ),
      create: (draft) => run(() => createTodo(draft), 'Não foi possível criar o todo.'),
      update: (todoId, draft) =>
        run(() => updateTodo(todoId, draft), 'Não foi possível salvar o todo.'),
      toggle: (todoId) => run(() => toggleTodo(todoId), 'Não foi possível marcar o todo.'),
      drop: (todoId, target) =>
        run(() => applyBoardDrop(todoId, target), 'Não foi possível mover o card.'),
      snooze: (todoId) => run(() => snoozeTodo(todoId), 'Não foi possível adiar o todo.'),
      link: (todoId, projectId) =>
        run(() => linkProject(todoId, projectId), 'Não foi possível vincular o projeto.'),
    }),
    [run, createTodo, updateTodo, toggleTodo, applyBoardDrop, snoozeTodo, linkProject],
  )
}
