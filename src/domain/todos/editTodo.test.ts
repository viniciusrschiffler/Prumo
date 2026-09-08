import { describe, expect, it } from 'vitest'
import { buildTodo } from '@/domain/testing/todoBuilders'
import { buildTodoUpdate, toTodoDraft } from './editTodo'

describe('toTodoDraft', () => {
  it('Should fill the form with what the todo already has', () => {
    const todo = buildTodo({ description: 'Com o jurídico.', projectId: 'gateway' })

    expect(toTodoDraft({ todo, tagNames: ['1:1'] })).toEqual({
      title: 'Fechar escopo',
      description: 'Com o jurídico.',
      projectId: 'gateway',
      dueDate: '2026-09-03',
      priority: 'P2',
      tagNames: ['1:1'],
    })
  })
})

describe('buildTodoUpdate', () => {
  it('Should keep the linked task while the project stays the same', () => {
    const todo = buildTodo({ projectId: 'gateway', taskId: 'task-1' })
    const draft = toTodoDraft({ todo, tagNames: [] })

    expect(buildTodoUpdate(todo, draft, []).taskId).toBe('task-1')
  })

  it('Should release the task when the project changes, as the link modal does', () => {
    const todo = buildTodo({ projectId: 'gateway', taskId: 'task-1' })
    const draft = { ...toTodoDraft({ todo, tagNames: [] }), projectId: 'portal' }

    expect(buildTodoUpdate(todo, draft, []).taskId).toBeNull()
  })

  it('Should trim the title and turn a blank description into no description', () => {
    const todo = buildTodo()
    const draft = {
      ...toTodoDraft({ todo, tagNames: [] }),
      title: '  Fechar  ',
      description: '  ',
    }
    const update = buildTodoUpdate(todo, draft, [])

    expect(update.title).toBe('Fechar')
    expect(update.description).toBeNull()
  })

  it('Should take an identifier for each tag that survived the cleanup', () => {
    const todo = buildTodo()
    const draft = { ...toTodoDraft({ todo, tagNames: [] }), tagNames: ['infra', ' infra ', ''] }

    expect(buildTodoUpdate(todo, draft, ['tag-1']).tags).toEqual([
      { id: 'tag-1', name: 'infra' },
    ])
  })
})
