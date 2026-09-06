import { describe, expect, it } from 'vitest'
import { isoWeekNumber } from './isoDateMath'

describe('isoWeekNumber', () => {
  it('Should number the week that the design header calls S36', () => {
    expect(isoWeekNumber('2026-08-31')).toBe(36)
  })

  it('Should number the following weeks in sequence', () => {
    expect(isoWeekNumber('2026-09-07')).toBe(37)
    expect(isoWeekNumber('2026-11-16')).toBe(47)
  })

  it('Should open the year on the week that holds its first Thursday', () => {
    expect(isoWeekNumber('2025-12-29')).toBe(1)
    expect(isoWeekNumber('2026-01-05')).toBe(2)
  })

  it('Should give a Sunday start the number of the week where most of it falls', () => {
    expect(isoWeekNumber('2026-08-30')).toBe(36)
  })

  it('Should reach week 53 in a year that has one', () => {
    expect(isoWeekNumber('2026-12-28')).toBe(53)
  })
})
