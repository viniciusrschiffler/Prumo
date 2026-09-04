import { describe, expect, it } from 'vitest'
import {
  differenceInDays,
  earliestDate,
  intersectPeriods,
  latestDate,
  periodsOverlap,
} from './isoDateMath'

describe('differenceInDays', () => {
  it('Should count the days between two dates', () => {
    expect(differenceInDays('2026-03-01', '2026-03-10')).toBe(9)
  })

  it('Should return zero for the same date', () => {
    expect(differenceInDays('2026-03-01', '2026-03-01')).toBe(0)
  })

  it('Should return a negative number when the end comes first', () => {
    expect(differenceInDays('2026-03-10', '2026-03-01')).toBe(-9)
  })

  it('Should cross a leap day without drifting', () => {
    expect(differenceInDays('2028-02-28', '2028-03-01')).toBe(2)
  })

  it('Should cross the end of daylight saving time in Brazil without drifting', () => {
    expect(differenceInDays('2026-10-17', '2026-10-19')).toBe(2)
  })
})

describe('earliestDate e latestDate', () => {
  it('Should pick the boundaries by chronological order', () => {
    expect(earliestDate('2026-03-10', '2026-03-01')).toBe('2026-03-01')
    expect(latestDate('2026-03-10', '2026-03-01')).toBe('2026-03-10')
  })
})

describe('periodsOverlap', () => {
  it('Should detect an overlap of a single day', () => {
    const first = { start: '2026-03-01', end: '2026-03-10' }
    const second = { start: '2026-03-10', end: '2026-03-20' }

    expect(periodsOverlap(first, second)).toBe(true)
  })

  it('Should reject periods that only touch through the gap between them', () => {
    const first = { start: '2026-03-01', end: '2026-03-09' }
    const second = { start: '2026-03-10', end: '2026-03-20' }

    expect(periodsOverlap(first, second)).toBe(false)
  })
})

describe('intersectPeriods', () => {
  it('Should return the shared window of two periods', () => {
    const intersection = intersectPeriods(
      { start: '2026-03-01', end: '2026-03-20' },
      { start: '2026-03-10', end: '2026-03-31' },
    )

    expect(intersection).toEqual({ start: '2026-03-10', end: '2026-03-20' })
  })

  it('Should return null when the periods do not meet', () => {
    const intersection = intersectPeriods(
      { start: '2026-03-01', end: '2026-03-05' },
      { start: '2026-03-10', end: '2026-03-31' },
    )

    expect(intersection).toBeNull()
  })
})
