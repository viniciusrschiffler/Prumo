import { beforeAll, describe, expect, it } from 'vitest'
import type { DatabaseSync } from 'node:sqlite'
import { DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readTodosSnapshot } from '@/domain/testing/todoSeedReaders'
import { buildTodoBoard } from './todoBoard'
import { groupTodos, type TodoGroupingContext } from './todoGrouping'
import {
  buildTodoRows,
  listProjectsWithPhase,
  listTodoRecurrences,
  type TodosSnapshot,
} from './todoRow'
import { parseRecurrenceRule } from './todoRecurrence'
import {
  countOpenTodosByProject,
  countTodosByStatus,
  listTagsInUse,
  summarizeTodos,
} from './todoSummary'

const CONTEXT: TodoGroupingContext = { today: DESIGN_TODAY, weekStart: 'monday' }

let database: DatabaseSync
let snapshot: TodosSnapshot

beforeAll(() => {
  database = openSeedDatabase()
  snapshot = readTodosSnapshot(database)
})

describe('the TodoList screen over the seed', () => {
  it('Should summarize the header and the side panel', () => {
    expect(summarizeTodos(buildTodoRows(snapshot), CONTEXT)).toEqual({
      open: 7,
      inProgress: 2,
      blocked: 2,
      late: 1,
      linkedToProject: 5,
      withoutProject: 2,
      doneThisWeek: 1,
    })
  })

  it('Should group by due date without revealing the completed ones', () => {
    const rows = buildTodoRows(snapshot).filter((row) => row.todo.status !== 'done')
    const groups = groupTodos(rows, 'due', CONTEXT, listProjectsWithPhase(snapshot))

    expect(groups.map((group) => [group.id, group.items.length])).toEqual([
      ['due-late', 1],
      ['due-today', 4],
      ['due-later', 2],
    ])
  })

  it('Should send the todo completed on 01/09 to the group completed before today', () => {
    const groups = groupTodos(
      buildTodoRows(snapshot),
      'due',
      CONTEXT,
      listProjectsWithPhase(snapshot),
    )

    expect(groups.find((group) => group.id === 'due-doneToday')).toBeUndefined()
    expect(groups.find((group) => group.id === 'due-doneBefore')?.items).toHaveLength(1)
  })

  it('Should count the open ones by project, with the archived cancelled one out of the list', () => {
    const counts = countOpenTodosByProject(
      buildTodoRows(snapshot),
      listProjectsWithPhase(snapshot),
    )

    expect(counts.map((entry) => [entry.project?.name ?? 'Sem projeto', entry.openCount])).toEqual([
      ['Migração do gateway', 2],
      ['Portal do parceiro', 2],
      ['App de campo v2', 1],
      ['Observabilidade', 0],
      ['Sem projeto', 2],
    ])
  })

  it('Should offer as a filter only the tags some todo carries', () => {
    expect(
      listTagsInUse(buildTodoRows(snapshot), snapshot.tags).map((tag) => tag.name),
    ).toEqual(['observabilidade', 'pagamentos', 'parceiro'])
  })

  it('Should read the only active recurrence of the seed', () => {
    const recurrences = listTodoRecurrences(snapshot)

    expect(recurrences).toHaveLength(1)
    expect(recurrences[0]?.title).toBe('Revisão semanal de capacidade')
    expect(recurrences[0]?.quantity).toBe(1)
    expect(recurrences[0]?.lastGeneratedAt).toBe('2026-08-31T08:00:00Z')
    expect(parseRecurrenceRule(recurrences[0]?.rule ?? '')?.weekday).toBe('monday')
  })

  it('Should inherit the current phase of the project in each row', () => {
    const row = buildTodoRows(snapshot).find((current) => current.todo.id === 'td-escopo')

    expect(row?.project?.name).toBe('Migração do gateway')
    expect(row?.phase?.id).toBe('development')
    expect(row?.tags.map((tag) => tag.name)).toEqual(['pagamentos'])
  })
})

describe('the Kanban over the seed', () => {
  it('Should spread the eight todos over the four columns', () => {
    expect(countTodosByStatus(buildTodoRows(snapshot))).toEqual([
      { status: 'open', count: 3 },
      { status: 'in_progress', count: 2 },
      { status: 'blocked', count: 2 },
      { status: 'done', count: 1 },
    ])
  })

  it('Should stand the four columns up even before anything is dragged', () => {
    const board = buildTodoBoard(
      buildTodoRows(snapshot),
      'status',
      CONTEXT,
      listProjectsWithPhase(snapshot),
    )

    expect(board.map((column) => [column.group.id, column.group.items.length])).toEqual([
      ['status-open', 3],
      ['status-in_progress', 2],
      ['status-blocked', 2],
      ['status-done', 1],
    ])
    expect(board.every((column) => column.drop !== null)).toBe(true)
  })

  // Cada projeto não arquivado é coluna, mesmo sem todo nenhum, senão não haveria para onde
  // arrastar um card que ainda não pertence a ele.
  it('Should give every unarchived project a column when the grouping is by project', () => {
    const board = buildTodoBoard(
      buildTodoRows(snapshot),
      'project',
      CONTEXT,
      listProjectsWithPhase(snapshot),
    )

    expect(board.map((column) => column.group.id)).toEqual([
      'project-campo',
      'project-gateway',
      'project-observabilidade',
      'project-parceiro',
      'project-sem-projeto',
    ])
  })
})
