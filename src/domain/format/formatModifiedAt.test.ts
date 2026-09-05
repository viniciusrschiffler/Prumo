import { describe, expect, it } from 'vitest'
import { formatModifiedAt } from './formatModifiedAt'

// Datas construídas pelo construtor local, para o teste não depender do fuso da máquina.
function localMoment(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute)
}

describe('formatModifiedAt', () => {
  it('Should print only the time for a file touched today', () => {
    const now = localMoment(2026, 9, 5, 18, 0)
    const moment = localMoment(2026, 9, 5, 14, 22)

    expect(formatModifiedAt(moment.toISOString(), now)).toBe('14:22')
  })

  it('Should pad the time to two digits', () => {
    const now = localMoment(2026, 9, 5, 18, 0)

    expect(formatModifiedAt(localMoment(2026, 9, 5, 9, 4).toISOString(), now)).toBe('09:04')
  })

  it('Should print the date for a file touched on another day', () => {
    const now = localMoment(2026, 9, 5, 18, 0)

    expect(formatModifiedAt(localMoment(2026, 3, 12, 14, 22).toISOString(), now)).toBe('12/03/2026')
  })

  it('Should print the date for the same day of another year', () => {
    const now = localMoment(2026, 9, 5, 18, 0)

    expect(formatModifiedAt(localMoment(2025, 9, 5, 14, 22).toISOString(), now)).toBe('05/09/2025')
  })

  it('Should report a dash when there is no timestamp', () => {
    expect(formatModifiedAt(null, localMoment(2026, 9, 5))).toBe('—')
  })

  it('Should report a dash for a timestamp that does not parse', () => {
    expect(formatModifiedAt('ontem', localMoment(2026, 9, 5))).toBe('—')
  })
})
