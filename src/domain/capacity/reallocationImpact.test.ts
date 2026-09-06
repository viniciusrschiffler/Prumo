import { describe, expect, it } from 'vitest'
import { buildAllocation, buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { buildAllocationIndex } from './allocationDetails'
import { buildCapacityWindow } from './capacityWindow'
import {
  calculateDelayInDays,
  listRemovableAllocations,
  simulateReallocation,
  toWeeklyHours,
} from './reallocationImpact'

const TODAY = '2026-09-03'
const WEEKS = buildCapacityWindow(TODAY, 'monday').weeks.map((week) => week.period)

const RAFAEL = buildPerson({
  id: 'rafael',
  name: 'Rafael Brito',
  initials: 'RB',
  weeklyCapacityHours: 40,
})
const ANA = buildPerson({ id: 'ana', name: 'Ana Nogueira', weeklyCapacityHours: 40 })

const COLLECT_TASK = buildTask({
  id: 'ob-inst',
  projectId: 'observabilidade',
  title: 'Observabilidade — coleta',
  plannedStart: '2026-08-31',
  plannedEnd: '2026-10-30',
})
const LOAD_TASK = buildTask({
  id: 'gw-tes',
  projectId: 'gateway',
  title: 'Testes de carga',
  plannedStart: '2026-08-31',
  plannedEnd: '2026-11-13',
})

const INDEX = buildAllocationIndex({
  tasks: [COLLECT_TASK, LOAD_TASK],
  projects: [
    buildProject({ id: 'observabilidade', name: 'Observabilidade' }),
    buildProject({ id: 'gateway', name: 'Migração do gateway' }),
  ],
  phases: [],
  weekStart: 'monday',
})

const ON_COLLECT = buildAllocation({
  id: 'al-ob-1',
  personId: 'rafael',
  taskId: 'ob-inst',
  startDate: '2026-08-31',
  endDate: '2026-10-30',
  percentage: 100,
})

const ON_LOAD = buildAllocation({
  id: 'al-gw-8',
  personId: 'rafael',
  taskId: 'gw-tes',
  startDate: '2026-08-31',
  endDate: '2026-11-13',
  percentage: 50,
})

describe('calculateDelayInDays', () => {
  it('Should push the end by the whole absence when nobody stays on the task', () => {
    expect(
      calculateDelayInDays({
        removedWeeklyHours: 40,
        remainingWeeklyHours: 0,
        weeksRemoved: 3,
      }),
    ).toBe(21)
  })

  it('Should charge the lost hours to whoever stays', () => {
    expect(
      calculateDelayInDays({
        removedWeeklyHours: 40,
        remainingWeeklyHours: 40,
        weeksRemoved: 3,
      }),
    ).toBe(21)
    expect(
      calculateDelayInDays({
        removedWeeklyHours: 20,
        remainingWeeklyHours: 40,
        weeksRemoved: 4,
      }),
    ).toBe(14)
  })

  it('Should round the delay up, because a partial day still slips the plan', () => {
    expect(
      calculateDelayInDays({
        removedWeeklyHours: 10,
        remainingWeeklyHours: 30,
        weeksRemoved: 1,
      }),
    ).toBe(3)
  })

  it('Should not move anything when there is nothing to remove', () => {
    expect(
      calculateDelayInDays({ removedWeeklyHours: 0, remainingWeeklyHours: 40, weeksRemoved: 3 }),
    ).toBe(0)
  })
})

describe('toWeeklyHours', () => {
  it('Should turn a percentage of a capacity into hours', () => {
    expect(toWeeklyHours({ percentage: 50, weeklyCapacityHours: 40 })).toBe(20)
  })
})

describe('simulateReallocation', () => {
  const allocations = [ON_COLLECT, ON_LOAD]

  function simulate(weeksRemoved: number, allocationId = 'al-ob-1') {
    return simulateReallocation({
      person: RAFAEL,
      allocationId,
      weeksRemoved,
      allocations,
      tasks: [COLLECT_TASK, LOAD_TASK],
      people: [RAFAEL, ANA],
      index: INDEX,
      today: TODAY,
      weeks: WEEKS,
    })
  }

  it('Should delay the task by the whole absence when the person works it alone', () => {
    const simulation = simulate(3)

    expect(simulation?.delayInDays).toBe(21)
    expect(simulation?.taskPeriodAfter?.end).toBe('2026-11-20')
  })

  it('Should open the absence today when the allocation has already started', () => {
    expect(simulate(3)?.removalPeriod).toEqual({ start: TODAY, end: '2026-09-23' })
  })

  it('Should leave out work the person has already finished', () => {
    const past = buildAllocation({
      id: 'al-antiga',
      personId: 'rafael',
      taskId: 'gw-tes',
      startDate: '2026-06-01',
      endDate: '2026-06-26',
      percentage: 100,
    })

    const rows =
      simulateReallocation({
        person: RAFAEL,
        allocationId: 'al-ob-1',
        weeksRemoved: 3,
        allocations: [ON_COLLECT, past],
        tasks: [COLLECT_TASK, LOAD_TASK],
        people: [RAFAEL, ANA],
        index: INDEX,
        today: TODAY,
        weeks: WEEKS,
      })?.rows ?? []

    expect(rows.map((row) => row.id)).toEqual(['task-ob-inst', 'project-observabilidade'])
  })

  it('Should leave the other work of the person where it is', () => {
    const rows = simulate(3)?.rows ?? []

    expect(rows.map((row) => row.deltaDays)).toEqual([21, 0, 21])
    expect(rows[1]?.label).toBe('Migração do gateway — Testes de carga')
    expect(rows[1]?.before).toBe(rows[1]?.after)
  })

  it('Should close the table with the project end previsto', () => {
    const rows = simulate(3)?.rows ?? []
    const projectRow = rows[rows.length - 1]

    expect(projectRow?.label).toBe('Observabilidade — fim previsto')
    expect(projectRow?.before).toBe('2026-10-30')
    expect(projectRow?.after).toBe('2026-11-20')
  })

  it('Should report the peak before and after, and whether it resolves the overload', () => {
    const simulation = simulate(3)

    expect(simulation?.peakPercentageBefore).toBe(150)
    expect(simulation?.peakPercentageAfter).toBe(50)
    expect(simulation?.resolvesOverload).toBe(true)
  })

  it('Should not claim to resolve anything when there was no overload', () => {
    const simulation = simulateReallocation({
      person: RAFAEL,
      allocationId: 'al-gw-8',
      weeksRemoved: 2,
      allocations: [ON_LOAD],
      tasks: [LOAD_TASK],
      people: [RAFAEL],
      index: INDEX,
      today: TODAY,
      weeks: WEEKS,
    })

    expect(simulation?.peakPercentageBefore).toBe(50)
    expect(simulation?.resolvesOverload).toBe(false)
  })

  it('Should return nothing for an allocation that is not there', () => {
    expect(simulate(3, 'nao-existe')).toBeNull()
  })
})

describe('listRemovableAllocations', () => {
  it('Should offer only the open allocations that still run from today on', () => {
    const past = buildAllocation({
      id: 'al-old',
      personId: 'rafael',
      taskId: 'gw-tes',
      startDate: '2026-06-01',
      endDate: '2026-06-26',
      percentage: 100,
    })
    const ended = buildAllocation({
      id: 'al-ended',
      personId: 'rafael',
      taskId: 'gw-tes',
      startDate: '2026-08-31',
      endDate: '2026-11-13',
      percentage: 100,
      endedAt: '2026-09-01T10:00:00Z',
      endedReason: 'realocação',
    })

    const removable = listRemovableAllocations(
      'rafael',
      [ON_COLLECT, ON_LOAD, past, ended],
      INDEX,
      TODAY,
    )

    expect(removable.map((detail) => detail.allocation.id)).toEqual(['al-ob-1', 'al-gw-8'])
  })
})
