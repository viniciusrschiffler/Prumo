import { describe, expect, it } from 'vitest'
import { buildTodo } from '@/domain/testing/todoBuilders'
import { buildTodoCompletion, snoozeDueDate } from './todoEdits'

const TODAY = '2026-09-03'

describe('snoozeDueDate', () => {
  it('Should move what has no date to tomorrow', () => {
    expect(snoozeDueDate(null, TODAY)).toBe('2026-09-04')
  })

  it('Should move what is late to tomorrow instead of landing in the past', () => {
    expect(snoozeDueDate('2026-08-20', TODAY)).toBe('2026-09-04')
    expect(snoozeDueDate(TODAY, TODAY)).toBe('2026-09-04')
  })

  it('Should push what still has time by one day', () => {
    expect(snoozeDueDate('2026-09-10', TODAY)).toBe('2026-09-11')
  })
})

describe('buildTodoCompletion', () => {
  it('Should complete stamping the time', () => {
    expect(buildTodoCompletion(buildTodo(), '2026-09-03T12:00:00Z')).toEqual({
      status: 'done',
      completedAt: '2026-09-03T12:00:00Z',
    })
  })

  it('Should reopen into progress, clearing the time the table refuses outside done', () => {
    const done = buildTodo({ status: 'done', completedAt: '2026-09-01T17:30:00Z' })

    expect(buildTodoCompletion(done, '2026-09-03T12:00:00Z')).toEqual({
      status: 'in_progress',
      completedAt: null,
    })
  })
})
