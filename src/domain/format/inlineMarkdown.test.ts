import { describe, expect, it } from 'vitest'
import { parseInlineMarkdown, splitParagraphs } from './inlineMarkdown'

describe('parseInlineMarkdown', () => {
  it('Should keep plain text as a single segment', () => {
    expect(parseInlineMarkdown('Ambiente liberado pela infra.')).toEqual([
      { text: 'Ambiente liberado pela infra.', isBold: false },
    ])
  })

  it('Should split the label the scope change event of the design writes in bold', () => {
    expect(parseInlineMarkdown('**Contexto:** financeiro precisa de conciliação.')).toEqual([
      { text: 'Contexto:', isBold: true },
      { text: ' financeiro precisa de conciliação.', isBold: false },
    ])
  })

  it('Should read more than one bold run in the same line', () => {
    const segments = parseInlineMarkdown('**Contexto:** um. **Impacto:** dois.')

    expect(segments.filter((segment) => segment.isBold).map((segment) => segment.text)).toEqual([
      'Contexto:',
      'Impacto:',
    ])
  })

  it('Should leave an unclosed marker as plain text', () => {
    expect(parseInlineMarkdown('**Contexto: sem fechar')).toEqual([
      { text: '**Contexto: sem fechar', isBold: false },
    ])
  })

  it('Should return nothing for an empty body', () => {
    expect(parseInlineMarkdown('')).toEqual([])
  })

  it('Should not swallow an asterisk that is not a marker', () => {
    expect(parseInlineMarkdown('2 * 3 = 6')).toEqual([{ text: '2 * 3 = 6', isBold: false }])
  })
})

describe('splitParagraphs', () => {
  it('Should break the body of the design event on the blank line', () => {
    expect(
      splitParagraphs('**Contexto:** financeiro precisa.\n\n**Impacto:** +80h e nova tarefa.'),
    ).toEqual(['**Contexto:** financeiro precisa.', '**Impacto:** +80h e nova tarefa.'])
  })

  it('Should keep a single line whole', () => {
    expect(splitParagraphs('Uma linha só.')).toEqual(['Uma linha só.'])
  })

  it('Should drop the blanks of a body with nothing in it', () => {
    expect(splitParagraphs('  \n\n  ')).toEqual([])
  })
})
