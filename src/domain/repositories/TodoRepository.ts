import type { EntityId, IsoDate, IsoDateTime, Priority } from '@/domain/schemas/primitives'
import type { Todo, TodoBoardStatus, TodoRecurrence, TodoTag } from '@/domain/schemas/todoSchema'
import type { TodoUpdate } from '@/domain/todos/editTodo'
import type { NewTodo } from '@/domain/todos/newTodo'

export type TodoStatusChange = {
  todoId: EntityId
  status: TodoBoardStatus
  completedAt: IsoDateTime | null
}

export type TodoRepository = {
  listAll(): Promise<Todo[]>
  listTodoTags(): Promise<TodoTag[]>
  listRecurrences(): Promise<TodoRecurrence[]>
  create(todo: NewTodo): Promise<void>
  update(update: TodoUpdate): Promise<void>
  setStatus(change: TodoStatusChange): Promise<void>
  setDueDate(todoId: EntityId, dueDate: IsoDate | null): Promise<void>
  setPriority(todoId: EntityId, priority: Priority): Promise<void>
  setProject(todoId: EntityId, projectId: EntityId | null): Promise<void>
}
