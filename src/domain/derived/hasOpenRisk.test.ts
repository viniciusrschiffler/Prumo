import { describe, expect, it } from 'vitest'
import { buildProjectEvent } from '@/domain/testing/entityBuilders'
import { hasOpenRisk } from './hasOpenRisk'

describe('hasOpenRisk', () => {
  it('Should report no risk for a project with no event', () => {
    expect(hasOpenRisk([])).toBe(false)
  })

  it('Should report risk when one event still has it open', () => {
    expect(
      hasOpenRisk([
        buildProjectEvent({ id: 'a', type: 'note' }),
        buildProjectEvent({ id: 'b', type: 'risk', riskOpen: true }),
      ]),
    ).toBe(true)
  })

  it('Should not report risk for a risk event that was already closed', () => {
    expect(hasOpenRisk([buildProjectEvent({ type: 'risk', riskOpen: false })])).toBe(false)
  })
})
