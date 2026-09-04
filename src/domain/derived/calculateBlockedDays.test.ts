import { describe, expect, it } from 'vitest'
import { buildProjectEvent, buildTask } from '@/domain/testing/entityBuilders'
import { calculateAverageDaysPerPhase } from './calculateAverageDaysPerPhase'
import { calculateBlockedDays } from './calculateBlockedDays'
import { countEventsByType } from './countEventsByType'

const QUARTER = { start: '2026-01-01', end: '2026-03-31' }

describe('calculateBlockedDays', () => {
  it('Should measure the interval between a block and its unblock', () => {
    const events = [
      buildProjectEvent({ id: '1', type: 'block', eventDate: '2026-02-02' }),
      buildProjectEvent({ id: '2', type: 'unblock', eventDate: '2026-02-12' }),
    ]

    expect(calculateBlockedDays(events, QUARTER)).toBe(10)
  })

  it('Should add up separate blocking windows', () => {
    const events = [
      buildProjectEvent({ id: '1', type: 'block', eventDate: '2026-01-05' }),
      buildProjectEvent({ id: '2', type: 'unblock', eventDate: '2026-01-10' }),
      buildProjectEvent({ id: '3', type: 'block', eventDate: '2026-03-01' }),
      buildProjectEvent({ id: '4', type: 'unblock', eventDate: '2026-03-04' }),
    ]

    expect(calculateBlockedDays(events, QUARTER)).toBe(8)
  })

  it('Should keep an open block running until the end of the period', () => {
    const events = [buildProjectEvent({ id: '1', type: 'block', eventDate: '2026-03-21' })]

    expect(calculateBlockedDays(events, QUARTER)).toBe(10)
  })

  it('Should clamp a block that started before the period', () => {
    const events = [
      buildProjectEvent({ id: '1', type: 'block', eventDate: '2025-12-01' }),
      buildProjectEvent({ id: '2', type: 'unblock', eventDate: '2026-01-11' }),
    ]

    expect(calculateBlockedDays(events, QUARTER)).toBe(10)
  })

  it('Should ignore a second block while already blocked', () => {
    const events = [
      buildProjectEvent({ id: '1', type: 'block', eventDate: '2026-02-01' }),
      buildProjectEvent({ id: '2', type: 'block', eventDate: '2026-02-05' }),
      buildProjectEvent({ id: '3', type: 'unblock', eventDate: '2026-02-11' }),
    ]

    expect(calculateBlockedDays(events, QUARTER)).toBe(10)
  })

  it('Should read events out of order and count zero for a same day block and unblock', () => {
    const events = [
      buildProjectEvent({ id: '2', type: 'unblock', eventDate: '2026-02-10' }),
      buildProjectEvent({ id: '1', type: 'block', eventDate: '2026-02-10' }),
    ]

    expect(calculateBlockedDays(events, QUARTER)).toBe(0)
  })

  it('Should ignore events that are not about blocking', () => {
    const events = [buildProjectEvent({ id: '1', type: 'risk', eventDate: '2026-02-01' })]

    expect(calculateBlockedDays(events, QUARTER)).toBe(0)
  })
})

describe('calculateAverageDaysPerPhase', () => {
  it('Should average the task duration inside each phase', () => {
    const tasks = [
      buildTask({
        id: 'a',
        phaseId: 'development',
        plannedStart: '2026-03-01',
        plannedEnd: '2026-03-11',
      }),
      buildTask({
        id: 'b',
        phaseId: 'development',
        plannedStart: '2026-03-01',
        plannedEnd: '2026-03-21',
      }),
      buildTask({
        id: 'c',
        phaseId: 'production',
        plannedStart: '2026-04-01',
        plannedEnd: '2026-04-05',
      }),
    ]

    expect(calculateAverageDaysPerPhase(tasks)).toEqual([
      { phaseId: 'development', averageDays: 15, taskCount: 2 },
      { phaseId: 'production', averageDays: 4, taskCount: 1 },
    ])
  })

  it('Should skip a task without both boundaries', () => {
    const tasks = [
      buildTask({ id: 'a', plannedStart: '2026-03-01', plannedEnd: null }),
      buildTask({ id: 'b', plannedStart: '2026-03-01', plannedEnd: '2026-03-05' }),
    ]

    expect(calculateAverageDaysPerPhase(tasks)).toEqual([
      { phaseId: 'development', averageDays: 4, taskCount: 1 },
    ])
  })
})

describe('countEventsByType', () => {
  it('Should count by type and report zero for the untouched ones', () => {
    const events = [
      buildProjectEvent({ id: '1', type: 'decision', eventDate: '2026-01-10' }),
      buildProjectEvent({ id: '2', type: 'decision', eventDate: '2026-02-10' }),
      buildProjectEvent({ id: '3', type: 'risk', eventDate: '2026-03-10' }),
    ]

    expect(countEventsByType(events, QUARTER)).toEqual({
      decision: 2,
      scope_change: 0,
      block: 0,
      unblock: 0,
      reallocation: 0,
      risk: 1,
      note: 0,
    })
  })

  it('Should leave out events from outside the period', () => {
    const events = [
      buildProjectEvent({ id: '1', type: 'decision', eventDate: '2025-12-31' }),
      buildProjectEvent({ id: '2', type: 'decision', eventDate: '2026-04-01' }),
      buildProjectEvent({ id: '3', type: 'decision', eventDate: '2026-01-01' }),
    ]

    expect(countEventsByType(events, QUARTER).decision).toBe(1)
  })
})
