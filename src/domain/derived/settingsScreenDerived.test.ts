import { describe, expect, it } from 'vitest'
import { buildAllocation, buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import {
  countActiveAllocationsByPerson,
  countAllocationsByPerson,
} from './countActiveAllocationsByPerson'
import { countTasksByPhase } from './countTasksByPhase'
import { moveInOrder } from './moveInOrder'
import { countActivePeople, sumTeamWeeklyCapacity } from './sumTeamWeeklyCapacity'

describe('countActiveAllocationsByPerson', () => {
  it('Should count only the allocations that were never ended', () => {
    const allocations = [
      buildAllocation({ id: 'a', personId: 'ana' }),
      buildAllocation({ id: 'b', personId: 'ana' }),
      buildAllocation({
        id: 'c',
        personId: 'ana',
        endedAt: '2026-07-22T16:40:00Z',
        endedReason: 'projeto bloqueado',
      }),
    ]

    expect(countActiveAllocationsByPerson(allocations).get('ana')).toBe(2)
  })

  it('Should leave a person with only ended allocations out of the map', () => {
    const allocations = [
      buildAllocation({ id: 'a', personId: 'julia', endedAt: '2026-08-11T10:05:00Z' }),
    ]

    expect(countActiveAllocationsByPerson(allocations).has('julia')).toBe(false)
  })

  it('Should separate the count by person', () => {
    const allocations = [
      buildAllocation({ id: 'a', personId: 'ana' }),
      buildAllocation({ id: 'b', personId: 'rafael' }),
      buildAllocation({ id: 'c', personId: 'rafael' }),
    ]

    const counts = countActiveAllocationsByPerson(allocations)

    expect(counts.get('ana')).toBe(1)
    expect(counts.get('rafael')).toBe(2)
  })

  it('Should keep the ended allocations in the history count', () => {
    const allocations = [
      buildAllocation({ id: 'a', personId: 'julia', endedAt: '2026-08-11T10:05:00Z' }),
      buildAllocation({ id: 'b', personId: 'julia' }),
    ]

    expect(countAllocationsByPerson(allocations).get('julia')).toBe(2)
  })
})

describe('sumTeamWeeklyCapacity', () => {
  it('Should add up only the capacity of the active people', () => {
    const people = [
      buildPerson({ id: 'ana', weeklyCapacityHours: 40 }),
      buildPerson({ id: 'rafael', weeklyCapacityHours: 40 }),
      buildPerson({ id: 'marcos', weeklyCapacityHours: 30 }),
      buildPerson({ id: 'julia', weeklyCapacityHours: 40, active: false }),
    ]

    expect(sumTeamWeeklyCapacity(people)).toBe(110)
    expect(countActivePeople(people)).toBe(3)
  })

  it('Should report zero for a team with nobody active', () => {
    expect(sumTeamWeeklyCapacity([buildPerson({ active: false })])).toBe(0)
  })
})

describe('countTasksByPhase', () => {
  it('Should count every task of the phase, cancelled included', () => {
    const tasks = [
      buildTask({ id: 'a', phaseId: 'development' }),
      buildTask({ id: 'b', phaseId: 'development', status: 'cancelled' }),
      buildTask({ id: 'c', phaseId: 'production' }),
    ]

    const counts = countTasksByPhase(tasks)

    expect(counts.get('development')).toBe(2)
    expect(counts.get('production')).toBe(1)
  })

  it('Should leave a phase without tasks out of the map', () => {
    expect(countTasksByPhase([]).get('development')).toBeUndefined()
  })
})

describe('moveInOrder', () => {
  it('Should move an item down', () => {
    expect(moveInOrder(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('Should move an item up', () => {
    expect(moveInOrder(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('Should keep the order when both indexes are the same', () => {
    expect(moveInOrder(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c'])
  })

  it('Should keep the order when an index is out of range', () => {
    expect(moveInOrder(['a', 'b'], 0, 5)).toEqual(['a', 'b'])
    expect(moveInOrder(['a', 'b'], -1, 1)).toEqual(['a', 'b'])
  })

  it('Should not change the received array', () => {
    const original = ['a', 'b', 'c']

    moveInOrder(original, 0, 2)

    expect(original).toEqual(['a', 'b', 'c'])
  })
})
