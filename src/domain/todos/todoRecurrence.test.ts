import { describe, expect, it } from 'vitest'
import { parseRecurrenceRule } from './todoRecurrence'

describe('parseRecurrenceRule', () => {
  it('Should read the weekly rule of the seed', () => {
    expect(parseRecurrenceRule('semanal-seg')).toEqual({
      frequency: 'weekly',
      weekday: 'monday',
    })
  })

  it('Should cover the seven weekday codes', () => {
    expect(parseRecurrenceRule('semanal-dom')?.weekday).toBe('sunday')
    expect(parseRecurrenceRule('semanal-sab')?.weekday).toBe('saturday')
  })

  it('Should return null for a rule it does not recognize', () => {
    expect(parseRecurrenceRule('mensal-seg')).toBeNull()
    expect(parseRecurrenceRule('semanal')).toBeNull()
    expect(parseRecurrenceRule('semanal-xxx')).toBeNull()
  })
})
