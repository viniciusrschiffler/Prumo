import { describe, expect, it } from 'vitest'
import type { Baseline } from '@/domain/schemas/baselineSchema'
import { selectCurrentBaseline } from './selectCurrentBaseline'

function buildBaseline(overrides: Partial<Baseline> = {}): Baseline {
  return {
    id: 'bl-gw-1',
    projectId: 'gateway',
    version: 1,
    createdAt: '2026-02-20T09:00:00Z',
    reason: 'plano inicial',
    ...overrides,
  }
}

describe('selectCurrentBaseline', () => {
  it('Should return nothing for a project with no baseline', () => {
    expect(selectCurrentBaseline([])).toBeNull()
  })

  it('Should return the only baseline of a project that was never replanned', () => {
    expect(selectCurrentBaseline([buildBaseline()])?.version).toBe(1)
  })

  it('Should return the highest version regardless of the order received', () => {
    const current = selectCurrentBaseline([
      buildBaseline({ id: 'bl-gw-2', version: 2, reason: 'mudança de escopo' }),
      buildBaseline({ id: 'bl-gw-1', version: 1 }),
    ])

    expect(current?.id).toBe('bl-gw-2')
  })
})
