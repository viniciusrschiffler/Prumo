import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildProjectEvent } from '@/domain/testing/entityBuilders'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { buildEventFeed, type EventFeedEntry } from './eventFeed'
import { countEventsByFilter, filterEventFeed } from './eventFilters'

let gatewayFeed: EventFeedEntry[]

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()
  const snapshot = readProjectsSnapshot(database)

  gatewayFeed = buildEventFeed({
    events: snapshot.events.filter((event) => event.projectId === 'gateway'),
    eventTasks: snapshot.eventTasks,
    tasks: snapshot.tasks,
    baselines: snapshot.baselines,
    baselineTasks: snapshot.baselineTasks,
  })
})

describe('filterEventFeed', () => {
  it('Should keep every event under "Tudo"', () => {
    expect(filterEventFeed(gatewayFeed, 'all')).toHaveLength(8)
  })

  it('Should gather the block and its unblock under the same chip', () => {
    expect(filterEventFeed(gatewayFeed, 'blocks').map((entry) => entry.event.type)).toEqual([
      'unblock',
      'block',
    ])
  })

  it('Should list both decisions, the reverted one included', () => {
    expect(filterEventFeed(gatewayFeed, 'decisions').map((entry) => entry.event.id)).toEqual([
      'ev-gw-dec2',
      'ev-gw-dec1',
    ])
  })

  it('Should leave the note out of every chip but "Tudo"', () => {
    const withoutAll = countEventsByFilter(gatewayFeed)

    expect(withoutAll.decisions + withoutAll.scope + withoutAll.blocks).toBe(5)
    expect(gatewayFeed.some((entry) => entry.event.type === 'note')).toBe(true)
  })

  it('Should keep the order the feed already had', () => {
    const risks = filterEventFeed(
      buildEventFeed({
        events: [
          buildProjectEvent({ id: 'antigo', type: 'risk', eventDate: '2026-01-01' }),
          buildProjectEvent({ id: 'recente', type: 'risk', eventDate: '2026-08-01' }),
        ],
        eventTasks: [],
        tasks: [],
        baselines: [],
        baselineTasks: [],
      }),
      'risks',
    )

    expect(risks.map((entry) => entry.event.id)).toEqual(['recente', 'antigo'])
  })
})

describe('countEventsByFilter', () => {
  it('Should count each chip of the gateway history', () => {
    expect(countEventsByFilter(gatewayFeed)).toEqual({
      all: 8,
      decisions: 2,
      scope: 1,
      blocks: 2,
      reallocations: 1,
      risks: 1,
    })
  })

  it('Should count zero everywhere on an empty history', () => {
    expect(countEventsByFilter([])).toEqual({
      all: 0,
      decisions: 0,
      scope: 0,
      blocks: 0,
      reallocations: 0,
      risks: 0,
    })
  })
})
