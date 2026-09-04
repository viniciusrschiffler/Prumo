import { describe, expect, it } from 'vitest'
import { buildTask } from '@/domain/testing/entityBuilders'
import { calculateProgress } from './calculateProgress'
import { calculateTotalEffort } from './calculateTotalEffort'

describe('calculateTotalEffort', () => {
  it('Should sum the estimates of the tasks', () => {
    const tasks = [
      buildTask({ id: 'a', estimatedHours: 40 }),
      buildTask({ id: 'b', estimatedHours: 120 }),
    ]

    expect(calculateTotalEffort(tasks)).toBe(160)
  })

  it('Should treat a missing estimate as zero', () => {
    const tasks = [buildTask({ id: 'a', estimatedHours: null }), buildTask({ id: 'b', estimatedHours: 8 })]

    expect(calculateTotalEffort(tasks)).toBe(8)
  })

  it('Should ignore cancelled tasks', () => {
    const tasks = [
      buildTask({ id: 'a', estimatedHours: 40 }),
      buildTask({ id: 'b', estimatedHours: 999, status: 'cancelled' }),
    ]

    expect(calculateTotalEffort(tasks)).toBe(40)
  })
})

describe('calculateProgress', () => {
  it('Should weight by hours and not by task count', () => {
    const tasks = [
      buildTask({ id: 'a', estimatedHours: 10, status: 'done' }),
      buildTask({ id: 'b', estimatedHours: 90, status: 'todo' }),
    ]

    const progress = calculateProgress(tasks)

    expect(progress.ratio).toBe(0.1)
    expect(progress.completedHours).toBe(10)
    expect(progress.totalHours).toBe(100)
  })

  it('Should not count a task in progress as completed', () => {
    const tasks = [
      buildTask({ id: 'a', estimatedHours: 50, status: 'in_progress' }),
      buildTask({ id: 'b', estimatedHours: 50, status: 'todo' }),
    ]

    expect(calculateProgress(tasks).ratio).toBe(0)
  })

  it('Should keep a cancelled task out of the denominator', () => {
    const tasks = [
      buildTask({ id: 'a', estimatedHours: 40, status: 'done' }),
      buildTask({ id: 'b', estimatedHours: 40, status: 'cancelled' }),
    ]

    expect(calculateProgress(tasks).ratio).toBe(1)
  })

  it('Should report zero total when there is nothing to weigh', () => {
    const progress = calculateProgress([buildTask({ estimatedHours: null })])

    expect(progress).toEqual({ completedHours: 0, totalHours: 0, ratio: 0 })
  })
})
