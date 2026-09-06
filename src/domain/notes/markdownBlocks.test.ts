import { describe, expect, it } from 'vitest'
import { extractDocumentTitle, parseMarkdown } from './markdownBlocks'
import { toPlainText } from './markdownInline'

describe('parseMarkdown', () => {
  it('Should read the heading level and its text', () => {
    const [block] = parseMarkdown('## Contexto')

    expect(block?.kind).toBe('heading')
    expect(block?.kind === 'heading' && block.level).toBe(2)
    expect(block?.kind === 'heading' && toPlainText(block.content)).toBe('Contexto')
  })

  it('Should join the lines of a paragraph and split on the blank line', () => {
    const blocks = parseMarkdown('uma linha\ne a seguinte\n\noutro parágrafo')

    expect(blocks).toHaveLength(2)
    expect(blocks[0]?.kind === 'paragraph' && toPlainText(blocks[0].content)).toBe(
      'uma linha\ne a seguinte',
    )
  })

  it('Should read a bullet list and stop at the paragraph after it', () => {
    const blocks = parseMarkdown('- primeiro\n- segundo\n\nfecho')

    expect(blocks[0]?.kind === 'list' && blocks[0].ordered).toBe(false)
    expect(blocks[0]?.kind === 'list' && blocks[0].items.map(toPlainText)).toEqual([
      'primeiro',
      'segundo',
    ])
    expect(blocks[1]?.kind).toBe('paragraph')
  })

  it('Should tell an ordered list from a bullet one', () => {
    const [block] = parseMarkdown('1. um\n2. dois')

    expect(block?.kind === 'list' && block.ordered).toBe(true)
  })

  it('Should keep the fenced code literal, with its language', () => {
    const [block] = parseMarkdown('```ini\nroteador.provider = "atual"\n# comentário\n```')

    expect(block?.kind === 'code' && block.language).toBe('ini')
    expect(block?.kind === 'code' && block.text).toBe(
      'roteador.provider = "atual"\n# comentário',
    )
  })

  it('Should close an unfenced block at the end of the file', () => {
    const [block] = parseMarkdown('```\nsem fechamento')

    expect(block?.kind === 'code' && block.text).toBe('sem fechamento')
  })

  it('Should read the table with its alignments', () => {
    const [block] = parseMarkdown(
      '| Cenário | Esforço | Fim |\n|---------|--------:|:---:|\n| Manter  |    320h | 29/09 |',
    )

    expect(block?.kind).toBe('table')
    expect(block?.kind === 'table' && block.alignments).toEqual(['left', 'right', 'center'])
    expect(block?.kind === 'table' && block.header.map(toPlainText)).toEqual([
      'Cenário',
      'Esforço',
      'Fim',
    ])
    expect(block?.kind === 'table' && block.rows[0]?.map(toPlainText)).toEqual([
      'Manter',
      '320h',
      '29/09',
    ])
  })

  // Sem a linha de alinhamento não é tabela: um parágrafo com barras continua parágrafo.
  it('Should not read a table without the divider row', () => {
    expect(parseMarkdown('| a | b |\ntexto')[0]?.kind).toBe('paragraph')
  })

  it('Should read the callout label and join its lines', () => {
    const [block] = parseMarkdown('> [!nota vinculada] Este arquivo está ligado\n> ao evento de 05/08.')

    expect(block?.kind === 'callout' && block.label).toBe('nota vinculada')
    expect(block?.kind === 'callout' && toPlainText(block.content)).toBe(
      'Este arquivo está ligado\nao evento de 05/08.',
    )
  })

  it('Should read a quote without a label as a callout with no label', () => {
    const [block] = parseMarkdown('> só uma citação')

    expect(block?.kind === 'callout' && block.label).toBeNull()
  })

  it('Should read the horizontal rule', () => {
    expect(parseMarkdown('---')[0]?.kind).toBe('rule')
  })

  it('Should give nothing for an empty document', () => {
    expect(parseMarkdown('')).toEqual([])
  })
})

describe('extractDocumentTitle', () => {
  it('Should take the first h1 out of the body', () => {
    const { title, body } = extractDocumentTitle(
      parseMarkdown('# Decisão: manter o provedor\n\nCorpo da nota.'),
      'decisao-provedor',
    )

    expect(title).toBe('Decisão: manter o provedor')
    expect(body).toHaveLength(1)
    expect(body[0]?.kind).toBe('paragraph')
  })

  it('Should keep the deeper headings in the body', () => {
    const { body } = extractDocumentTitle(parseMarkdown('# Título\n\n## Contexto'), 'x')

    expect(body).toHaveLength(1)
    expect(body[0]?.kind === 'heading' && body[0].level).toBe(2)
  })

  it('Should fall back to the file name when there is no h1', () => {
    const { title, body } = extractDocumentTitle(parseMarkdown('## Contexto'), 'retro-agosto')

    expect(title).toBe('retro-agosto')
    expect(body).toHaveLength(1)
  })
})
