import { describe, expect, it } from 'vitest'
import { PROJECT_EVENT_TYPES } from '@/domain/schemas/projectEventSchema'
import { buildProjectEvent } from '@/domain/testing/entityBuilders'
import { buildProjectRow } from '@/domain/testing/projectRowBuilders'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { ProjectActivity } from './dashboardActivity'
import { buildEventTypeCounts, sumEvents } from './eventCounts'

const PERIOD = { start: '2026-06-01', end: '2026-08-31' }

function buildActivity(events: readonly ProjectEvent[]): ProjectActivity {
  return {
    row: buildProjectRow(),
    tasksInPeriod: [],
    events,
    eventsInPeriod: [],
    allocationsInPeriod: [],
    blockedDays: 0,
  }
}

describe('buildEventTypeCounts', () => {
  it('Should draw one column per event type, in the order of the schema', () => {
    const counts = buildEventTypeCounts([buildActivity([])], PERIOD)

    expect(counts.map((entry) => entry.type)).toEqual([...PROJECT_EVENT_TYPES])
  })

  it('Should keep at zero the type nobody registered, instead of dropping its column', () => {
    const counts = buildEventTypeCounts(
      [buildActivity([buildProjectEvent({ type: 'decision', eventDate: '2026-07-01' })])],
      PERIOD,
    )

    expect(counts.find((entry) => entry.type === 'unblock')?.count).toBe(0)
  })

  it('Should count only the events dated inside the window', () => {
    const counts = buildEventTypeCounts(
      [
        buildActivity([
          buildProjectEvent({ id: 'in', type: 'risk', eventDate: '2026-07-01' }),
          buildProjectEvent({ id: 'out', type: 'risk', eventDate: '2026-05-01' }),
        ]),
      ],
      PERIOD,
    )

    expect(counts.find((entry) => entry.type === 'risk')?.count).toBe(1)
  })

  it('Should add up the events of every project with activity', () => {
    const counts = buildEventTypeCounts(
      [
        buildActivity([buildProjectEvent({ id: 'a', type: 'block', eventDate: '2026-07-01' })]),
        buildActivity([buildProjectEvent({ id: 'b', type: 'block', eventDate: '2026-08-01' })]),
      ],
      PERIOD,
    )

    expect(counts.find((entry) => entry.type === 'block')?.count).toBe(2)
  })
})

describe('sumEvents', () => {
  it('Should total what the chart header prints', () => {
    const counts = buildEventTypeCounts(
      [
        buildActivity([
          buildProjectEvent({ id: 'a', type: 'block', eventDate: '2026-07-01' }),
          buildProjectEvent({ id: 'b', type: 'note', eventDate: '2026-07-02' }),
        ]),
      ],
      PERIOD,
    )

    expect(sumEvents(counts)).toBe(2)
  })
})
