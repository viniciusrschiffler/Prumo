import { describe, expect, it } from 'vitest'
import {
  buildAllocation,
  buildPerson,
  buildProjectEvent,
  buildTask,
} from '@/domain/testing/entityBuilders'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { findConsistencyAlerts, type ConsistencyAlertsInput } from './consistencyAlerts'

const TODAY = '2026-09-03'

// Projeto sem evento nenhum conta como parado desde a criação, então a base dos casos que
// não falam de estagnação nasce criada hoje.
function freshProject(id: string) {
  return buildProject({ id, createdAt: `${TODAY}T09:00:00Z` })
}

function buildInput(overrides: Partial<ConsistencyAlertsInput> = {}): ConsistencyAlertsInput {
  return {
    projects: [freshProject('project-1')],
    tasks: [],
    events: [],
    notes: [],
    allocations: [],
    people: [],
    today: TODAY,
    weekStart: 'monday',
    staleAfterDays: 14,
    ...overrides,
  }
}

describe('Sobrecarga', () => {
  const person = buildPerson({ id: 'rafael', name: 'Rafael Brito' })

  it('Should alert on an overload that reaches today or the future', () => {
    const alerts = findConsistencyAlerts(
      buildInput({
        people: [person],
        tasks: [buildTask({ id: 'a' }), buildTask({ id: 'b' })],
        allocations: [
          buildAllocation({
            id: '1',
            taskId: 'a',
            personId: 'rafael',
            startDate: '2026-09-01',
            endDate: '2026-09-30',
            percentage: 100,
          }),
          buildAllocation({
            id: '2',
            taskId: 'b',
            personId: 'rafael',
            startDate: '2026-09-01',
            endDate: '2026-09-30',
            percentage: 50,
          }),
        ],
      }),
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0]?.kind).toBe('overload')
    expect(alerts[0]).toMatchObject({ totalPercentage: 150 })
  })

  it('Should stay quiet about an overload that is already over', () => {
    const alerts = findConsistencyAlerts(
      buildInput({
        people: [person],
        tasks: [buildTask({ id: 'a' }), buildTask({ id: 'b' })],
        allocations: [
          buildAllocation({
            id: '1',
            taskId: 'a',
            personId: 'rafael',
            startDate: '2026-06-01',
            endDate: '2026-06-26',
            percentage: 100,
          }),
          buildAllocation({
            id: '2',
            taskId: 'b',
            personId: 'rafael',
            startDate: '2026-06-01',
            endDate: '2026-06-26',
            percentage: 50,
          }),
        ],
      }),
    )

    expect(alerts).toEqual([])
  })
})

describe('Tarefa sem responsável', () => {
  it('Should gather every task starting today without a live allocation in one alert', () => {
    const alerts = findConsistencyAlerts(
      buildInput({
        tasks: [
          buildTask({ id: 'ob-cut', plannedStart: TODAY, plannedEnd: '2026-09-11' }),
          buildTask({ id: 'outra', plannedStart: TODAY, plannedEnd: '2026-09-11' }),
        ],
        people: [buildPerson({ id: 'marcos' })],
        allocations: [buildAllocation({ taskId: 'outra', personId: 'marcos' })],
      }),
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      kind: 'unassigned',
      tasks: [{ task: expect.objectContaining({ id: 'ob-cut' }) }],
    })
  })

  it('Should count an ended allocation as nobody', () => {
    const alerts = findConsistencyAlerts(
      buildInput({
        tasks: [buildTask({ id: 'ob-cut', plannedStart: TODAY, plannedEnd: '2026-09-11' })],
        people: [buildPerson({ id: 'marcos' })],
        allocations: [
          buildAllocation({
            taskId: 'ob-cut',
            personId: 'marcos',
            endedAt: '2026-08-11T10:05:00Z',
            endedReason: 'projeto bloqueado',
          }),
        ],
      }),
    )

    expect(alerts[0]?.kind).toBe('unassigned')
  })
})

describe('Projeto sem atualização', () => {
  it('Should count the days since the last event, task finished or note', () => {
    const alerts = findConsistencyAlerts(
      buildInput({
        projects: [freshProject('observabilidade')],
        events: [
          buildProjectEvent({ projectId: 'observabilidade', eventDate: '2026-08-16' }),
        ],
      }),
    )

    expect(alerts[0]).toMatchObject({
      kind: 'stale',
      lastActivityDate: '2026-08-16',
      idleDays: 18,
    })
  })

  it('Should stay quiet while the project moved inside the configured window', () => {
    const alerts = findConsistencyAlerts(
      buildInput({
        projects: [freshProject('gateway')],
        events: [buildProjectEvent({ projectId: 'gateway', eventDate: '2026-08-30' })],
      }),
    )

    expect(alerts).toEqual([])
  })

  it('Should read a note and a finished task as activity too', () => {
    const alerts = findConsistencyAlerts(
      buildInput({
        projects: [freshProject('gateway')],
        events: [buildProjectEvent({ projectId: 'gateway', eventDate: '2026-06-01' })],
        tasks: [
          buildTask({ projectId: 'gateway', status: 'done', actualEnd: '2026-08-25' }),
        ],
        notes: [
          {
            path: 'notas/gateway.md',
            projectId: 'gateway',
            projectEventId: null,
            updatedAt: '2026-08-29T09:00:00Z',
          },
        ],
      }),
    )

    expect(alerts).toEqual([])
  })

  it('Should leave out a cancelled and an archived project', () => {
    const alerts = findConsistencyAlerts(
      buildInput({
        projects: [
          buildProject({ id: 'erp', status: 'cancelled', createdAt: '2026-01-05T09:00:00Z' }),
          buildProject({
            id: 'antigo',
            createdAt: '2026-01-05T09:00:00Z',
            archivedAt: '2026-04-30T18:00:00Z',
          }),
        ],
      }),
    )

    expect(alerts).toEqual([])
  })
})

describe('Ordem dos alertas', () => {
  it('Should print the overload, then the unassigned task, then the stale project', () => {
    const alerts = findConsistencyAlerts(
      buildInput({
        projects: [freshProject('project-1'), freshProject('parado')],
        people: [buildPerson({ id: 'rafael' })],
        tasks: [
          buildTask({ id: 'a' }),
          buildTask({ id: 'b' }),
          buildTask({ id: 'sozinha', plannedStart: TODAY, plannedEnd: '2026-09-11' }),
        ],
        events: [buildProjectEvent({ projectId: 'parado', eventDate: '2026-06-01' })],
        allocations: [
          buildAllocation({
            id: '1',
            taskId: 'a',
            personId: 'rafael',
            startDate: '2026-09-01',
            endDate: '2026-09-30',
            percentage: 100,
          }),
          buildAllocation({
            id: '2',
            taskId: 'b',
            personId: 'rafael',
            startDate: '2026-09-01',
            endDate: '2026-09-30',
            percentage: 50,
          }),
        ],
      }),
    )

    expect(alerts.map((alert) => alert.kind)).toEqual(['overload', 'unassigned', 'stale'])
  })
})
