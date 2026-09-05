import { describe, expect, it } from 'vitest'
import { addDays, startOfWeek, weekPeriod } from './isoDateMath'

describe('addDays', () => {
  it('Should walk forward across the end of the month', () => {
    expect(addDays('2026-03-30', 3)).toBe('2026-04-02')
  })

  it('Should walk backward across the start of the year', () => {
    expect(addDays('2026-01-02', -3)).toBe('2025-12-30')
  })

  it('Should land on 29 February of a leap year', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('startOfWeek', () => {
  // 05/09/2026 é um sábado.
  it('Should walk back to Monday when the week starts on Monday', () => {
    expect(startOfWeek('2026-09-05', 'monday')).toBe('2026-08-31')
  })

  it('Should walk back to Sunday when the week starts on Sunday', () => {
    expect(startOfWeek('2026-09-05', 'sunday')).toBe('2026-08-30')
  })

  it('Should keep a Monday in place when the week starts on Monday', () => {
    expect(startOfWeek('2026-08-31', 'monday')).toBe('2026-08-31')
  })

  it('Should walk a Sunday back six days when the week starts on Monday', () => {
    expect(startOfWeek('2026-09-06', 'monday')).toBe('2026-08-31')
  })
})

describe('weekPeriod', () => {
  it('Should span seven days', () => {
    expect(weekPeriod('2026-09-05', 'monday')).toEqual({
      start: '2026-08-31',
      end: '2026-09-06',
    })
  })

  it('Should match the week the seed uses for the overallocation', () => {
    expect(weekPeriod('2026-06-03', 'monday')).toEqual({
      start: '2026-06-01',
      end: '2026-06-07',
    })
  })
})
