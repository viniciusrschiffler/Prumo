import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildProjectEvent } from '@/domain/testing/entityBuilders'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { buildEventFeed, paginateEventFeed, type EventFeedEntry } from './eventFeed'
import type { ProjectsSnapshot } from './projectRow'

function feedOf(snapshot: ProjectsSnapshot, projectId: string): EventFeedEntry[] {
  return buildEventFeed({
    events: snapshot.events.filter((event) => event.projectId === projectId),
    eventTasks: snapshot.eventTasks,
    tasks: snapshot.tasks,
    baselines: snapshot.baselines,
    baselineTasks: snapshot.baselineTasks,
  })
}

let gatewayFeed: EventFeedEntry[]

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  gatewayFeed = feedOf(readProjectsSnapshot(database), 'gateway')
})

describe('buildEventFeed sobre o seed', () => {
  it('Should put the most recent event first', () => {
    expect(gatewayFeed.map((entry) => entry.event.eventDate)).toEqual([
      '2026-09-03',
      '2026-08-28',
      '2026-08-21',
      '2026-08-12',
      '2026-08-05',
      '2026-07-30',
      '2026-07-22',
      '2026-07-14',
    ])
  })

  it('Should link the decision to the one it reverts', () => {
    const reverting = gatewayFeed.find((entry) => entry.event.id === 'ev-gw-dec2')

    expect(reverting?.reverts).toMatchObject({
      id: 'ev-gw-dec1',
      eventDate: '2026-07-14',
    })
  })

  it('Should leave every other event without a reverted one', () => {
    const withReverts = gatewayFeed.filter((entry) => entry.reverts !== null)

    expect(withReverts).toHaveLength(1)
  })

  it('Should list the two tasks the reallocation touches', () => {
    const reallocation = gatewayFeed.find((entry) => entry.event.id === 'ev-gw-realloc')

    expect(reallocation?.tasks.map((task) => task.title)).toEqual([
      'Rewrite do roteador de pagamentos',
      'Testes de carga',
    ])
  })

  it('Should say the scope change froze the second baseline, with the 240h to 320h of the design', () => {
    const scopeChange = gatewayFeed.find((entry) => entry.event.id === 'ev-gw-scope')

    expect(scopeChange?.frozenBaseline).toEqual({
      version: 2,
      effortBefore: 240,
      effortAfter: 320,
      endBefore: '2026-06-26',
      endAfter: '2026-09-18',
    })
  })

  it('Should count the eight blocked days on the unblock, as the design bar says', () => {
    const unblock = gatewayFeed.find((entry) => entry.event.id === 'ev-gw-unblock')

    expect(unblock?.blockedDays).toBe(8)
  })

  it('Should leave the block itself without a day count, it has no end to measure', () => {
    const block = gatewayFeed.find((entry) => entry.event.id === 'ev-gw-block')

    expect(block?.blockedDays).toBeNull()
  })

  it('Should keep the open risk of the project readable on its event', () => {
    const risk = gatewayFeed.find((entry) => entry.event.id === 'ev-gw-risk')

    expect(risk?.event.riskOpen).toBe(true)
  })
})

describe('buildEventFeed', () => {
  it('Should return nothing for a project with no event', () => {
    expect(
      buildEventFeed({ events: [], eventTasks: [], tasks: [], baselines: [], baselineTasks: [] }),
    ).toEqual([])
  })

  it('Should break a tie of same day by the moment each was written', () => {
    const feed = buildEventFeed({
      events: [
        buildProjectEvent({ id: 'antes', createdAt: '2026-03-01T09:00:00Z' }),
        buildProjectEvent({ id: 'depois', createdAt: '2026-03-01T18:00:00Z' }),
      ],
      eventTasks: [],
      tasks: [],
      baselines: [],
      baselineTasks: [],
    })

    expect(feed.map((entry) => entry.event.id)).toEqual(['depois', 'antes'])
  })

  it('Should not claim a frozen baseline when no baseline shares the instant', () => {
    const feed = buildEventFeed({
      events: [buildProjectEvent({ type: 'scope_change' })],
      eventTasks: [],
      tasks: [],
      baselines: [
        {
          id: 'bl-1',
          projectId: 'project-1',
          version: 1,
          createdAt: '2026-01-01T09:00:00Z',
          reason: 'plano inicial',
        },
      ],
      baselineTasks: [],
    })

    expect(feed[0]?.frozenBaseline).toBeNull()
  })
})

describe('paginateEventFeed', () => {
  it('Should show the first seven and hold the eighth back', () => {
    const page = paginateEventFeed(gatewayFeed, 1)

    expect(page.visible).toHaveLength(7)
    expect(page.remainingCount).toBe(1)
  })

  it('Should show everything on the second page', () => {
    const page = paginateEventFeed(gatewayFeed, 2)

    expect(page.visible).toHaveLength(8)
    expect(page.remainingCount).toBe(0)
  })

  it('Should never hide everything when asked for less than one page', () => {
    expect(paginateEventFeed(gatewayFeed, 0).visible).toHaveLength(7)
  })
})
