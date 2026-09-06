import { describe, expect, it } from 'vitest'
import { buildTimelineWindow } from './timelineWindow'

const TODAY = '2026-09-03'
const SEED_PERIODS = [
  { start: '2026-03-12', end: '2026-09-29' },
  { start: '2026-02-02', end: '2026-03-16' },
  { start: '2026-07-01', end: '2026-10-02' },
  { start: '2026-06-01', end: '2026-09-11' },
]

describe('buildTimelineWindow', () => {
  it('Should have nothing to draw when no period was given', () => {
    expect(buildTimelineWindow([], 'month', TODAY, 'monday')).toBeNull()
  })

  it('Should snap the month window to whole months around every period', () => {
    const window = buildTimelineWindow(SEED_PERIODS, 'month', TODAY, 'monday')

    expect(window?.period).toEqual({ start: '2026-02-01', end: '2026-10-31' })
    expect(window?.spanDays).toBe(273)
    expect(window?.ticks).toHaveLength(9)
  })

  it('Should size each month tick by its real length', () => {
    const window = buildTimelineWindow(SEED_PERIODS, 'month', TODAY, 'monday')

    expect(window?.ticks.map((tick) => tick.days)).toEqual([28, 31, 30, 31, 30, 31, 31, 30, 31])
    expect(window?.ticks.map((tick) => tick.offsetDays)).toEqual([
      0, 28, 59, 89, 120, 150, 181, 212, 242,
    ])
  })

  it('Should mark as current only the tick that holds today', () => {
    const window = buildTimelineWindow(SEED_PERIODS, 'month', TODAY, 'monday')

    expect(window?.ticks.filter((tick) => tick.isCurrent).map((tick) => tick.start)).toEqual([
      '2026-09-01',
    ])
  })

  it('Should snap the week window to the first weekday of the settings', () => {
    const period = [{ start: '2026-09-03', end: '2026-09-10' }]

    expect(buildTimelineWindow(period, 'week', TODAY, 'monday')?.period).toEqual({
      start: '2026-08-31',
      end: '2026-09-13',
    })
    expect(buildTimelineWindow(period, 'week', TODAY, 'sunday')?.period).toEqual({
      start: '2026-08-30',
      end: '2026-09-12',
    })
  })

  it('Should snap the quarter window to whole quarters', () => {
    const window = buildTimelineWindow(SEED_PERIODS, 'quarter', TODAY, 'monday')

    expect(window?.period).toEqual({ start: '2026-01-01', end: '2026-12-31' })
    expect(window?.ticks.map((tick) => tick.start)).toEqual([
      '2026-01-01',
      '2026-04-01',
      '2026-07-01',
      '2026-10-01',
    ])
  })

  it('Should stretch the window to today when every period is in the past', () => {
    const window = buildTimelineWindow(
      [{ start: '2026-01-05', end: '2026-01-20' }],
      'month',
      TODAY,
      'monday',
    )

    expect(window?.period).toEqual({ start: '2026-01-01', end: '2026-09-30' })
  })

  it('Should cover a period that ends after today', () => {
    const window = buildTimelineWindow(
      [{ start: '2026-11-02', end: '2026-12-04' }],
      'month',
      TODAY,
      'monday',
    )

    expect(window?.period).toEqual({ start: '2026-09-01', end: '2026-12-31' })
  })
})
