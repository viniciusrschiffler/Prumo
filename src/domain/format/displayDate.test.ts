import { describe, expect, it } from 'vitest'
import { formatIsoDate, parseDisplayDate } from './displayDate'

describe('formatIsoDate', () => {
  it('Should print the day first, as every screen shows it', () => {
    expect(formatIsoDate('2026-03-12')).toBe('12/03/2026')
  })

  it('Should print a dash when there is no date', () => {
    expect(formatIsoDate(null)).toBe('—')
  })
})

describe('parseDisplayDate', () => {
  it('Should read back what formatIsoDate printed', () => {
    expect(parseDisplayDate('12/03/2026')).toBe('2026-03-12')
  })

  it('Should ignore the spaces around the typed date', () => {
    expect(parseDisplayDate('  12/03/2026 ')).toBe('2026-03-12')
  })

  it('Should refuse a day that does not exist in the month', () => {
    expect(parseDisplayDate('30/02/2026')).toBeNull()
  })

  it('Should refuse a month above twelve', () => {
    expect(parseDisplayDate('12/13/2026')).toBeNull()
  })

  it('Should accept the twenty ninth of February in a leap year', () => {
    expect(parseDisplayDate('29/02/2028')).toBe('2028-02-29')
  })

  it('Should refuse anything that is not the eight digit form', () => {
    expect(parseDisplayDate('2026-03-12')).toBeNull()
    expect(parseDisplayDate('1/3/2026')).toBeNull()
    expect(parseDisplayDate('')).toBeNull()
  })
})
