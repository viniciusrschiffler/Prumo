import { describe, expect, it } from 'vitest'
import { toFtsQuery } from './noteSearchQuery'

describe('toFtsQuery', () => {
  it('Should quote every word and leave the last one open for the prefix', () => {
    expect(toFtsQuery('validação jurídica')).toBe('"validação" "jurídica"*')
  })

  it('Should give nothing for a blank search', () => {
    expect(toFtsQuery('   ')).toBeNull()
  })

  // Aspas soltas e operadores do FTS5 derrubariam o MATCH com erro de sintaxe.
  it('Should drop the quotes the user typed', () => {
    expect(toFtsQuery('contrato" OR')).toBe('"contrato" "OR"*')
  })

  it('Should collapse the extra spaces', () => {
    expect(toFtsQuery('  escopo   novo ')).toBe('"escopo" "novo"*')
  })
})
