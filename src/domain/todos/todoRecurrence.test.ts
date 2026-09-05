import { describe, expect, it } from 'vitest'
import { parseRecurrenceRule } from './todoRecurrence'

describe('parseRecurrenceRule', () => {
  it('lê a regra semanal do seed', () => {
    expect(parseRecurrenceRule('semanal-seg')).toEqual({
      frequency: 'weekly',
      weekday: 'monday',
    })
  })

  it('cobre os sete códigos de dia', () => {
    expect(parseRecurrenceRule('semanal-dom')?.weekday).toBe('sunday')
    expect(parseRecurrenceRule('semanal-sab')?.weekday).toBe('saturday')
  })

  it('devolve nulo para regra que não reconhece', () => {
    expect(parseRecurrenceRule('mensal-seg')).toBeNull()
    expect(parseRecurrenceRule('semanal')).toBeNull()
    expect(parseRecurrenceRule('semanal-xxx')).toBeNull()
  })
})
