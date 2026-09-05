import { beforeAll, describe, expect, it } from 'vitest'
import type { DatabaseSync } from 'node:sqlite'
import { DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readTodosSnapshot } from '@/domain/testing/todoSeedReaders'
import { groupTodos, type TodoGroupingContext } from './todoGrouping'
import {
  buildTodoRows,
  listProjectsWithPhase,
  listTodoRecurrences,
  type TodosSnapshot,
} from './todoRow'
import { parseRecurrenceRule } from './todoRecurrence'
import { countOpenTodosByProject, summarizeTodos } from './todoSummary'

const CONTEXT: TodoGroupingContext = { today: DESIGN_TODAY, weekStart: 'monday' }

let database: DatabaseSync
let snapshot: TodosSnapshot

beforeAll(() => {
  database = openSeedDatabase()
  snapshot = readTodosSnapshot(database)
})

describe('a tela de TodoList sobre o seed', () => {
  it('resume o cabeçalho e o painel lateral', () => {
    expect(summarizeTodos(buildTodoRows(snapshot), CONTEXT)).toEqual({
      open: 7,
      late: 1,
      linkedToProject: 5,
      withoutProject: 2,
      doneThisWeek: 1,
    })
  })

  it('agrupa por vencimento sem revelar os concluídos', () => {
    const rows = buildTodoRows(snapshot).filter((row) => row.todo.status === 'open')
    const groups = groupTodos(rows, 'due', CONTEXT, listProjectsWithPhase(snapshot))

    expect(groups.map((group) => [group.id, group.items.length])).toEqual([
      ['due-late', 1],
      ['due-today', 4],
      ['due-later', 2],
    ])
  })

  it('manda o concluído de 01/09 para o grupo dos concluídos antes de hoje', () => {
    const groups = groupTodos(
      buildTodoRows(snapshot),
      'due',
      CONTEXT,
      listProjectsWithPhase(snapshot),
    )

    expect(groups.find((group) => group.id === 'due-doneToday')).toBeUndefined()
    expect(groups.find((group) => group.id === 'due-doneBefore')?.items).toHaveLength(1)
  })

  it('conta os abertos por projeto, com o cancelado arquivado fora da lista', () => {
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

  it('lê a única recorrente ativa do seed', () => {
    const recurrences = listTodoRecurrences(snapshot)

    expect(recurrences).toHaveLength(1)
    expect(recurrences[0]?.title).toBe('Revisão semanal de capacidade')
    expect(recurrences[0]?.quantity).toBe(1)
    expect(recurrences[0]?.lastGeneratedAt).toBe('2026-08-31T08:00:00Z')
    expect(parseRecurrenceRule(recurrences[0]?.rule ?? '')?.weekday).toBe('monday')
  })

  it('herda a cor da fase corrente do projeto em cada linha', () => {
    const row = buildTodoRows(snapshot).find((current) => current.todo.id === 'td-escopo')

    expect(row?.project?.name).toBe('Migração do gateway')
    expect(row?.phase?.id).toBe('development')
    expect(row?.tags.map((tag) => tag.name)).toEqual(['pagamentos'])
  })
})
