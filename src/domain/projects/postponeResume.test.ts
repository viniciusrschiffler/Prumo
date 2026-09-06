import { describe, expect, it } from 'vitest'
import { buildResumePostponement, validatePostponeResume } from './postponeResume'

const TODAY = '2026-09-03'

describe('Validação', () => {
  it('Should ask for a date', () => {
    expect(validatePostponeResume({ blockEventId: 'ev', expectedResumeAt: null }, TODAY)).toBe(
      'Informe a nova data de retomada.',
    )
  })

  it('Should refuse a resume in the past, which would be born already expired', () => {
    expect(
      validatePostponeResume({ blockEventId: 'ev', expectedResumeAt: '2026-08-26' }, TODAY),
    ).toBe('A nova retomada não pode ser no passado.')
  })

  it('Should accept today and any day after it', () => {
    expect(
      validatePostponeResume({ blockEventId: 'ev', expectedResumeAt: TODAY }, TODAY),
    ).toBeNull()
    expect(
      validatePostponeResume({ blockEventId: 'ev', expectedResumeAt: '2026-09-20' }, TODAY),
    ).toBeNull()
  })
})

describe('Adiamento', () => {
  it('Should carry the block event and the new date', () => {
    expect(
      buildResumePostponement({ blockEventId: 'ev-pp-block', expectedResumeAt: '2026-09-20' }),
    ).toEqual({ blockEventId: 'ev-pp-block', expectedResumeAt: '2026-09-20' })
  })

  it('Should build nothing without a date', () => {
    expect(buildResumePostponement({ blockEventId: 'ev', expectedResumeAt: null })).toBeNull()
  })
})
