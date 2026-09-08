import { describe, expect, it } from 'vitest'
import { buildDashboardPeriod, listWeeksIn } from './dashboardPeriod'

const TODAY = '2026-09-03'

describe('buildDashboardPeriod', () => {
  it('Should close the window on today, because the dashboard measures what already happened', () => {
    expect(buildDashboardPeriod(TODAY, '30d').end).toBe(TODAY)
    expect(buildDashboardPeriod(TODAY, '90d').end).toBe(TODAY)
    expect(buildDashboardPeriod(TODAY, '12m').end).toBe(TODAY)
  })

  it('Should open the three windows on the dates the design subhead prints', () => {
    expect(buildDashboardPeriod(TODAY, '30d').start).toBe('2026-08-04')
    expect(buildDashboardPeriod(TODAY, '90d').start).toBe('2026-06-05')
    expect(buildDashboardPeriod(TODAY, '12m').start).toBe('2025-09-03')
  })

  it('Should count the twelve months as months, so a leap year does not shorten the window', () => {
    expect(buildDashboardPeriod('2024-02-29', '12m').start).toBe('2023-02-28')
  })
})

describe('listWeeksIn', () => {
  it('Should start the first week before the window, so no half week is measured against a full one', () => {
    const weeks = listWeeksIn({ start: '2026-06-05', end: '2026-06-20' }, 'monday')

    expect(weeks[0]).toEqual({ start: '2026-06-01', end: '2026-06-07' })
  })

  it('Should follow the week start of the settings', () => {
    const weeks = listWeeksIn({ start: '2026-06-05', end: '2026-06-20' }, 'sunday')

    expect(weeks[0]).toEqual({ start: '2026-05-31', end: '2026-06-06' })
  })

  it('Should cover the last day of the window with a whole week', () => {
    const weeks = listWeeksIn({ start: '2026-06-05', end: '2026-06-20' }, 'monday')

    expect(weeks).toHaveLength(3)
    expect(weeks[weeks.length - 1]).toEqual({ start: '2026-06-15', end: '2026-06-21' })
  })
})
