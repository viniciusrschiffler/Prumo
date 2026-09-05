import { describe, expect, it } from 'vitest'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { buildTodoRow } from '@/domain/testing/todoBuilders'
import type { TodoGroupingContext } from './todoGrouping'
import type { ProjectWithPhase } from './todoRow'
import { countOpenTodosByProject, summarizeTodos } from './todoSummary'

const CONTEXT: TodoGroupingContext = { today: '2026-09-03', weekStart: 'monday' }

const ROWS = [
  buildTodoRow({ id: 'a', dueDate: '2026-08-30', projectId: 'gateway' }),
  buildTodoRow({ id: 'b', dueDate: '2026-09-03', projectId: 'gateway' }),
  buildTodoRow({ id: 'c', dueDate: '2026-09-10', projectId: 'parceiro' }),
  buildTodoRow({ id: 'd', dueDate: null, projectId: null }),
  buildTodoRow({
    id: 'e',
    status: 'done',
    completedAt: '2026-09-01T17:30:00Z',
    projectId: 'parceiro',
  }),
  buildTodoRow({
    id: 'f',
    status: 'done',
    completedAt: '2026-08-24T09:00:00Z',
    projectId: 'parceiro',
  }),
]

const PROJECTS: ProjectWithPhase[] = [
  { project: buildProject({ id: 'gateway', name: 'Migração do gateway' }), phase: null },
  { project: buildProject({ id: 'parceiro', name: 'Portal do parceiro' }), phase: null },
  { project: buildProject({ id: 'campo', name: 'App de campo v2' }), phase: null },
]

describe('summarizeTodos', () => {
  it('conta apenas o que está em aberto, menos os concluídos', () => {
    expect(summarizeTodos(ROWS, CONTEXT)).toEqual({
      open: 4,
      late: 1,
      linkedToProject: 3,
      withoutProject: 1,
      doneThisWeek: 1,
    })
  })

  it('limita os concluídos à semana corrente, como o título da seção promete', () => {
    expect(summarizeTodos(ROWS, { today: '2026-08-27', weekStart: 'monday' }).doneThisWeek).toBe(1)
  })
})

describe('countOpenTodosByProject', () => {
  it('ordena por carga e mantém Sem projeto no fim', () => {
    expect(
      countOpenTodosByProject(ROWS, PROJECTS).map((entry) => [
        entry.project?.name ?? 'Sem projeto',
        entry.openCount,
      ]),
    ).toEqual([
      ['Migração do gateway', 2],
      ['Portal do parceiro', 1],
      ['App de campo v2', 0],
      ['Sem projeto', 1],
    ])
  })
})
