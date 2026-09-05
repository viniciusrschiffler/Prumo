import { describe, expect, it } from 'vitest'
import { deriveInitials } from './deriveInitials'

describe('deriveInitials', () => {
  it('Should take the first letter of the first and of the last word', () => {
    expect(deriveInitials('Ana Nogueira')).toBe('AN')
    expect(deriveInitials('Júlia Farah')).toBe('JF')
  })

  it('Should skip the middle words', () => {
    expect(deriveInitials('Maria da Silva Teles')).toBe('MT')
  })

  it('Should take two letters from a single name', () => {
    expect(deriveInitials('Rafael')).toBe('RA')
  })

  it('Should ignore extra spaces', () => {
    expect(deriveInitials('  Ana   Nogueira  ')).toBe('AN')
  })

  it('Should return nothing for a name with no letters', () => {
    expect(deriveInitials('   ')).toBe('')
  })

  it('Should keep the accent in the uppercase letter', () => {
    expect(deriveInitials('Ângela Prado')).toBe('ÂP')
  })
})
