import type { EntityId, IsoDate, IsoDateTime } from '@/domain/schemas/primitives'
import type { Todo, TodoRecurrence, TodoStatus, TodoTag } from '@/domain/schemas/todoSchema'
import type { TodoUpdate } from '@/domain/todos/editTodo'
import type { NewTodo } from '@/domain/todos/newTodo'

export type TodoCompletionChange = {
  todoId: EntityId
  status: TodoStatus
  completedAt: IsoDateTime | null
}

export type TodoRepository = {
  listAll(): Promise<Todo[]>
  listTodoTags(): Promise<TodoTag[]>
  listRecurrences(): Promise<TodoRecurrence[]>
  create(todo: NewTodo): Promise<void>
  update(update: TodoUpdate): Promise<void>
  setCompletion(change: TodoCompletionChange): Promise<void>
  setDueDate(todoId: EntityId, dueDate: IsoDate | null): Promise<void>
  setProject(todoId: EntityId, projectId: EntityId | null): Promise<void>
}
