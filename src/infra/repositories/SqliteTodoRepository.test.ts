import { beforeEach, describe, expect, it } from 'vitest'
import type { NewTodo } from '@/domain/todos/newTodo'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteTodoRepository } from './SqliteTodoRepository'

let gateway: SqlGateway
let repository: SqliteTodoRepository

function buildNewTodo(overrides: Partial<NewTodo> = {}): NewTodo {
  return {
    id: 'td-1',
    title: 'Fechar escopo',
    description: null,
    projectId: null,
    dueDate: '2026-09-03',
    priority: 'P1',
    tags: [],
    ...overrides,
  }
}

async function seedProject(id: string): Promise<void> {
  await gateway.executeBatch([
    {
      query: 'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
      values: [id, id, 'active', 'P1', '2026-02-20T09:00:00Z'],
    },
  ])
}

beforeEach(() => {
  gateway = createInMemoryGateway()
  repository = new SqliteTodoRepository(gateway)
})

describe('SqliteTodoRepository', () => {
  it('Should create a todo already open and without a completion time', async () => {
    await repository.create(buildNewTodo())

    expect(await repository.listAll()).toEqual([
      {
        id: 'td-1',
        title: 'Fechar escopo',
        description: null,
        dueDate: '2026-09-03',
        priority: 'P1',
        status: 'open',
        projectId: null,
        taskId: null,
        completedAt: null,
        recurrenceId: null,
      },
    ])
  })

  it('Should create the tag and its link in the same transaction', async () => {
    await repository.create(
      buildNewTodo({ tags: [{ id: 'tag-1', name: 'arquitetura' }] }),
    )

    expect(await repository.listTodoTags()).toEqual([{ todoId: 'td-1', tagId: 'tag-1' }])
  })

  it('Should reuse the tag that already exists instead of duplicating the name', async () => {
    await gateway.executeBatch([
      { query: 'INSERT INTO tag (id, name) VALUES (?, ?)', values: ['infra', 'infra'] },
    ])

    await repository.create(buildNewTodo({ tags: [{ id: 'outro-id', name: 'infra' }] }))

    expect(await repository.listTodoTags()).toEqual([{ todoId: 'td-1', tagId: 'infra' }])
  })

  it('Should leave nothing behind when a statement of the batch fails', async () => {
    await expect(
      repository.create(buildNewTodo({ projectId: 'projeto-que-nao-existe' })),
    ).rejects.toThrow()

    expect(await repository.listAll()).toEqual([])
  })

  it('Should record the completion and clear it when the todo is reopened', async () => {
    await repository.create(buildNewTodo())

    await repository.setCompletion({
      todoId: 'td-1',
      status: 'done',
      completedAt: '2026-09-03T12:00:00Z',
    })

    expect((await repository.listAll())[0]?.completedAt).toBe('2026-09-03T12:00:00Z')

    await repository.setCompletion({ todoId: 'td-1', status: 'open', completedAt: null })

    expect((await repository.listAll())[0]?.status).toBe('open')
  })

  it('Should change the due date, including clearing it', async () => {
    await repository.create(buildNewTodo())
    await repository.setDueDate('td-1', '2026-09-10')

    expect((await repository.listAll())[0]?.dueDate).toBe('2026-09-10')

    await repository.setDueDate('td-1', null)

    expect((await repository.listAll())[0]?.dueDate).toBeNull()
  })

  it('Should drop the linked task when the project of the todo changes', async () => {
    await seedProject('gateway')
    await repository.create(buildNewTodo({ projectId: 'gateway' }))
    await repository.setProject('td-1', null)

    const todo = (await repository.listAll())[0]

    expect(todo?.projectId).toBeNull()
    expect(todo?.taskId).toBeNull()
  })

  it('Should order the todos by due date, with the ones without a date last', async () => {
    await repository.create(buildNewTodo({ id: 'a', dueDate: null }))
    await repository.create(buildNewTodo({ id: 'b', dueDate: '2026-09-10' }))
    await repository.create(buildNewTodo({ id: 'c', dueDate: '2026-09-01' }))

    expect((await repository.listAll()).map((todo) => todo.id)).toEqual(['c', 'b', 'a'])
  })

  it('Should read the recurrences turning the active flag into a boolean', async () => {
    await gateway.executeBatch([
      {
        query:
          'INSERT INTO todo_recurrence (id, title, rule, quantity, last_generated_at, active) VALUES (?, ?, ?, ?, ?, ?)',
        values: ['rec-1', 'Revisão semanal', 'semanal-seg', 1, '2026-08-31T08:00:00Z', 0],
      },
    ])

    expect(await repository.listRecurrences()).toEqual([
      {
        id: 'rec-1',
        title: 'Revisão semanal',
        rule: 'semanal-seg',
        quantity: 1,
        lastGeneratedAt: '2026-08-31T08:00:00Z',
        active: false,
      },
    ])
  })
})
