import { create } from 'zustand'
import { todayIsoDate } from '@/app/clock'
import { useNavigationCountsStore } from '@/app/stores/useNavigationCountsStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import { buildTodoUpdate } from '@/domain/todos/editTodo'
import { buildNewTodo, type NewTodoDraft } from '@/domain/todos/newTodo'
import { buildTodoCompletion, snoozeDueDate } from '@/domain/todos/todoEdits'
import type { TodosSnapshot } from '@/domain/todos/todoRow'
import { getSqlGateway } from '@/infra/database/DatabaseConnection'
import { SqlitePhaseRepository } from '@/infra/repositories/SqlitePhaseRepository'
import { SqliteProjectRepository } from '@/infra/repositories/SqliteProjectRepository'
import { SqliteTagRepository } from '@/infra/repositories/SqliteTagRepository'
import { SqliteTaskRepository } from '@/infra/repositories/SqliteTaskRepository'
import { SqliteTodoRepository } from '@/infra/repositories/SqliteTodoRepository'

export type TodosStatus = 'idle' | 'loading' | 'ready' | 'error'

const EMPTY_SNAPSHOT: TodosSnapshot = {
  todos: [],
  todoTags: [],
  recurrences: [],
  projects: [],
  tasks: [],
  phases: [],
  tags: [],
}

type TodosState = {
  status: TodosStatus
  errorMessage: string | null
  snapshot: TodosSnapshot
  load: () => Promise<void>
  refresh: () => Promise<void>
  createTodo: (draft: NewTodoDraft) => Promise<void>
  updateTodo: (todoId: EntityId, draft: NewTodoDraft) => Promise<void>
  toggleTodo: (todoId: EntityId) => Promise<void>
  snoozeTodo: (todoId: EntityId) => Promise<void>
  linkProject: (todoId: EntityId, projectId: EntityId | null) => Promise<void>
  setDueDate: (todoId: EntityId, dueDate: IsoDate | null) => Promise<void>
}

function createTodoRepository(): SqliteTodoRepository {
  return new SqliteTodoRepository(getSqlGateway())
}

async function readSnapshot(): Promise<TodosSnapshot> {
  const gateway = getSqlGateway()
  const todoRepository = new SqliteTodoRepository(gateway)

  const [todos, todoTags, recurrences, projects, tasks, phases, tags] = await Promise.all([
    todoRepository.listAll(),
    todoRepository.listTodoTags(),
    todoRepository.listRecurrences(),
    new SqliteProjectRepository(gateway).listAll(),
    new SqliteTaskRepository(gateway).listAll(),
    new SqlitePhaseRepository(gateway).listAll(),
    new SqliteTagRepository(gateway).listAll(),
  ])

  return { todos, todoTags, recurrences, projects, tasks, phases, tags }
}

export const useTodosStore = create<TodosState>((set, get) => ({
  status: 'idle',
  errorMessage: null,
  snapshot: EMPTY_SNAPSHOT,

  load: async () => {
    set(() => ({ status: 'loading', errorMessage: null }))

    try {
      const snapshot = await readSnapshot()

      set(() => ({ status: 'ready', errorMessage: null, snapshot }))
    } catch (cause) {
      console.error('Não foi possível carregar a tela de TodoList.', cause)
      set(() => ({ status: 'error', errorMessage: toPublicMessage(cause) }))
    }
  },

  refresh: async () => {
    if (get().status !== 'ready') {
      await get().load()
      return
    }

    set({ snapshot: await readSnapshot() })
    await useNavigationCountsStore.getState().refresh()
  },

  createTodo: async (draft) => {
    const todo = buildNewTodo(draft, {
      todoId: crypto.randomUUID(),
      tagIds: draft.tagNames.map(() => crypto.randomUUID()),
    })

    await createTodoRepository().create(todo)
    await get().refresh()
  },

  updateTodo: async (todoId, draft) => {
    const todo = get().snapshot.todos.find((current) => current.id === todoId)

    if (todo === undefined) {
      return
    }

    await createTodoRepository().update(
      buildTodoUpdate(
        todo,
        draft,
        draft.tagNames.map(() => crypto.randomUUID()),
      ),
    )

    await get().refresh()
  },

  toggleTodo: async (todoId) => {
    const todo = get().snapshot.todos.find((current) => current.id === todoId)

    if (todo === undefined) {
      return
    }

    const completion = buildTodoCompletion(todo, new Date().toISOString())

    await createTodoRepository().setCompletion({ todoId, ...completion })
    await get().refresh()
  },

  snoozeTodo: async (todoId) => {
    const todo = get().snapshot.todos.find((current) => current.id === todoId)

    if (todo === undefined) {
      return
    }

    await createTodoRepository().setDueDate(todoId, snoozeDueDate(todo.dueDate, todayIsoDate()))
    await get().refresh()
  },

  linkProject: async (todoId, projectId) => {
    await createTodoRepository().setProject(todoId, projectId)
    await get().refresh()
  },

  setDueDate: async (todoId, dueDate) => {
    await createTodoRepository().setDueDate(todoId, dueDate)
    await get().refresh()
  },
}))
