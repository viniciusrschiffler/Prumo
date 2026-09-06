import { describe, expect, it } from 'vitest'
import { buildAllocation, buildPerson, buildProjectEvent } from '@/domain/testing/entityBuilders'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { buildTodo } from '@/domain/testing/todoBuilders'
import { summarizeWeek, type WeekNumbersInput } from './weekNumbers'

const TODAY = '2026-09-03'

function buildInput(overrides: Partial<WeekNumbersInput> = {}): WeekNumbersInput {
  return {
    projects: [buildProject({ id: 'project-1' })],
    events: [],
    allocations: [],
    people: [],
    todos: [],
    today: TODAY,
    weekStart: 'monday',
    ...overrides,
  }
}

describe('Janela da semana', () => {
  it('Should open on monday and carry the week number the header prints', () => {
    const summary = summarizeWeek(buildInput())

    expect(summary.period).toEqual({ start: '2026-08-31', end: '2026-09-06' })
    expect(summary.weekNumber).toBe(36)
  })
})

describe('Capacidade usada', () => {
  it('Should divide the hours spent by the capacity of the active people', () => {
    const summary = summarizeWeek(
      buildInput({
        people: [
          buildPerson({ id: 'ana', weeklyCapacityHours: 40 }),
          buildPerson({ id: 'marcos', weeklyCapacityHours: 30 }),
        ],
        allocations: [
          buildAllocation({
            personId: 'ana',
            startDate: '2026-07-30',
            endDate: '2026-09-26',
            percentage: 50,
          }),
        ],
      }),
    )

    expect(summary.usedHours).toBe(20)
    expect(summary.capacityHours).toBe(70)
    expect(summary.capacityUsedPercentage).toBe(29)
  })

  it('Should leave the inactive person out of the team capacity', () => {
    const summary = summarizeWeek(
      buildInput({
        people: [
          buildPerson({ id: 'ana', weeklyCapacityHours: 40 }),
          buildPerson({ id: 'julia', weeklyCapacityHours: 40, active: false }),
        ],
      }),
    )

    expect(summary.capacityHours).toBe(40)
  })

  it('Should measure the week by the peak of its days, not by the sum of what crosses it', () => {
    const summary = summarizeWeek(
      buildInput({
        people: [buildPerson({ id: 'rafael', weeklyCapacityHours: 40 })],
        allocations: [
          buildAllocation({
            id: 'antiga',
            personId: 'rafael',
            startDate: '2026-07-30',
            endDate: '2026-08-31',
            percentage: 100,
            endedAt: '2026-08-31T11:20:00Z',
            endedReason: 'realocação',
          }),
          buildAllocation({
            id: 'nova',
            personId: 'rafael',
            startDate: '2026-08-31',
            endDate: '2026-09-26',
            percentage: 50,
          }),
        ],
      }),
    )

    expect(summary.capacityUsedPercentage).toBe(50)
  })
})

describe('Dias bloqueados', () => {
  it('Should stop an open block on today, not on the end of the week', () => {
    const summary = summarizeWeek(
      buildInput({
        events: [
          buildProjectEvent({
            projectId: 'project-1',
            type: 'block',
            eventDate: '2026-08-11',
          }),
        ],
      }),
    )

    expect(summary.blockedDays).toBe(3)
  })

  it('Should count only the stretch inside the week', () => {
    const summary = summarizeWeek(
      buildInput({
        events: [
          buildProjectEvent({ id: '1', projectId: 'project-1', type: 'block', eventDate: '2026-08-11' }),
          buildProjectEvent({ id: '2', projectId: 'project-1', type: 'unblock', eventDate: '2026-09-02' }),
        ],
      }),
    )

    expect(summary.blockedDays).toBe(2)
  })

  it('Should ignore an archived project', () => {
    const summary = summarizeWeek(
      buildInput({
        projects: [
          buildProject({ id: 'erp', archivedAt: '2026-04-30T18:00:00Z' }),
        ],
        events: [
          buildProjectEvent({ projectId: 'erp', type: 'block', eventDate: '2026-08-11' }),
        ],
      }),
    )

    expect(summary.blockedDays).toBe(0)
  })
})

describe('Eventos e todos da semana', () => {
  it('Should count only what happened inside the week', () => {
    const summary = summarizeWeek(
      buildInput({
        events: [
          buildProjectEvent({ id: '1', projectId: 'project-1', eventDate: '2026-09-03' }),
          buildProjectEvent({ id: '2', projectId: 'project-1', eventDate: '2026-08-16' }),
        ],
        todos: [
          buildTodo({
            id: 'na-semana',
            status: 'done',
            completedAt: '2026-09-01T17:30:00Z',
          }),
          buildTodo({
            id: 'antes',
            status: 'done',
            completedAt: '2026-08-20T17:30:00Z',
          }),
          buildTodo({ id: 'aberto' }),
        ],
      }),
    )

    expect(summary.eventCount).toBe(1)
    expect(summary.completedTodoCount).toBe(1)
  })
})
