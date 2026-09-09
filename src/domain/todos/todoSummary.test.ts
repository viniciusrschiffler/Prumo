import { describe, expect, it } from 'vitest'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { buildTodoRow } from '@/domain/testing/todoBuilders'
import type { TodoGroupingContext } from './todoGrouping'
import type { ProjectWithPhase } from './todoRow'
import {
  countOpenTodosByProject,
  countTodosByStatus,
  listTagsInUse,
  summarizeTodos,
} from './todoSummary'

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
  it('Should count only what is open, apart from the completed ones', () => {
    expect(summarizeTodos(ROWS, CONTEXT)).toEqual({
      open: 4,
      inProgress: 0,
      blocked: 0,
      late: 1,
      linkedToProject: 3,
      withoutProject: 1,
      doneThisWeek: 1,
    })
  })

  it('Should limit the completed ones to the current week, as the section title promises', () => {
    expect(summarizeTodos(ROWS, { today: '2026-08-27', weekStart: 'monday' }).doneThisWeek).toBe(1)
  })
})

describe('countOpenTodosByProject', () => {
  it('Should order by load and keep the group without a project last', () => {
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

describe('listTagsInUse', () => {
  const tags = [
    { id: 'infra', name: 'infra' },
    { id: 'pagamentos', name: 'pagamentos' },
    { id: 'mobile', name: 'mobile' },
  ]

  it('Should leave out the tag no todo carries', () => {
    const rows = [
      buildTodoRow({ id: 'a' }, { tags: [tags[1]!] }),
      buildTodoRow({ id: 'b' }, { tags: [tags[0]!, tags[1]!] }),
    ]

    expect(listTagsInUse(rows, tags)).toEqual([tags[0], tags[1]])
  })

  it('Should return nothing when no todo has a tag', () => {
    expect(listTagsInUse([buildTodoRow()], tags)).toEqual([])
  })
})

describe('countTodosByStatus', () => {
  it('Should count the whole board, in the order the columns stand', () => {
    const rows = [
      buildTodoRow({ id: 'td-1', status: 'blocked' }),
      buildTodoRow({ id: 'td-2', status: 'in_progress' }),
      buildTodoRow({ id: 'td-3', status: 'in_progress' }),
      buildTodoRow({ id: 'td-4', status: 'cancelled' }),
    ]

    expect(countTodosByStatus(rows)).toEqual([
      { status: 'open', count: 0 },
      { status: 'in_progress', count: 2 },
      { status: 'blocked', count: 1 },
      { status: 'done', count: 0 },
    ])
  })
})
