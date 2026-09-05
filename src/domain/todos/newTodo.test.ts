import { describe, expect, it } from 'vitest'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import type { NewTodoDraft } from './newTodo'
import { buildNewTodo, previewTodoGroup, validateNewTodo } from './newTodo'
import type { TodoGroupingContext } from './todoGrouping'

const CONTEXT: TodoGroupingContext = { today: '2026-09-03', weekStart: 'monday' }

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
    tagNames: [],
    ...overrides,
  }
}

describe('validateNewTodo', () => {
  it('exige título', () => {
    expect(validateNewTodo(buildDraft({ title: '   ' })).title).toBeDefined()
    expect(validateNewTodo(buildDraft())).toEqual({})
  })
})

describe('buildNewTodo', () => {
  it('apara os textos e transforma descrição vazia em nulo', () => {
    const todo = buildNewTodo(
      buildDraft({ title: '  Fechar escopo  ', description: '   ' }),
      { todoId: 'td-1', tagIds: [] },
    )

    expect(todo.title).toBe('Fechar escopo')
    expect(todo.description).toBeNull()
  })

  it('remove tag repetida e vazia antes de gerar identificador', () => {
    const todo = buildNewTodo(
      buildDraft({ tagNames: ['infra', ' infra ', '', 'pagamentos'] }),
      { todoId: 'td-1', tagIds: ['tag-1', 'tag-2'] },
    )

    expect(todo.tags).toEqual([
      { id: 'tag-1', name: 'infra' },
      { id: 'tag-2', name: 'pagamentos' },
    ])
  })
})

describe('previewTodoGroup', () => {
  it('usa a data limite no agrupamento por vencimento', () => {
    expect(
      previewTodoGroup(buildDraft({ dueDate: '2026-08-30' }), 'due', CONTEXT, PROJECTS),
    ).toEqual({ kind: 'due', bucket: 'late' })

    expect(previewTodoGroup(buildDraft(), 'due', CONTEXT, PROJECTS)).toEqual({
      kind: 'due',
      bucket: 'none',
    })
  })

  it('usa o projeto vinculado e a prioridade nos outros agrupamentos', () => {
    expect(
      previewTodoGroup(buildDraft({ projectId: 'gateway' }), 'project', CONTEXT, PROJECTS),
    ).toEqual({ kind: 'project', project: PROJECTS[0] })

    expect(
      previewTodoGroup(buildDraft({ priority: 'P0' }), 'priority', CONTEXT, PROJECTS),
    ).toEqual({ kind: 'priority', priority: 'P0' })
  })
})
