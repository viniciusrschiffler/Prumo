import { describe, expect, it } from 'vitest'
import { parseInline, toPlainText } from './markdownInline'

describe('parseInline', () => {
  it('Should keep plain text as one segment', () => {
    expect(parseInline('texto simples')).toEqual([
      { text: 'texto simples', bold: false, italic: false, code: false, href: null },
    ])
  })

  it('Should mark bold, emphasis and inline code', () => {
    const segments = parseInline('a **b** c *d* e `f`')

    expect(segments.map((segment) => [segment.text.trim(), segment.bold, segment.italic, segment.code])).toEqual([
      ['a', false, false, false],
      ['b', true, false, false],
      ['c', false, false, false],
      ['d', false, true, false],
      ['e', false, false, false],
      ['f', false, false, true],
    ])
  })

  it('Should read underscore as emphasis too', () => {
    expect(parseInline('_ênfase_')[0]?.italic).toBe(true)
  })

  it('Should carry the style into the nested marker', () => {
    const [segment] = parseInline('**negrito com *ênfase* dentro**').filter(
      (candidate) => candidate.text === 'ênfase',
    )

    expect(segment?.bold).toBe(true)
    expect(segment?.italic).toBe(true)
  })

  it('Should take the link address and keep the text', () => {
    const segments = parseInline('ver [a baseline](notas/baseline.md) antes')

    expect(segments[1]).toEqual({
      text: 'a baseline',
      bold: false,
      italic: false,
      code: false,
      href: 'notas/baseline.md',
    })
  })

  // Dentro da crase o asterisco é asterisco: o código é literal por definição.
  it('Should not read markers inside inline code', () => {
    const segments = parseInline('`a **b** c`')

    expect(segments).toHaveLength(1)
    expect(segments[0]?.text).toBe('a **b** c')
    expect(segments[0]?.bold).toBe(false)
  })

  it('Should leave an unclosed marker as text', () => {
    expect(toPlainText(parseInline('valor ** solto'))).toBe('valor ** solto')
  })
})
