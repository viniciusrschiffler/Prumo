import { describe, expect, it } from 'vitest'
import {
  formatDueLabel,
  formatShortDate,
  formatWeekdayShortDate,
} from './dueLabel'

const TODAY = '2026-09-03'

describe('formatDueLabel', () => {
  it('Should write a late todo as a deviation in days', () => {
    expect(formatDueLabel('2026-08-30', TODAY)).toBe('+4d')
  })

  it('Should name today and tomorrow instead of showing a date', () => {
    expect(formatDueLabel(TODAY, TODAY)).toBe('hoje')
    expect(formatDueLabel('2026-09-04', TODAY)).toBe('amanhã')
  })

  it('Should show the short date from the third day on', () => {
    expect(formatDueLabel('2026-09-05', TODAY)).toBe('05/09')
  })

  it('Should return the text of the design when there is no date', () => {
    expect(formatDueLabel(null, TODAY)).toBe('sem data')
  })
})

describe('formatShortDate', () => {
  it('Should turn the ISO date into day and month', () => {
    expect(formatShortDate('2026-09-03')).toBe('03/09')
  })
})

describe('formatWeekdayShortDate', () => {
  it('Should prefix the abbreviated weekday', () => {
    expect(formatWeekdayShortDate('2026-09-03')).toBe('qui, 03/09')
    expect(formatWeekdayShortDate('2026-09-06')).toBe('dom, 06/09')
  })
})
