import { describe, expect, it } from 'vitest'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import type { NewTodoDraft } from './newTodo'
import { buildNewTodo, previewTodoGroup, validateNewTodo } from './newTodo'
import type { TodoGroupingContext } from './todoGrouping'

const CONTEXT: TodoGroupingContext = { today: '2026-09-03', weekStart: 'monday' }

const NOW = '2026-09-03T12:00:00Z'

const PROJECTS = [
  buildProject({ id: 'gateway', name: 'Migração do gateway' }),
  buildProject({ id: 'parceiro', name: 'Portal do parceiro' }),
]

function buildDraft(overrides: Partial<NewTodoDraft> = {}): NewTodoDraft {
  return {
    title: 'Fechar escopo',
    description: '',
    projectId: null,
    dueDate: null,
    priority: 'P2',
    status: 'open',
    tagNames: [],
    ...overrides,
  }
}

describe('validateNewTodo', () => {
  it('Should require a title', () => {
    expect(validateNewTodo(buildDraft({ title: '   ' })).title).toBeDefined()
    expect(validateNewTodo(buildDraft())).toEqual({})
  })
})

describe('buildNewTodo', () => {
  it('Should trim the texts and turn an empty description into null', () => {
    const todo = buildNewTodo(
      buildDraft({ title: '  Fechar escopo  ', description: '   ' }),
      { todoId: 'td-1', tagIds: [], now: NOW },
    )

    expect(todo.title).toBe('Fechar escopo')
    expect(todo.description).toBeNull()
  })

  it('Should drop a repeated or empty tag before handing out identifiers', () => {
    const todo = buildNewTodo(
      buildDraft({ tagNames: ['infra', ' infra ', '', 'pagamentos'] }),
      { todoId: 'td-1', tagIds: ['tag-1', 'tag-2'], now: NOW },
    )

    expect(todo.tags).toEqual([
      { id: 'tag-1', name: 'infra' },
      { id: 'tag-2', name: 'pagamentos' },
    ])
  })
})

describe('previewTodoGroup', () => {
  it('Should use the due date when grouping by due date', () => {
    expect(
      previewTodoGroup(buildDraft({ dueDate: '2026-08-30' }), 'due', CONTEXT, PROJECTS),
    ).toEqual({ kind: 'due', bucket: 'late' })

    expect(previewTodoGroup(buildDraft(), 'due', CONTEXT, PROJECTS)).toEqual({
      kind: 'due',
      bucket: 'none',
    })
  })

  it('Should use the linked project and the priority in the other groupings', () => {
    expect(
      previewTodoGroup(buildDraft({ projectId: 'gateway' }), 'project', CONTEXT, PROJECTS),
    ).toEqual({ kind: 'project', project: PROJECTS[0] })

    expect(
      previewTodoGroup(buildDraft({ priority: 'P0' }), 'priority', CONTEXT, PROJECTS),
    ).toEqual({ kind: 'priority', priority: 'P0' })
  })
})
