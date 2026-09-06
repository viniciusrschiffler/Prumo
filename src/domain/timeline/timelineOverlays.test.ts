import { describe, expect, it } from 'vitest'
import { buildProjectEvent } from '@/domain/testing/entityBuilders'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { collectBlockedOverlays, findPausedOverlay } from './timelineOverlays'

const TODAY = '2026-09-03'
const PERIOD = { start: '2026-07-01', end: '2026-10-02' }

describe('collectBlockedOverlays', () => {
  it('Should close the stretch on the unblock that ended it', () => {
    const events = [
      buildProjectEvent({ id: '1', type: 'block', eventDate: '2026-07-22' }),
      buildProjectEvent({ id: '2', type: 'unblock', eventDate: '2026-07-30' }),
    ]

    expect(collectBlockedOverlays(events, TODAY)).toEqual([
      { start: '2026-07-22', end: '2026-07-30' },
    ])
  })

  it('Should stop an open block at today, never past it', () => {
    const events = [buildProjectEvent({ id: '1', type: 'block', eventDate: '2026-08-11' })]

    expect(collectBlockedOverlays(events, TODAY)).toEqual([{ start: '2026-08-11', end: TODAY }])
  })

  it('Should hatch nothing for a block that starts after today', () => {
    const events = [buildProjectEvent({ id: '1', type: 'block', eventDate: '2026-09-20' })]

    expect(collectBlockedOverlays(events, TODAY)).toEqual([])
  })

  it('Should hatch nothing when the project was never blocked', () => {
    expect(collectBlockedOverlays([buildProjectEvent({ id: '1', type: 'note' })], TODAY)).toEqual([])
  })
})

describe('findPausedOverlay', () => {
  it('Should hatch from the moment the project was paused to the end of its period', () => {
    const project = buildProject({ status: 'paused', pausedAt: '2026-08-28T16:00:00Z' })

    expect(findPausedOverlay(project, PERIOD)).toEqual({ start: '2026-08-28', end: '2026-10-02' })
  })

  it('Should clip a pause older than the period to the period itself', () => {
    const project = buildProject({ status: 'paused', pausedAt: '2026-01-05T16:00:00Z' })

    expect(findPausedOverlay(project, PERIOD)).toEqual(PERIOD)
  })

  it('Should hatch nothing when the pause has no date recorded', () => {
    expect(findPausedOverlay(buildProject({ status: 'paused' }), PERIOD)).toBeNull()
  })

  it('Should hatch nothing for a project that is no longer paused', () => {
    const project = buildProject({ status: 'active', pausedAt: '2026-08-28T16:00:00Z' })

    expect(findPausedOverlay(project, PERIOD)).toBeNull()
  })

  it('Should hatch nothing when the project has no period to hatch over', () => {
    const project = buildProject({ status: 'paused', pausedAt: '2026-08-28T16:00:00Z' })

    expect(findPausedOverlay(project, null)).toBeNull()
  })
})
