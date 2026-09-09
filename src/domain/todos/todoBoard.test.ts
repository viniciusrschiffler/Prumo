import { describe, expect, it } from 'vitest'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { buildTodoRow } from '@/domain/testing/todoBuilders'
import { buildTodoBoard } from './todoBoard'
import type { TodoGroupingContext } from './todoGrouping'
import type { ProjectWithPhase } from './todoRow'

const CONTEXT: TodoGroupingContext = { today: '2026-09-03', weekStart: 'monday' }

const PROJECTS: ProjectWithPhase[] = [
  { project: buildProject({ id: 'gateway', name: 'Migração do gateway' }), phase: null },
]

const ROWS = [
  buildTodoRow({ id: 'td-1', status: 'in_progress', dueDate: '2026-09-03' }),
  buildTodoRow({ id: 'td-2', status: 'open', dueDate: null }),
]

describe('buildTodoBoard', () => {
  it('Should keep the four status columns standing even with nobody in them', () => {
    const columns = buildTodoBoard(ROWS, 'status', CONTEXT, PROJECTS)

    expect(columns.map((column) => [column.group.id, column.group.items.length])).toEqual([
      ['status-open', 1],
      ['status-in_progress', 1],
      ['status-blocked', 0],
      ['status-done', 0],
    ])
  })

  it('Should write the field of the grouping in place, which is what the drag promises', () => {
    const byStatus = buildTodoBoard(ROWS, 'status', CONTEXT, PROJECTS)
    const byPriority = buildTodoBoard(ROWS, 'priority', CONTEXT, PROJECTS)
    const byProject = buildTodoBoard(ROWS, 'project', CONTEXT, PROJECTS)

    expect(byStatus[2]?.drop).toEqual({ kind: 'status', status: 'blocked' })
    expect(byPriority[0]?.drop).toEqual({ kind: 'priority', priority: 'P0' })
    expect(byProject[0]?.drop).toEqual({ kind: 'project', projectId: 'gateway' })
    expect(byProject[1]?.drop).toEqual({ kind: 'project', projectId: null })
  })

  it('Should turn each due column into the date that lands the card there', () => {
    const columns = buildTodoBoard(ROWS, 'due', CONTEXT, PROJECTS)
    const dropOf = (id: string) => columns.find((column) => column.group.id === id)?.drop

    expect(dropOf('due-today')).toEqual({ kind: 'due', dueDate: '2026-09-03' })
    expect(dropOf('due-week')).toEqual({ kind: 'due', dueDate: '2026-09-06' })
    expect(dropOf('due-later')).toEqual({ kind: 'due', dueDate: '2026-09-07' })
    expect(dropOf('due-none')).toEqual({ kind: 'due', dueDate: null })
  })

  // Nada torna um item atrasado por escolha, e "Concluídos antes" é uma data que já passou:
  // as duas colunas só existem quando têm o que mostrar, e nunca recebem um card.
  it('Should drop the empty columns nobody can drag into', () => {
    const columns = buildTodoBoard(ROWS, 'due', CONTEXT, PROJECTS)

    expect(columns.map((column) => column.group.id)).toEqual([
      'due-today',
      'due-week',
      'due-later',
      'due-none',
      'due-doneToday',
    ])
    expect(columns.at(-1)?.drop).toEqual({ kind: 'status', status: 'done' })
  })

  it('Should keep the late column when something is actually late, still refusing the drop', () => {
    const late = [...ROWS, buildTodoRow({ id: 'td-3', dueDate: '2026-08-30' })]
    const columns = buildTodoBoard(late, 'due', CONTEXT, PROJECTS)

    expect(columns[0]?.group.id).toBe('due-late')
    expect(columns[0]?.drop).toBeNull()
  })
})
