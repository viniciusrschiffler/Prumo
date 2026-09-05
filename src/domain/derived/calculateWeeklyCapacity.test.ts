import { describe, expect, it } from 'vitest'
import { buildAllocation, buildPerson } from '@/domain/testing/entityBuilders'
import { calculateWeeklyCapacity, isOverallocated } from './calculateWeeklyCapacity'
import { listActivePersonIds } from './listActivePersonIds'

const WEEK = { start: '2026-06-01', end: '2026-06-07' }

describe('calculateWeeklyCapacity', () => {
  it('Should add up the allocations that cross the week', () => {
    const person = buildPerson({ weeklyCapacityHours: 40 })
    const allocations = [
      buildAllocation({ id: 'a', percentage: 50, startDate: '2026-05-01', endDate: '2026-06-30' }),
      buildAllocation({ id: 'b', percentage: 50, startDate: '2026-06-03', endDate: '2026-06-05' }),
    ]

    expect(calculateWeeklyCapacity(person, allocations, WEEK)).toEqual({
      percentage: 100,
      hours: 40,
    })
  })

  it('Should convert the percentage using the weekly hours of the person', () => {
    const person = buildPerson({ weeklyCapacityHours: 30 })
    const allocations = [
      buildAllocation({ percentage: 50, startDate: '2026-06-01', endDate: '2026-06-30' }),
    ]

    expect(calculateWeeklyCapacity(person, allocations, WEEK).hours).toBe(15)
  })

  it('Should ignore an allocation outside the week', () => {
    const person = buildPerson()
    const allocations = [
      buildAllocation({ percentage: 100, startDate: '2026-07-01', endDate: '2026-07-31' }),
    ]

    expect(calculateWeeklyCapacity(person, allocations, WEEK).percentage).toBe(0)
  })

  it('Should ignore an allocation ended before the week started', () => {
    const person = buildPerson()
    const allocations = [
      buildAllocation({
        percentage: 100,
        startDate: '2026-05-01',
        endDate: '2026-06-30',
        endedAt: '2026-05-20T10:00:00Z',
        endedReason: 'projeto bloqueado',
      }),
    ]

    expect(calculateWeeklyCapacity(person, allocations, WEEK).percentage).toBe(0)
  })

  it('Should still count a week the allocation was live in, even if it ended later', () => {
    const person = buildPerson()
    const allocations = [
      buildAllocation({
        percentage: 100,
        startDate: '2026-05-01',
        endDate: '2026-06-30',
        endedAt: '2026-06-20T10:00:00Z',
        endedReason: 'projeto bloqueado',
      }),
    ]

    expect(calculateWeeklyCapacity(person, allocations, WEEK).percentage).toBe(100)
  })

  it('Should ignore the allocations of other people', () => {
    const person = buildPerson({ id: 'person-1' })
    const allocations = [buildAllocation({ personId: 'person-2', percentage: 100 })]

    expect(calculateWeeklyCapacity(person, allocations, WEEK).percentage).toBe(0)
  })
})

describe('isOverallocated', () => {
  it('Should flag only above one hundred percent', () => {
    expect(isOverallocated({ percentage: 150, hours: 60 })).toBe(true)
    expect(isOverallocated({ percentage: 100, hours: 40 })).toBe(false)
  })
})

describe('listActivePersonIds', () => {
  it('Should list distinct people with an open allocation', () => {
    const allocations = [
      buildAllocation({ id: 'a', personId: 'ana' }),
      buildAllocation({ id: 'b', personId: 'ana' }),
      buildAllocation({ id: 'c', personId: 'rafael' }),
    ]

    expect(listActivePersonIds(allocations)).toEqual(['ana', 'rafael'])
  })

  it('Should leave out someone whose allocation was ended', () => {
    const allocations = [
      buildAllocation({ id: 'a', personId: 'ana' }),
      buildAllocation({
        id: 'b',
        personId: 'rafael',
        endedAt: '2026-05-20T10:00:00Z',
        endedReason: 'projeto bloqueado',
      }),
    ]

    expect(listActivePersonIds(allocations)).toEqual(['ana'])
  })
})
