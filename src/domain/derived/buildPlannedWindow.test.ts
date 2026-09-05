import { describe, expect, it } from 'vitest'
import { buildPlannedWindow } from './buildPlannedWindow'

describe('buildPlannedWindow', () => {
  it('Should return nothing while one of the ends is missing', () => {
    expect(buildPlannedWindow('2026-09-14', null)).toBeNull()
    expect(buildPlannedWindow(null, '2026-12-18')).toBeNull()
  })

  it('Should return nothing when the end precedes the start', () => {
    expect(buildPlannedWindow('2026-12-18', '2026-09-14')).toBeNull()
  })

  it('Should measure the fourteen weeks the design prints for the new project window', () => {
    expect(buildPlannedWindow('2026-09-14', '2026-12-18')).toEqual({
      period: { start: '2026-09-14', end: '2026-12-18' },
      weeks: 14,
    })
  })

  it('Should round a partial week up', () => {
    expect(buildPlannedWindow('2026-09-14', '2026-09-22')?.weeks).toBe(2)
  })

  it('Should call a single day one week instead of zero', () => {
    expect(buildPlannedWindow('2026-09-14', '2026-09-14')?.weeks).toBe(1)
  })
})
