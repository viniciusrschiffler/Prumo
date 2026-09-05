import { describe, expect, it } from 'vitest'
import { formatDeviation } from './formatDeviation'

describe('formatDeviation', () => {
  it('Should print a dash when there is no baseline to compare against', () => {
    expect(formatDeviation(null)).toBe('—')
  })

  it('Should print a dash for a project exactly on its baseline', () => {
    expect(formatDeviation(0)).toBe('—')
  })

  it('Should print the eleven days of delay the design shows', () => {
    expect(formatDeviation(11)).toBe('+11d')
  })

  it('Should print an advance with the typographic minus, as the design does', () => {
    expect(formatDeviation(-2)).toBe('−2d')
  })
})
