import { describe, expect, it } from 'vitest'
import { toBarGeometry, toMarkerPercent, toOffsetDays } from './timelineGeometry'
import { buildTimelineWindow, type TimelineWindow } from './timelineWindow'

// A janela que o mockup desenha: 01/03 a 31/10, os 245 dias que o support.js chama de span.
const MOCKUP_WINDOW = buildTimelineWindow(
  [{ start: '2026-03-01', end: '2026-10-31' }],
  'month',
  '2026-09-03',
  'monday',
) as TimelineWindow

function rounded(value: number | undefined): number | undefined {
  return value === undefined ? undefined : Number(value.toFixed(2))
}

describe('toBarGeometry', () => {
  it('Should place the mockup bars exactly where the design prints them', () => {
    const provisioning = toBarGeometry(MOCKUP_WINDOW, { start: '2026-03-12', end: '2026-03-27' })
    const rewrite = toBarGeometry(MOCKUP_WINDOW, { start: '2026-03-30', end: '2026-05-15' })

    expect(MOCKUP_WINDOW.spanDays).toBe(245)
    expect(rounded(provisioning?.leftPercent)).toBe(4.49)
    expect(rounded(provisioning?.widthPercent)).toBe(6.12)
    expect(rounded(rewrite?.leftPercent)).toBe(11.84)
    expect(rounded(rewrite?.widthPercent)).toBe(18.78)
  })

  it('Should place the blocked stretch of the gateway where the design hatches it', () => {
    const blocked = toBarGeometry(MOCKUP_WINDOW, { start: '2026-07-22', end: '2026-07-30' })

    expect(rounded(blocked?.leftPercent)).toBe(58.37)
    expect(rounded(blocked?.widthPercent)).toBe(3.27)
  })

  it('Should clip a period that starts before the window', () => {
    const geometry = toBarGeometry(MOCKUP_WINDOW, { start: '2026-01-10', end: '2026-03-16' })

    expect(geometry?.leftPercent).toBe(0)
    expect(rounded(geometry?.widthPercent)).toBe(6.12)
  })

  it('Should clip a period that runs past the window', () => {
    const geometry = toBarGeometry(MOCKUP_WINDOW, { start: '2026-10-01', end: '2026-12-20' })

    expect(rounded((geometry?.leftPercent ?? 0) + (geometry?.widthPercent ?? 0))).toBe(100)
  })

  it('Should have nothing to draw for a period entirely outside the window', () => {
    expect(toBarGeometry(MOCKUP_WINDOW, { start: '2025-01-01', end: '2025-02-01' })).toBeNull()
    expect(toBarGeometry(MOCKUP_WINDOW, { start: '2027-01-01', end: '2027-02-01' })).toBeNull()
  })

  it('Should give no width to a period that starts and ends on the same day', () => {
    const geometry = toBarGeometry(MOCKUP_WINDOW, { start: '2026-05-04', end: '2026-05-04' })

    expect(geometry?.widthPercent).toBe(0)
  })
})

describe('toMarkerPercent', () => {
  it('Should put the today marker where the design draws the accent line', () => {
    expect(rounded(toMarkerPercent(MOCKUP_WINDOW, '2026-09-03') ?? undefined)).toBe(75.92)
  })

  it('Should have no marker for a date outside the window', () => {
    expect(toMarkerPercent(MOCKUP_WINDOW, '2026-02-28')).toBeNull()
    expect(toMarkerPercent(MOCKUP_WINDOW, '2026-11-01')).toBeNull()
  })
})

describe('toOffsetDays', () => {
  it('Should turn the fraction of the track dragged into whole days', () => {
    expect(toOffsetDays(MOCKUP_WINDOW, 0)).toBe(0)
    expect(toOffsetDays(MOCKUP_WINDOW, 1)).toBe(245)
    expect(toOffsetDays(MOCKUP_WINDOW, -0.2)).toBe(-49)
  })
})
