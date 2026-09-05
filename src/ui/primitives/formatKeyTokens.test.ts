import { describe, expect, it } from 'vitest'
import { formatKeyTokens } from './formatKeyTokens'

describe('formatKeyTokens', () => {
  it('Should split a sequence into one token per key', () => {
    expect(formatKeyTokens('g t')).toEqual(['G', 'T'])
  })

  it('Should render the modifier as the symbol used in the design', () => {
    expect(formatKeyTokens('mod+k')).toEqual(['⌘', 'K'])
  })

  it('Should name the keys that have no printable glyph', () => {
    expect(formatKeyTokens('escape')).toEqual(['esc'])
    expect(formatKeyTokens('space')).toEqual(['espaço'])
    expect(formatKeyTokens('mod+enter')).toEqual(['⌘', '↵'])
  })

  it('Should keep a symbol key as it is', () => {
    expect(formatKeyTokens('@')).toEqual(['@'])
  })
})
