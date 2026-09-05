import { describe, expect, it } from 'vitest'
import {
  formatDueLabel,
  formatShortDate,
  formatWeekdayShortDate,
} from './dueLabel'

const TODAY = '2026-09-03'

describe('formatDueLabel', () => {
  it('escreve o atraso como desvio em dias', () => {
    expect(formatDueLabel('2026-08-30', TODAY)).toBe('+4d')
  })

  it('nomeia hoje e amanhã', () => {
    expect(formatDueLabel(TODAY, TODAY)).toBe('hoje')
    expect(formatDueLabel('2026-09-04', TODAY)).toBe('amanhã')
  })

  it('mostra a data curta a partir do terceiro dia', () => {
    expect(formatDueLabel('2026-09-05', TODAY)).toBe('05/09')
  })

  it('devolve o texto do design quando não há data', () => {
    expect(formatDueLabel(null, TODAY)).toBe('sem data')
  })
})

describe('formatShortDate', () => {
  it('inverte a data ISO em dia e mês', () => {
    expect(formatShortDate('2026-09-03')).toBe('03/09')
  })
})

describe('formatWeekdayShortDate', () => {
  it('prefixa o dia da semana abreviado', () => {
    expect(formatWeekdayShortDate('2026-09-03')).toBe('qui, 03/09')
    expect(formatWeekdayShortDate('2026-09-06')).toBe('dom, 06/09')
  })
})
