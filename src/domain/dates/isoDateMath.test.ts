import { describe, expect, it } from 'vitest'
import {
  addMonths,
  differenceInDays,
  earliestDate,
  intersectPeriods,
  latestDate,
  periodsOverlap,
  startOfMonth,
  startOfQuarter,
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

describe('startOfMonth', () => {
  it('Should walk back to the first day of the month', () => {
    expect(startOfMonth('2026-09-29')).toBe('2026-09-01')
    expect(startOfMonth('2026-09-01')).toBe('2026-09-01')
  })
})

describe('addMonths', () => {
  it('Should keep the day when the target month holds it', () => {
    expect(addMonths('2026-03-12', 1)).toBe('2026-04-12')
    expect(addMonths('2026-03-12', -1)).toBe('2026-02-12')
  })

  it('Should shorten the day instead of spilling into the next month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
  })

  it('Should cross the year in both directions', () => {
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15')
    expect(addMonths('2026-02-15', -3)).toBe('2025-11-15')
  })
})

describe('startOfQuarter', () => {
  it('Should walk back to the first day of the quarter', () => {
    expect(startOfQuarter('2026-02-14')).toBe('2026-01-01')
    expect(startOfQuarter('2026-06-30')).toBe('2026-04-01')
    expect(startOfQuarter('2026-09-03')).toBe('2026-07-01')
    expect(startOfQuarter('2026-12-31')).toBe('2026-10-01')
  })
})
