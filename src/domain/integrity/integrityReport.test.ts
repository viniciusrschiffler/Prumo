import { describe, expect, it } from 'vitest'
import {
  describeIntegrityReport,
  parseIntegrityProblems,
  serializeIntegrityProblems,
} from './integrityReport'

const NOW = new Date(2026, 8, 5, 18, 0)

function checkedToday(hour: number, minute: number): string {
  return new Date(2026, 8, 5, hour, minute).toISOString()
}

describe('describeIntegrityReport', () => {
  it('Should report that nothing was checked yet', () => {
    expect(describeIntegrityReport(null, NOW)).toBe('nunca verificado')
  })

  it('Should print the line the design shows when there is no problem', () => {
    expect(
      describeIntegrityReport({ checkedAt: checkedToday(14, 22), problems: [] }, NOW),
    ).toBe('verificado 14:22 · sem erros')
  })

  it('Should say problem in the singular for a single one', () => {
    expect(
      describeIntegrityReport({ checkedAt: checkedToday(14, 22), problems: ['note: falta'] }, NOW),
    ).toBe('verificado 14:22 · 1 problema')
  })

  it('Should say problems in the plural for more than one', () => {
    expect(
      describeIntegrityReport({ checkedAt: checkedToday(14, 22), problems: ['a', 'b'] }, NOW),
    ).toBe('verificado 14:22 · 2 problemas')
  })

  it('Should print the date for a check made on another day', () => {
    const checkedAt = new Date(2026, 2, 12, 14, 22).toISOString()

    expect(describeIntegrityReport({ checkedAt, problems: [] }, NOW)).toBe(
      'verificado 12/03/2026 · sem erros',
    )
  })
})

describe('integrity problems round trip', () => {
  it('Should store the absence of problems as ok', () => {
    expect(serializeIntegrityProblems([])).toBe('ok')
    expect(parseIntegrityProblems('ok')).toEqual([])
  })

  it('Should round trip a list of problems', () => {
    const problems = ['foreign_key_check: task', 'notas/decisao.md não está no disco']

    expect(parseIntegrityProblems(serializeIntegrityProblems(problems))).toEqual(problems)
  })

  it('Should read an empty value as no problem', () => {
    expect(parseIntegrityProblems('')).toEqual([])
  })
})
