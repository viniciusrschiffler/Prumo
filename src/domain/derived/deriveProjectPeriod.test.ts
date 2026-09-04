import { describe, expect, it } from 'vitest'
import { buildBaselineTask, buildTask } from '@/domain/testing/entityBuilders'
import { calculateDeviationInDays, isDelayed } from './calculateDeviationInDays'
import { deriveBaselinePeriod, deriveProjectPeriod } from './deriveProjectPeriod'

describe('deriveProjectPeriod', () => {
  it('Should take the earliest start and the latest end across tasks', () => {
    const tasks = [
      buildTask({ id: 'a', plannedStart: '2026-03-12', plannedEnd: '2026-05-15' }),
      buildTask({ id: 'b', plannedStart: '2026-02-02', plannedEnd: '2026-04-01' }),
      buildTask({ id: 'c', plannedStart: '2026-04-10', plannedEnd: '2026-09-29' }),
    ]

    expect(deriveProjectPeriod(tasks)).toEqual({ start: '2026-02-02', end: '2026-09-29' })
  })

  it('Should prefer the actual dates over the planned ones', () => {
    const tasks = [
      buildTask({
        plannedStart: '2026-03-01',
        plannedEnd: '2026-03-10',
        actualStart: '2026-03-05',
        actualEnd: '2026-03-25',
      }),
    ]

    expect(deriveProjectPeriod(tasks)).toEqual({ start: '2026-03-05', end: '2026-03-25' })
  })

  it('Should ignore a cancelled task that would stretch the project', () => {
    const tasks = [
      buildTask({ id: 'a', plannedStart: '2026-03-01', plannedEnd: '2026-03-10' }),
      buildTask({
        id: 'b',
        status: 'cancelled',
        plannedStart: '2026-01-01',
        plannedEnd: '2026-12-31',
      }),
    ]

    expect(deriveProjectPeriod(tasks)).toEqual({ start: '2026-03-01', end: '2026-03-10' })
  })

  it('Should return null when no task has both boundaries', () => {
    expect(deriveProjectPeriod([buildTask({ plannedStart: null, plannedEnd: null })])).toBeNull()
    expect(deriveProjectPeriod([])).toBeNull()
  })
})

describe('deriveBaselinePeriod', () => {
  it('Should span the frozen planned dates', () => {
    const baselineTasks = [
      buildBaselineTask({ taskId: 'a', plannedStart: '2026-03-12', plannedEnd: '2026-05-04' }),
      buildBaselineTask({ taskId: 'b', plannedStart: '2026-04-01', plannedEnd: '2026-09-18' }),
    ]

    expect(deriveBaselinePeriod(baselineTasks)).toEqual({
      start: '2026-03-12',
      end: '2026-09-18',
    })
  })
})

describe('calculateDeviationInDays', () => {
  it('Should report a positive deviation when the project ends later than the baseline', () => {
    expect(calculateDeviationInDays('2026-09-29', '2026-09-18')).toBe(11)
  })

  it('Should report a negative deviation when the project ends earlier', () => {
    expect(calculateDeviationInDays('2026-09-16', '2026-09-18')).toBe(-2)
  })

  it('Should return null when either end is unknown', () => {
    expect(calculateDeviationInDays(null, '2026-09-18')).toBeNull()
    expect(calculateDeviationInDays('2026-09-18', null)).toBeNull()
  })
})

describe('isDelayed', () => {
  it('Should treat only a positive deviation as delayed', () => {
    expect(isDelayed(11)).toBe(true)
    expect(isDelayed(0)).toBe(false)
    expect(isDelayed(-2)).toBe(false)
    expect(isDelayed(null)).toBe(false)
  })
})
