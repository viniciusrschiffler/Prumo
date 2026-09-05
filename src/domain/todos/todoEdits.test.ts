import { describe, expect, it } from 'vitest'
import { buildTodo } from '@/domain/testing/todoBuilders'
import { buildTodoCompletion, snoozeDueDate } from './todoEdits'

const TODAY = '2026-09-03'

describe('snoozeDueDate', () => {
  it('leva para amanhã o que não tem data', () => {
    expect(snoozeDueDate(null, TODAY)).toBe('2026-09-04')
  })

  it('leva para amanhã o que venceu, sem parar no passado', () => {
    expect(snoozeDueDate('2026-08-20', TODAY)).toBe('2026-09-04')
    expect(snoozeDueDate(TODAY, TODAY)).toBe('2026-09-04')
  })

  it('empurra um dia o que ainda tem prazo', () => {
    expect(snoozeDueDate('2026-09-10', TODAY)).toBe('2026-09-11')
  })
})

describe('buildTodoCompletion', () => {
  it('conclui carimbando a hora', () => {
    expect(buildTodoCompletion(buildTodo(), '2026-09-03T12:00:00Z')).toEqual({
      status: 'done',
      completedAt: '2026-09-03T12:00:00Z',
    })
  })

  it('reabre limpando a hora, porque a tabela recusa concluído sem data', () => {
    const done = buildTodo({ status: 'done', completedAt: '2026-09-01T17:30:00Z' })

    expect(buildTodoCompletion(done, '2026-09-03T12:00:00Z')).toEqual({
      status: 'open',
      completedAt: null,
    })
  })
})
