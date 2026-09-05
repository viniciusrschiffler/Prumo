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
  it('vai até o domingo da semana corrente, como o "até 06/09" do design', () => {
    expect(endOfCurrentWeek(CONTEXT)).toBe('2026-09-06')
  })

  it('acompanha a preferência de início de semana', () => {
    expect(endOfCurrentWeek({ today: '2026-09-03', weekStart: 'sunday' })).toBe('2026-09-05')
  })
})

describe('classifyDue', () => {
  it('separa atrasado, hoje, esta semana, depois e sem data', () => {
    expect(classifyDue('2026-08-30', CONTEXT)).toBe('late')
    expect(classifyDue('2026-09-03', CONTEXT)).toBe('today')
    expect(classifyDue('2026-09-06', CONTEXT)).toBe('week')
    expect(classifyDue('2026-09-07', CONTEXT)).toBe('later')
    expect(classifyDue(null, CONTEXT)).toBe('none')
  })
})

describe('groupTodos por vencimento', () => {
  it('ordena os grupos e omite os vazios', () => {
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

  it('separa o concluído de hoje do concluído em outro dia', () => {
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

  it('ordena por data, depois por prioridade e por título', () => {
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

  it('joga o sem data para o fim da ordenação dentro do grupo', () => {
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

describe('groupTodos por projeto', () => {
  it('segue a ordem dos projetos e fecha com Sem projeto', () => {
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

  it('recolhe em Sem projeto o todo preso a projeto arquivado', () => {
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

describe('groupTodos por prioridade', () => {
  it('vai de P0 a P3 e omite as prioridades sem item', () => {
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
