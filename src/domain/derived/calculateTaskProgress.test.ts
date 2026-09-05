import { describe, expect, it } from 'vitest'
import { buildTask } from '@/domain/testing/entityBuilders'
import { calculateTaskProgress } from './calculateTaskProgress'

describe('calculateTaskProgress', () => {
  it('Should report zero for a project with no task', () => {
    expect(calculateTaskProgress([])).toEqual({ doneCount: 0, countedCount: 0, ratio: 0 })
  })

  it('Should count one done task out of four as a quarter', () => {
    const progress = calculateTaskProgress([
      buildTask({ id: 'a', status: 'done' }),
      buildTask({ id: 'b', status: 'in_progress' }),
      buildTask({ id: 'c', status: 'todo' }),
      buildTask({ id: 'd', status: 'todo' }),
    ])

    expect(progress).toEqual({ doneCount: 1, countedCount: 4, ratio: 0.25 })
  })

  it('Should leave a cancelled task out of both the numerator and the denominator', () => {
    const progress = calculateTaskProgress([
      buildTask({ id: 'a', status: 'done' }),
      buildTask({ id: 'b', status: 'cancelled' }),
    ])

    expect(progress).toEqual({ doneCount: 1, countedCount: 1, ratio: 1 })
  })

  it('Should treat a blocked task as pending, not as done', () => {
    expect(calculateTaskProgress([buildTask({ status: 'blocked' })]).ratio).toBe(0)
  })

  it('Should report zero when every task was cancelled', () => {
    expect(calculateTaskProgress([buildTask({ status: 'cancelled' })])).toEqual({
      doneCount: 0,
      countedCount: 0,
      ratio: 0,
    })
  })
})
