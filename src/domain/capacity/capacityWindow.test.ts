import { describe, expect, it } from 'vitest'
import { buildCapacityWindow, CAPACITY_WEEK_COUNT, spanWeeks } from './capacityWindow'

describe('buildCapacityWindow', () => {
  it('Should open the window on the week that holds today', () => {
    const window = buildCapacityWindow('2026-09-03', 'monday')

    expect(window.weeks[0]?.period).toEqual({ start: '2026-08-31', end: '2026-09-06' })
    expect(window.weeks[0]?.isCurrent).toBe(true)
  })

  it('Should cover the twelve weeks the screen prints', () => {
    const window = buildCapacityWindow('2026-09-03', 'monday')

    expect(window.weeks).toHaveLength(CAPACITY_WEEK_COUNT)
    expect(window.period).toEqual({ start: '2026-08-31', end: '2026-11-22' })
  })

  it('Should number the weeks from S36 to S47, as the design header does', () => {
    const window = buildCapacityWindow('2026-09-03', 'monday')

    expect(window.weeks.map((week) => week.number)).toEqual([
      36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
    ])
  })

  it('Should follow the week start of the settings', () => {
    const window = buildCapacityWindow('2026-09-03', 'sunday')

    expect(window.weeks[0]?.period).toEqual({ start: '2026-08-30', end: '2026-09-05' })
    expect(window.weeks[0]?.number).toBe(36)
  })

  it('Should keep only the current week marked', () => {
    const window = buildCapacityWindow('2026-09-03', 'monday')

    expect(window.weeks.filter((week) => week.isCurrent)).toHaveLength(1)
  })
})

describe('spanWeeks', () => {
  it('Should join the boundaries of two weeks into one period', () => {
    const window = buildCapacityWindow('2026-09-03', 'monday')

    expect(spanWeeks(window, 1, 4)).toEqual({ start: '2026-09-07', end: '2026-10-04' })
  })

  it('Should return nothing when an index falls outside the window', () => {
    const window = buildCapacityWindow('2026-09-03', 'monday')

    expect(spanWeeks(window, 0, CAPACITY_WEEK_COUNT)).toBeNull()
  })
})
