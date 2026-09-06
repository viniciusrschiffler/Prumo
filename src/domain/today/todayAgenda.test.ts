import { describe, expect, it } from 'vitest'
import { buildAllocation, buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { buildTodo } from '@/domain/testing/todoBuilders'
import {
  buildTodayAgenda,
  countTodayItems,
  selectDueTodos,
  selectEndingTasks,
  selectStartingTasks,
  type TodayAgendaInput,
} from './todayAgenda'

const TODAY = '2026-09-03'

function buildInput(overrides: Partial<TodayAgendaInput> = {}): TodayAgendaInput {
  return {
    todos: [],
    tasks: [],
    projects: [buildProject({ id: 'project-1' })],
    phases: [],
    people: [],
    allocations: [],
    today: TODAY,
    ...overrides,
  }
}

describe('Todos que vencem hoje', () => {
  it('Should keep what is due today and what is already late', () => {
    const todos = [
      buildTodo({ id: 'hoje', dueDate: TODAY }),
      buildTodo({ id: 'atrasado', dueDate: '2026-08-30' }),
      buildTodo({ id: 'depois', dueDate: '2026-09-10' }),
      buildTodo({ id: 'sem-data', dueDate: null }),
    ]

    expect(selectDueTodos(todos, TODAY).map((todo) => todo.id)).toEqual(['atrasado', 'hoje'])
  })

  it('Should keep a todo completed today so ticking it does not hide the row', () => {
    const todos = [
      buildTodo({
        id: 'concluido-hoje',
        status: 'done',
        completedAt: `${TODAY}T14:02:00Z`,
      }),
      buildTodo({
        id: 'concluido-antes',
        status: 'done',
        completedAt: '2026-09-01T17:30:00Z',
      }),
    ]

    expect(selectDueTodos(todos, TODAY).map((todo) => todo.id)).toEqual(['concluido-hoje'])
  })

  it('Should sort the open ones by due date and priority, with the completed last', () => {
    const todos = [
      buildTodo({ id: 'concluido', status: 'done', completedAt: `${TODAY}T09:00:00Z` }),
      buildTodo({ id: 'hoje-p2', dueDate: TODAY, priority: 'P2' }),
      buildTodo({ id: 'hoje-p0', dueDate: TODAY, priority: 'P0' }),
      buildTodo({ id: 'atrasado', dueDate: '2026-08-30', priority: 'P3' }),
    ]

    expect(selectDueTodos(todos, TODAY).map((todo) => todo.id)).toEqual([
      'atrasado',
      'hoje-p0',
      'hoje-p2',
      'concluido',
    ])
  })

  it('Should ignore a cancelled todo', () => {
    const todos = [buildTodo({ id: 'cancelado', status: 'cancelled', dueDate: TODAY })]

    expect(selectDueTodos(todos, TODAY)).toEqual([])
  })
})

describe('Tarefas que começam hoje', () => {
  const projects = [buildProject({ id: 'project-1' })]

  it('Should take only what starts exactly today', () => {
    const tasks = [
      buildTask({ id: 'comeca', plannedStart: TODAY, plannedEnd: '2026-10-02' }),
      buildTask({ id: 'comecou', plannedStart: '2026-03-30', plannedEnd: '2026-10-02' }),
    ]

    expect(selectStartingTasks(tasks, projects, TODAY).map((task) => task.id)).toEqual(['comeca'])
  })

  it('Should ignore a done, a cancelled and an archived project task', () => {
    const tasks = [
      buildTask({ id: 'concluida', status: 'done', plannedStart: TODAY }),
      buildTask({ id: 'cancelada', status: 'cancelled', plannedStart: TODAY }),
      buildTask({ id: 'arquivada', projectId: 'erp', plannedStart: TODAY }),
    ]

    expect(
      selectStartingTasks(
        tasks,
        [...projects, buildProject({ id: 'erp', archivedAt: '2026-04-30T18:00:00Z' })],
        TODAY,
      ),
    ).toEqual([])
  })
})

describe('Tarefas que terminam hoje', () => {
  const projects = [buildProject({ id: 'project-1' })]

  it('Should take what ends today and what should already have ended', () => {
    const tasks = [
      buildTask({ id: 'termina', plannedStart: '2026-08-01', plannedEnd: TODAY }),
      buildTask({ id: 'vencida', plannedStart: '2026-02-02', plannedEnd: '2026-03-16' }),
      buildTask({ id: 'futura', plannedStart: TODAY, plannedEnd: '2026-10-02' }),
    ]

    expect(selectEndingTasks(tasks, projects, TODAY).map((task) => task.id)).toEqual([
      'termina',
      'vencida',
    ])
  })
})

describe('Agenda de hoje', () => {
  it('Should mark what ends today as an end and what is past due as late', () => {
    const agenda = buildTodayAgenda(
      buildInput({
        tasks: [
          buildTask({ id: 'termina', plannedStart: '2026-08-01', plannedEnd: TODAY }),
          buildTask({ id: 'vencida', plannedStart: '2026-02-02', plannedEnd: '2026-03-16' }),
        ],
      }),
    )

    expect(agenda.ending.map((row) => [row.task.id, row.kind])).toEqual([
      ['vencida', 'late'],
      ['termina', 'end'],
    ])
  })

  it('Should attach the people allocated to a task that starts today', () => {
    const agenda = buildTodayAgenda(
      buildInput({
        tasks: [buildTask({ id: 'roteiro', plannedStart: TODAY, plannedEnd: '2026-10-02' })],
        people: [buildPerson({ id: 'marcos', name: 'Marcos Teles' })],
        allocations: [
          buildAllocation({ taskId: 'roteiro', personId: 'marcos', percentage: 30 }),
        ],
      }),
    )

    expect(
      agenda.starting[0]?.assignments.map((entry) => [entry.person.name, entry.percentage]),
    ).toEqual([['Marcos Teles', 30]])
    expect(agenda.starting[0]?.hasOnlyEndedAllocations).toBe(false)
  })

  it('Should tell nobody apart from everybody ended, as the design prints', () => {
    const agenda = buildTodayAgenda(
      buildInput({
        tasks: [
          buildTask({ id: 'sozinha', plannedStart: TODAY, plannedEnd: '2026-10-02' }),
          buildTask({
            id: 'encerrada',
            plannedStart: '2026-02-02',
            plannedEnd: '2026-03-16',
            status: 'blocked',
          }),
        ],
        people: [buildPerson({ id: 'ana' })],
        allocations: [
          buildAllocation({
            taskId: 'encerrada',
            personId: 'ana',
            endedAt: '2026-08-11T10:05:00Z',
            endedReason: 'projeto bloqueado',
          }),
        ],
      }),
    )

    expect(agenda.starting[0]?.hasOnlyEndedAllocations).toBe(false)
    expect(agenda.ending[0]?.hasOnlyEndedAllocations).toBe(true)
  })
})

describe('Contador da navegação', () => {
  it('Should add the due todos to the tasks that start and end', () => {
    const total = countTodayItems({
      todos: [buildTodo({ dueDate: TODAY })],
      tasks: [
        buildTask({ id: 'comeca', plannedStart: TODAY, plannedEnd: '2026-10-02' }),
        buildTask({ id: 'vencida', plannedStart: '2026-02-02', plannedEnd: '2026-03-16' }),
      ],
      projects: [buildProject({ id: 'project-1' })],
      today: TODAY,
    })

    expect(total).toBe(3)
  })
})
