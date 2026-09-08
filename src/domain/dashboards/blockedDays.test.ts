import { describe, expect, it } from 'vitest'
import { calculateBlockedDays } from '@/domain/derived/calculateBlockedDays'
import { buildProjectEvent } from '@/domain/testing/entityBuilders'
import { buildProjectRow } from '@/domain/testing/projectRowBuilders'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import type { ProjectActivity } from './dashboardActivity'
import { listBlockedDaysByProject, sumBlockedDays, sumBlockedDaysByMonth } from './blockedDays'

const EXTERNAL: Phase = {
  id: 'external',
  name: 'Homologação externa',
  sortOrder: 2,
  color: 'oklch(0.6 0.115 62)',
  active: true,
}

function buildActivity(
  project: { id: string; name: string },
  events: readonly ProjectEvent[],
  period: DatePeriod,
): ProjectActivity {
  return {
    row: buildProjectRow({ id: project.id, name: project.name }, { currentPhase: EXTERNAL }),
    tasksInPeriod: [],
    events,
    eventsInPeriod: [],
    allocationsInPeriod: [],
    blockedDays: calculateBlockedDays(events, period),
  }
}

function blockedBetween(start: string, end: string | null): ProjectEvent[] {
  const block = buildProjectEvent({ id: `block-${start}`, type: 'block', eventDate: start })

  if (end === null) {
    return [block]
  }

  return [block, buildProjectEvent({ id: `unblock-${end}`, type: 'unblock', eventDate: end })]
}

describe('sumBlockedDaysByMonth', () => {
  it('Should print one column per month of the window, including the months nobody was blocked', () => {
    const period = { start: '2026-06-05', end: '2026-09-03' }
    const months = sumBlockedDaysByMonth(
      [buildActivity({ id: 'portal', name: 'Portal do parceiro' }, blockedBetween('2026-08-12', null), period)],
      period,
    )

    expect(months.map((month) => month.monthStart)).toEqual([
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
      '2026-09-01',
    ])
    expect(months.map((month) => month.blockedDays)).toEqual([0, 0, 20, 2])
  })

  it('Should split a block that crosses the month boundary instead of counting the day twice', () => {
    const period = { start: '2026-07-01', end: '2026-08-31' }
    const activity = buildActivity(
      { id: 'gateway', name: 'Migração do gateway' },
      blockedBetween('2026-07-28', '2026-08-04'),
      period,
    )
    const months = sumBlockedDaysByMonth([activity], period)

    expect(months.map((month) => month.blockedDays)).toEqual([4, 3])
  })

  it('Should add up to exactly what calculateBlockedDays measures over the whole window', () => {
    const period = { start: '2026-06-05', end: '2026-09-03' }
    const events = blockedBetween('2026-07-22', '2026-07-30')
    const months = sumBlockedDaysByMonth(
      [buildActivity({ id: 'gateway', name: 'Migração do gateway' }, events, period)],
      period,
    )

    expect(months.reduce((total, month) => total + month.blockedDays, 0)).toBe(
      calculateBlockedDays(events, period),
    )
  })

  it('Should clip a block that started before the window to the window itself', () => {
    const period = { start: '2026-08-01', end: '2026-08-31' }
    const months = sumBlockedDaysByMonth(
      [buildActivity({ id: 'portal', name: 'Portal do parceiro' }, blockedBetween('2026-06-10', null), period)],
      period,
    )

    expect(months.map((month) => month.blockedDays)).toEqual([30])
  })
})

describe('listBlockedDaysByProject', () => {
  it('Should leave out the project that was never blocked in the window', () => {
    const period = { start: '2026-06-05', end: '2026-09-03' }
    const rows = listBlockedDaysByProject([
      buildActivity({ id: 'portal', name: 'Portal do parceiro' }, blockedBetween('2026-08-12', null), period),
      buildActivity({ id: 'field', name: 'App de campo v2' }, [], period),
    ])

    expect(rows.map((row) => row.name)).toEqual(['Portal do parceiro'])
  })

  it('Should order by blocked days and break the tie by name', () => {
    const period = { start: '2026-06-05', end: '2026-09-03' }
    const rows = listBlockedDaysByProject([
      buildActivity({ id: 'gateway', name: 'Migração do gateway' }, blockedBetween('2026-07-22', '2026-07-30'), period),
      buildActivity({ id: 'portal', name: 'Portal do parceiro' }, blockedBetween('2026-08-12', null), period),
    ])

    expect(rows.map((row) => [row.name, row.blockedDays])).toEqual([
      ['Portal do parceiro', 22],
      ['Migração do gateway', 8],
    ])
  })
})

describe('sumBlockedDays', () => {
  it('Should add the blocked days of every project with activity', () => {
    const period = { start: '2026-06-05', end: '2026-09-03' }

    expect(
      sumBlockedDays([
        buildActivity({ id: 'gateway', name: 'Migração do gateway' }, blockedBetween('2026-07-22', '2026-07-30'), period),
        buildActivity({ id: 'portal', name: 'Portal do parceiro' }, blockedBetween('2026-08-12', null), period),
      ]),
    ).toBe(30)
  })
})
