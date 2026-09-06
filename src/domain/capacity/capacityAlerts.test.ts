import { describe, expect, it } from 'vitest'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import { buildAllocation, buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { buildAllocationIndex } from './allocationDetails'
import { findInactiveWithFutureWork, findOverloadAlerts } from './capacityAlerts'
import { buildCapacityMatrix } from './capacityMatrix'
import { buildCapacityWindow } from './capacityWindow'

const TODAY = '2026-09-03'
const WINDOW = buildCapacityWindow(TODAY, 'monday')

const RAFAEL = buildPerson({
  id: 'rafael',
  name: 'Rafael Brito',
  initials: 'RB',
  weeklyCapacityHours: 40,
})
const JULIA = buildPerson({
  id: 'julia',
  name: 'Júlia Farah',
  initials: 'JF',
  weeklyCapacityHours: 40,
  active: false,
})

const TASK = buildTask({ id: 'gw-tes', projectId: 'gateway', title: 'Testes de carga' })
const PROJECT = buildProject({ id: 'gateway' })

const INDEX = buildAllocationIndex({
  tasks: [TASK],
  projects: [PROJECT],
  phases: [],
  weekStart: 'monday',
})

function matrixOf(people: readonly Person[], allocations: readonly Allocation[]) {
  return buildCapacityMatrix({
    people,
    allocations,
    tasks: [TASK],
    window: WINDOW,
    projectId: null,
  })
}

describe('findOverloadAlerts', () => {
  const overloading = [
    buildAllocation({
      id: 'a1',
      personId: 'rafael',
      taskId: 'gw-tes',
      startDate: '2026-09-07',
      endDate: '2026-10-04',
      percentage: 100,
    }),
    buildAllocation({
      id: 'a2',
      personId: 'rafael',
      taskId: 'gw-tes',
      startDate: '2026-09-07',
      endDate: '2026-10-04',
      percentage: 50,
    }),
  ]

  it('Should report the weeks the person goes over capacity and the peak', () => {
    const alerts = findOverloadAlerts({
      matrix: matrixOf([RAFAEL], overloading),
      allocations: overloading,
      index: INDEX,
      window: WINDOW,
    })

    expect(alerts).toHaveLength(1)
    expect(alerts[0]?.weekIndexes).toEqual([1, 2, 3, 4])
    expect(alerts[0]?.firstWeekNumber).toBe(37)
    expect(alerts[0]?.lastWeekNumber).toBe(40)
    expect(alerts[0]?.peakPercentage).toBe(150)
  })

  it('Should list what fills the overloaded period', () => {
    const alerts = findOverloadAlerts({
      matrix: matrixOf([RAFAEL], overloading),
      allocations: overloading,
      index: INDEX,
      window: WINDOW,
    })

    expect(alerts[0]?.allocations.map((detail) => detail.allocation.percentage)).toEqual([100, 50])
  })

  it('Should report nothing when nobody passes the capacity', () => {
    const alerts = findOverloadAlerts({
      matrix: matrixOf([RAFAEL], [overloading[0] as Allocation]),
      allocations: [overloading[0] as Allocation],
      index: INDEX,
      window: WINDOW,
    })

    expect(alerts).toEqual([])
  })
})

describe('findInactiveWithFutureWork', () => {
  it('Should report an inactive person who still holds an open allocation', () => {
    const allocations = [
      buildAllocation({
        id: 'a1',
        personId: 'julia',
        taskId: 'gw-tes',
        startDate: '2026-10-26',
        endDate: '2026-11-22',
        percentage: 10,
      }),
    ]

    const alerts = findInactiveWithFutureWork({
      people: [JULIA, RAFAEL],
      allocations,
      index: INDEX,
      window: WINDOW,
    })

    expect(alerts).toHaveLength(1)
    expect(alerts[0]?.person.id).toBe('julia')
    expect(alerts[0]?.firstWeekNumber).toBe(44)
  })

  it('Should ignore an allocation that was already ended', () => {
    const allocations = [
      buildAllocation({
        id: 'a1',
        personId: 'julia',
        taskId: 'gw-tes',
        startDate: '2026-10-26',
        endDate: '2026-11-22',
        percentage: 10,
        endedAt: '2026-08-11T10:05:00Z',
        endedReason: 'projeto bloqueado',
      }),
    ]

    expect(
      findInactiveWithFutureWork({
        people: [JULIA],
        allocations,
        index: INDEX,
        window: WINDOW,
      }),
    ).toEqual([])
  })

  it('Should ignore an active person with future work', () => {
    const allocations = [
      buildAllocation({
        id: 'a1',
        personId: 'rafael',
        taskId: 'gw-tes',
        startDate: '2026-10-26',
        endDate: '2026-11-22',
        percentage: 10,
      }),
    ]

    expect(
      findInactiveWithFutureWork({
        people: [RAFAEL],
        allocations,
        index: INDEX,
        window: WINDOW,
      }),
    ).toEqual([])
  })
})
