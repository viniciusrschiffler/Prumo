import { describe, expect, it } from 'vitest'
import { buildAllocation, buildPerson } from '@/domain/testing/entityBuilders'
import {
  buildWorkloadDistribution,
  calculateCapacityUsage,
  isOverloaded,
} from './workloadDistribution'

const WEEKS = [
  { start: '2026-06-01', end: '2026-06-07' },
  { start: '2026-06-08', end: '2026-06-14' },
]

const ANA = buildPerson({ id: 'ana', name: 'Ana Nogueira', weeklyCapacityHours: 40 })
const RAFAEL = buildPerson({ id: 'rafael', name: 'Rafael Brito', weeklyCapacityHours: 40 })
const JULIA = buildPerson({ id: 'julia', name: 'Júlia Farah', weeklyCapacityHours: 30, active: false })

describe('buildWorkloadDistribution', () => {
  it('Should average the weeks, so a full week and an idle one read as half', () => {
    const rows = buildWorkloadDistribution(
      [ANA],
      [buildAllocation({ personId: 'ana', percentage: 100, startDate: '2026-06-01', endDate: '2026-06-07' })],
      WEEKS,
    )

    expect(rows[0]).toMatchObject({ averagePercentage: 50, averageHours: 20 })
  })

  it('Should leave the inactive person out, whose hours nobody can spend', () => {
    const rows = buildWorkloadDistribution([ANA, JULIA], [], WEEKS)

    expect(rows.map((row) => row.person.id)).toEqual(['ana'])
  })

  it('Should order by load and break the tie by name', () => {
    const rows = buildWorkloadDistribution([RAFAEL, ANA], [], WEEKS)

    expect(rows.map((row) => row.person.name)).toEqual(['Ana Nogueira', 'Rafael Brito'])
  })

  it('Should take the peak of each week, not the sum of the allocations that cross it', () => {
    const rows = buildWorkloadDistribution(
      [ANA],
      [
        buildAllocation({ id: 'a', personId: 'ana', percentage: 100, startDate: '2026-06-01', endDate: '2026-06-03' }),
        buildAllocation({ id: 'b', personId: 'ana', percentage: 100, startDate: '2026-06-04', endDate: '2026-06-07' }),
      ],
      [WEEKS[0]!],
    )

    expect(rows[0]?.averagePercentage).toBe(100)
  })
})

describe('calculateCapacityUsage', () => {
  it('Should measure the used hours against the capacity of the active team', () => {
    const rows = buildWorkloadDistribution(
      [ANA, RAFAEL],
      [buildAllocation({ personId: 'ana', percentage: 100, startDate: '2026-06-01', endDate: '2026-06-14' })],
      WEEKS,
    )

    expect(calculateCapacityUsage(rows, [ANA, RAFAEL])).toBe(50)
  })

  it('Should not lend the inactive person capacity to the denominator', () => {
    const rows = buildWorkloadDistribution(
      [ANA, JULIA],
      [buildAllocation({ personId: 'ana', percentage: 100, startDate: '2026-06-01', endDate: '2026-06-14' })],
      WEEKS,
    )

    expect(calculateCapacityUsage(rows, [ANA, JULIA])).toBe(100)
  })

  it('Should be zero when nobody is active, instead of dividing by zero', () => {
    expect(calculateCapacityUsage([], [JULIA])).toBe(0)
  })
})

describe('isOverloaded', () => {
  it('Should call overloaded only what passed 100%, not what reached it', () => {
    const [full] = buildWorkloadDistribution(
      [ANA],
      [buildAllocation({ personId: 'ana', percentage: 100, startDate: '2026-06-01', endDate: '2026-06-14' })],
      WEEKS,
    )
    const [over] = buildWorkloadDistribution(
      [ANA],
      [buildAllocation({ personId: 'ana', percentage: 150, startDate: '2026-06-01', endDate: '2026-06-14' })],
      WEEKS,
    )

    expect(isOverloaded(full!)).toBe(false)
    expect(isOverloaded(over!)).toBe(true)
  })
})
