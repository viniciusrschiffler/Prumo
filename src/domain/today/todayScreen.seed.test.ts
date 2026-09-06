import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { readTodosSnapshot } from '@/domain/testing/todoSeedReaders'
import type { TodosSnapshot } from '@/domain/todos/todoRow'
import { buildTodayAgenda, countTodayItems, type TodayAgenda } from './todayAgenda'

let projects: ProjectsSnapshot
let todos: TodosSnapshot
let agenda: TodayAgenda

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  projects = readProjectsSnapshot(database)
  todos = readTodosSnapshot(database)
  agenda = buildTodayAgenda({
    todos: todos.todos,
    tasks: projects.tasks,
    projects: projects.projects,
    phases: projects.phases,
    people: projects.people,
    allocations: projects.allocations,
    today: DESIGN_TODAY,
  })
})

describe('Vencem hoje sobre o seed', () => {
  it('Should list five todos, not the four of the mockup', () => {
    expect(agenda.dueTodos).toHaveLength(5)
  })

  it('Should open with the contract todo, four days late, and close with the committee one', () => {
    expect(agenda.dueTodos.map((row) => row.todo.id)).toEqual([
      'td-contrato',
      'td-parceiro',
      'td-1a1',
      'td-escopo',
      'td-baseline',
    ])
  })

  it('Should have no todo completed today, so no struck row like the mockup draws', () => {
    expect(agenda.dueTodos.every((row) => row.todo.status === 'open')).toBe(true)
  })

  it('Should link each todo to its project and current phase', () => {
    const escopo = agenda.dueTodos.find((row) => row.todo.id === 'td-escopo')

    expect(escopo?.project?.name).toBe('Migração do gateway')
    expect(escopo?.phase?.id).toBe('development')
    expect(agenda.dueTodos.find((row) => row.todo.id === 'td-1a1')?.project).toBeNull()
  })
})

describe('Tarefas de hoje sobre o seed', () => {
  it('Should start two tasks, not the three of the mockup', () => {
    expect(agenda.starting.map((row) => row.task.id)).toEqual(['ac-roteiro', 'ob-cut'])
  })

  it('Should keep the estimated hours of the seed, not the ones the mockup prints', () => {
    expect(agenda.starting.map((row) => row.task.estimatedHours)).toEqual([60, 16])
  })

  it('Should leave the cutover without anybody allocated, as the alert says', () => {
    const cutover = agenda.starting.find((row) => row.task.id === 'ob-cut')

    expect(cutover?.people).toEqual([])
    expect(cutover?.hasOnlyEndedAllocations).toBe(false)
  })

  it('Should end five tasks, every one of them late, because none ends today', () => {
    expect(agenda.ending.map((row) => row.task.id)).toEqual([
      'pp-jur',
      'gw-rew',
      'gw-tes',
      'ob-inst',
      'ac-piloto',
    ])
    expect(agenda.ending.every((row) => row.kind === 'late')).toBe(true)
  })

  it('Should show the legal approval as everybody ended, the "0 · encerradas" of the design', () => {
    const legal = agenda.ending.find((row) => row.task.id === 'pp-jur')

    expect(legal?.hasOnlyEndedAllocations).toBe(true)
  })
})

describe('Contador da navegação sobre o seed', () => {
  it('Should count twelve items, not the nine of the mockup', () => {
    expect(
      countTodayItems({
        todos: todos.todos,
        tasks: projects.tasks,
        projects: projects.projects,
        today: DESIGN_TODAY,
      }),
    ).toBe(12)
  })
})
