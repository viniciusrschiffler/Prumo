import { describe, expect, it } from 'vitest'
import { filterCommands, normalizeForSearch, rankCommand } from './filterCommands'

const COMMANDS = [
  { id: 'a', label: 'Ir para Configurações', keys: 'g s' },
  { id: 'b', label: 'Ir para Capacidade', keys: 'g c' },
  { id: 'c', label: 'Novo projeto', keys: 'mod+n' },
  { id: 'd', label: 'Registrar evento', keys: 'mod+e' },
]

describe('Normalização', () => {
  it('Should drop the accent and the case so “acoes” finds “Ações”', () => {
    expect(normalizeForSearch('Ações')).toBe('acoes')
    expect(normalizeForSearch('Configurações')).toBe('configuracoes')
  })
})

describe('Ranking', () => {
  it('Should rank a prefix above a word start above a plain match', () => {
    expect(rankCommand('Novo projeto', 'novo')).toBeLessThan(
      rankCommand('Novo projeto', 'projeto') ?? 0,
    )
    expect(rankCommand('Novo projeto', 'rojet')).toBeGreaterThan(
      rankCommand('Novo projeto', 'projeto') ?? 0,
    )
  })

  it('Should reject what does not match at all', () => {
    expect(rankCommand('Novo projeto', 'timeline')).toBeNull()
  })
})

describe('Filtro', () => {
  it('Should return everything in alphabetical order without a query', () => {
    expect(filterCommands(COMMANDS, '   ').map((command) => command.id)).toEqual([
      'b',
      'a',
      'c',
      'd',
    ])
  })

  it('Should put the prefix match first', () => {
    expect(filterCommands(COMMANDS, 'ir para').map((command) => command.id)).toEqual(['b', 'a'])
  })

  it('Should find by a word in the middle of the label', () => {
    expect(filterCommands(COMMANDS, 'evento').map((command) => command.id)).toEqual(['d'])
  })

  it('Should find an accented label typed without accent', () => {
    expect(filterCommands(COMMANDS, 'configuracoes').map((command) => command.id)).toEqual(['a'])
  })

  it('Should return nothing when no command matches', () => {
    expect(filterCommands(COMMANDS, 'xyz')).toEqual([])
  })
})
