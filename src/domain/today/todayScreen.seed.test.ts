import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { readTodosSnapshot } from '@/domain/testing/todoSeedReaders'
import type { TodosSnapshot } from '@/domain/todos/todoRow'
import { findConsistencyAlerts, type ConsistencyAlert } from './consistencyAlerts'
import { findPendingDecisions, type PendingDecision } from './pendingDecisions'
import { buildTodayAgenda, countTodayItems, type TodayAgenda } from './todayAgenda'
import { summarizeWeek, type WeekNumbers } from './weekNumbers'

const STALE_AFTER_DAYS = 14

let projects: ProjectsSnapshot
let todos: TodosSnapshot
let agenda: TodayAgenda
let decisions: PendingDecision[]
let alerts: ConsistencyAlert[]
let week: WeekNumbers

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  projects = readProjectsSnapshot(database)
  todos = readTodosSnapshot(database)
  decisions = findPendingDecisions({
    projects: projects.projects,
    tasks: projects.tasks,
    events: projects.events,
    allocations: projects.allocations,
    people: projects.people,
    today: DESIGN_TODAY,
  })
  alerts = findConsistencyAlerts({
    projects: projects.projects,
    tasks: projects.tasks,
    events: projects.events,
    notes: projects.notes,
    allocations: projects.allocations,
    people: projects.people,
    today: DESIGN_TODAY,
    weekStart: 'monday',
    staleAfterDays: STALE_AFTER_DAYS,
  })
  week = summarizeWeek({
    projects: projects.projects,
    events: projects.events,
    allocations: projects.allocations,
    people: projects.people,
    todos: todos.todos,
    today: DESIGN_TODAY,
    weekStart: 'monday',
  })
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

    expect(cutover?.assignments).toEqual([])
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

describe('Esperando sua decisão sobre o seed', () => {
  it('Should raise the two cards the design draws', () => {
    expect(decisions.map((decision) => [decision.project.id, decision.kind])).toEqual([
      ['parceiro', 'blocked'],
      ['campo', 'paused'],
    ])
  })

  it('Should hold the partner portal blocked for twenty three days', () => {
    expect(decisions[0]?.sinceDays).toBe(23)
    expect(decisions[0]?.blockEvent?.title).toBe('Aguardando validação jurídica do contrato')
  })

  it('Should say the expected resume expired eight days ago', () => {
    expect(decisions[0]?.expectedResumeAt).toBe('2026-08-26')
    expect(decisions[0]?.overdueResumeDays).toBe(8)
  })

  it('Should hold the field app paused for six days with Marcos still on it', () => {
    expect(decisions[1]?.sinceDate).toBe('2026-08-28')
    expect(decisions[1]?.sinceDays).toBe(6)
    expect(decisions[1]?.allocatedPeople.map((entry) => [entry.person.name, entry.percentage]))
      .toEqual([['Marcos Teles', 30]])
  })
})

describe('Alertas de consistência sobre o seed', () => {
  it('Should raise two alerts, not the three of the mockup', () => {
    expect(alerts.map((alert) => alert.kind)).toEqual(['unassigned', 'stale'])
  })

  it('Should stay quiet about Rafael, whose overload ended in June', () => {
    expect(alerts.some((alert) => alert.kind === 'overload')).toBe(false)
  })

  it('Should point at the cutover window starting today without anybody', () => {
    const unassigned = alerts.find((alert) => alert.kind === 'unassigned')

    expect(unassigned?.tasks.map((entry) => entry.task.id)).toEqual(['ob-cut'])
  })

  it('Should count eighteen idle days on Observabilidade, as the design prints', () => {
    const stale = alerts.find((alert) => alert.kind === 'stale')

    expect(stale?.project.id).toBe('observabilidade')
    expect(stale?.lastActivityDate).toBe('2026-08-16')
    expect(stale?.idleDays).toBe(18)
  })
})

describe('Semana em números sobre o seed', () => {
  it('Should open on the week 36 the header prints', () => {
    expect(week.weekNumber).toBe(36)
    expect(week.period).toEqual({ start: '2026-08-31', end: '2026-09-06' })
  })

  it('Should spend 49h of the 110h the active team has, not the 94% of the mockup', () => {
    expect(week.usedHours).toBe(49)
    expect(week.capacityHours).toBe(110)
    expect(week.capacityUsedPercentage).toBe(45)
  })

  it('Should count three blocked days, from monday to today, not the five of the mockup', () => {
    expect(week.blockedDays).toBe(3)
  })

  it('Should count one event and one todo finished, not the seven and the twelve', () => {
    expect(week.eventCount).toBe(1)
    expect(week.completedTodoCount).toBe(1)
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
