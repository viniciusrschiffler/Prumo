import { describe, expect, it } from 'vitest'
import { buildTodoRow } from '@/domain/testing/todoBuilders'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import {
  classifyDue,
  endOfCurrentWeek,
  groupTodos,
  type TodoGroupingContext,
} from './todoGrouping'
import type { ProjectWithPhase } from './todoRow'

const CONTEXT: TodoGroupingContext = { today: '2026-09-03', weekStart: 'monday' }

const PROJECTS: ProjectWithPhase[] = [
  { project: buildProject({ id: 'gateway', name: 'Migração do gateway' }), phase: null },
  { project: buildProject({ id: 'parceiro', name: 'Portal do parceiro' }), phase: null },
]

describe('endOfCurrentWeek', () => {
  it('Should reach the Sunday of the current week, the "até 06/09" of the design', () => {
    expect(endOfCurrentWeek(CONTEXT)).toBe('2026-09-06')
  })

  it('Should follow the first weekday preference', () => {
    expect(endOfCurrentWeek({ today: '2026-09-03', weekStart: 'sunday' })).toBe('2026-09-05')
  })
})

describe('classifyDue', () => {
  it('Should split late, today, this week, later and without a date', () => {
    expect(classifyDue('2026-08-30', CONTEXT)).toBe('late')
    expect(classifyDue('2026-09-03', CONTEXT)).toBe('today')
    expect(classifyDue('2026-09-06', CONTEXT)).toBe('week')
    expect(classifyDue('2026-09-07', CONTEXT)).toBe('later')
    expect(classifyDue(null, CONTEXT)).toBe('none')
  })
})

describe('groupTodos by due date', () => {
  it('Should order the groups and leave out the empty ones', () => {
    const groups = groupTodos(
      [
        buildTodoRow({ id: 'a', dueDate: '2026-09-20' }),
        buildTodoRow({ id: 'b', dueDate: '2026-08-30' }),
        buildTodoRow({ id: 'c', dueDate: '2026-09-03' }),
      ],
      'due',
      CONTEXT,
      PROJECTS,
    )

    expect(groups.map((group) => group.id)).toEqual(['due-late', 'due-today', 'due-later'])
  })

  it('Should split what was completed today from what was completed before', () => {
    const groups = groupTodos(
      [
        buildTodoRow({
          id: 'hoje',
          status: 'done',
          completedAt: '2026-09-03T10:00:00Z',
        }),
        buildTodoRow({
          id: 'antes',
          status: 'done',
          completedAt: '2026-09-01T17:30:00Z',
        }),
      ],
      'due',
      CONTEXT,
      PROJECTS,
    )

    expect(groups.map((group) => group.id)).toEqual(['due-doneToday', 'due-doneBefore'])
  })

  it('Should order by date, then by priority and by title', () => {
    const groups = groupTodos(
      [
        buildTodoRow({ id: 'p2', dueDate: '2026-09-03', priority: 'P2', title: 'Bravo' }),
        buildTodoRow({ id: 'p0', dueDate: '2026-09-03', priority: 'P0', title: 'Zulu' }),
        buildTodoRow({ id: 'outro', dueDate: '2026-09-03', priority: 'P2', title: 'Alfa' }),
      ],
      'due',
      CONTEXT,
      PROJECTS,
    )

    expect(groups[0]?.items.map((row) => row.todo.id)).toEqual(['p0', 'outro', 'p2'])
  })

  it('Should push what has no date to the end of the group', () => {
    const groups = groupTodos(
      [buildTodoRow({ id: 'sem', dueDate: null }), buildTodoRow({ id: 'com', dueDate: null })],
      'due',
      CONTEXT,
      PROJECTS,
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.id).toBe('due-none')
  })
})

describe('groupTodos by project', () => {
  it('Should follow the project order and close with the group without a project', () => {
    const groups = groupTodos(
      [
        buildTodoRow({ id: 'a', projectId: 'parceiro' }),
        buildTodoRow({ id: 'b', projectId: null }),
        buildTodoRow({ id: 'c', projectId: 'gateway' }),
      ],
      'project',
      CONTEXT,
      PROJECTS,
    )

    expect(groups.map((group) => group.id)).toEqual([
      'project-gateway',
      'project-parceiro',
      'project-sem-projeto',
    ])
  })

  it('Should gather a todo of an archived project in the group without a project', () => {
    const groups = groupTodos(
      [buildTodoRow({ id: 'a', projectId: 'erp' })],
      'project',
      CONTEXT,
      PROJECTS,
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.id).toBe('project-sem-projeto')
  })
})

describe('groupTodos by priority', () => {
  it('Should go from P0 to P3 and leave out the priorities without any item', () => {
    const groups = groupTodos(
      [
        buildTodoRow({ id: 'a', priority: 'P3' }),
        buildTodoRow({ id: 'b', priority: 'P0' }),
      ],
      'priority',
      CONTEXT,
      PROJECTS,
    )

    expect(groups.map((group) => group.id)).toEqual(['priority-P0', 'priority-P3'])
  })
})

describe('groupTodos by status', () => {
  it('Should order the columns as the board does and drop the empty ones from the list', () => {
    const rows = [
      buildTodoRow({ id: 'td-1', status: 'blocked' }),
      buildTodoRow({ id: 'td-2', status: 'open' }),
      buildTodoRow({ id: 'td-3', status: 'done', completedAt: '2026-09-03T12:00:00Z' }),
    ]

    expect(groupTodos(rows, 'status', CONTEXT, PROJECTS).map((group) => group.id)).toEqual([
      'status-open',
      'status-blocked',
      'status-done',
    ])
  })

  // O cancelado não é coluna do quadro, e inventar uma para ele seria dar status a algo que
  // nenhuma ação do app escreve.
  it('Should leave the cancelled one out of every column', () => {
    const rows = [buildTodoRow({ id: 'td-1', status: 'cancelled' })]

    expect(groupTodos(rows, 'status', CONTEXT, PROJECTS)).toEqual([])
  })
})
