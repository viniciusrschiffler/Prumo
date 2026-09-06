import { parseInline, toPlainText, type MarkdownInline } from './markdownInline'

const FENCE = /^```(\w*)\s*$/
const HEADING = /^(#{1,6})\s+(.*)$/
const RULE = /^(-{3,}|\*{3,}|_{3,})$/
const QUOTE = /^>\s?(.*)$/
const CALLOUT_LABEL = /^\[!([^\]]+)\]\s*(.*)$/
const BULLET = /^[-*+]\s+(.*)$/
const ORDERED = /^\d+\.\s+(.*)$/
const TABLE_DIVIDER = /^:?-{3,}:?$/

export type TableAlignment = 'left' | 'center' | 'right'

export type MarkdownBlock =
  | { kind: 'heading'; level: number; content: readonly MarkdownInline[] }
  | { kind: 'paragraph'; content: readonly MarkdownInline[] }
  | { kind: 'list'; ordered: boolean; items: readonly (readonly MarkdownInline[])[] }
  | { kind: 'code'; language: string | null; text: string }
  | {
      kind: 'table'
      header: readonly (readonly MarkdownInline[])[]
      alignments: readonly TableAlignment[]
      rows: readonly (readonly (readonly MarkdownInline[])[])[]
    }
  | { kind: 'callout'; label: string | null; content: readonly MarkdownInline[] }
  | { kind: 'rule' }

function splitCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')

  return trimmed.split('|').map((cell) => cell.trim())
}

function isTableDivider(line: string | undefined): boolean {
  if (line === undefined || !line.includes('|')) {
    return false
  }

  const cells = splitCells(line)

  return cells.length > 0 && cells.every((cell) => TABLE_DIVIDER.test(cell))
}

function toAlignment(cell: string): TableAlignment {
  const startsWithColon = cell.startsWith(':')
  const endsWithColon = cell.endsWith(':')

  if (startsWithColon && endsWithColon) {
    return 'center'
  }

  return endsWithColon ? 'right' : 'left'
}

function startsNewBlock(line: string): boolean {
  const trimmed = line.trim()

  return (
    trimmed === '' ||
    FENCE.test(trimmed) ||
    HEADING.test(trimmed) ||
    RULE.test(trimmed) ||
    QUOTE.test(trimmed) ||
    BULLET.test(trimmed) ||
    ORDERED.test(trimmed)
  )
}

type Reader = {
  lines: readonly string[]
  index: number
}

function takeWhile(reader: Reader, accept: (line: string) => boolean): string[] {
  const taken: string[] = []

  while (reader.index < reader.lines.length && accept(reader.lines[reader.index] ?? '')) {
    taken.push(reader.lines[reader.index] ?? '')
    reader.index += 1
  }

  return taken
}

function readCode(reader: Reader, language: string): MarkdownBlock {
  reader.index += 1

  const body = takeWhile(reader, (line) => !FENCE.test(line.trim()))

  // Um bloco sem fechamento vai até o fim do arquivo; consumir a linha ausente sairia do texto.
  if (reader.index < reader.lines.length) {
    reader.index += 1
  }

  return { kind: 'code', language: language === '' ? null : language, text: body.join('\n') }
}

function readTable(reader: Reader): MarkdownBlock {
  const header = splitCells(reader.lines[reader.index] ?? '')
  const alignments = splitCells(reader.lines[reader.index + 1] ?? '').map(toAlignment)

  reader.index += 2

  const rows = takeWhile(reader, (line) => line.includes('|') && line.trim() !== '').map(
    (line) => splitCells(line).map(parseInline),
  )

  return { kind: 'table', header: header.map(parseInline), alignments, rows }
}

function readList(reader: Reader, ordered: boolean): MarkdownBlock {
  const pattern = ordered ? ORDERED : BULLET
  const items = takeWhile(reader, (line) => pattern.test(line.trim())).map((line) =>
    parseInline(pattern.exec(line.trim())?.[1] ?? ''),
  )

  return { kind: 'list', ordered, items }
}

function readCallout(reader: Reader): MarkdownBlock {
  const quoted = takeWhile(reader, (line) => QUOTE.test(line.trim())).map(
    (line) => QUOTE.exec(line.trim())?.[1] ?? '',
  )
  const first = quoted[0] ?? ''
  const labelled = CALLOUT_LABEL.exec(first)
  const body = labelled === null ? quoted : [labelled[2] ?? '', ...quoted.slice(1)]

  return {
    kind: 'callout',
    label: labelled?.[1] ?? null,
    content: parseInline(body.join('\n').trim()),
  }
}

function readParagraph(reader: Reader): MarkdownBlock {
  const taken = [reader.lines[reader.index] ?? '']

  reader.index += 1
  taken.push(...takeWhile(reader, (line) => !startsNewBlock(line)))

  return { kind: 'paragraph', content: parseInline(taken.join('\n').trim()) }
}

export function parseMarkdown(text: string): MarkdownBlock[] {
  const reader: Reader = { lines: text.split('\n'), index: 0 }
  const blocks: MarkdownBlock[] = []

  while (reader.index < reader.lines.length) {
    const line = reader.lines[reader.index] ?? ''
    const trimmed = line.trim()
    const fence = FENCE.exec(trimmed)
    const heading = HEADING.exec(trimmed)

    if (trimmed === '') {
      reader.index += 1
    } else if (fence !== null) {
      blocks.push(readCode(reader, fence[1] ?? ''))
    } else if (heading !== null) {
      reader.index += 1
      blocks.push({
        kind: 'heading',
        level: (heading[1] ?? '#').length,
        content: parseInline(heading[2] ?? ''),
      })
    } else if (RULE.test(trimmed)) {
      reader.index += 1
      blocks.push({ kind: 'rule' })
    } else if (QUOTE.test(trimmed)) {
      blocks.push(readCallout(reader))
    } else if (BULLET.test(trimmed)) {
      blocks.push(readList(reader, false))
    } else if (ORDERED.test(trimmed)) {
      blocks.push(readList(reader, true))
    } else if (line.includes('|') && isTableDivider(reader.lines[reader.index + 1])) {
      blocks.push(readTable(reader))
    } else {
      blocks.push(readParagraph(reader))
    }
  }

  return blocks
}

// O título grande do preview é o primeiro `#` do arquivo, e ele sai do corpo para não ser
// impresso duas vezes. Sem `#` nenhum, quem dá nome ao documento é o nome do arquivo.
export function extractDocumentTitle(
  blocks: readonly MarkdownBlock[],
  fallback: string,
): { title: string; body: readonly MarkdownBlock[] } {
  const firstIndex = blocks.findIndex((block) => block.kind === 'heading' && block.level === 1)
  const first = firstIndex === -1 ? null : blocks[firstIndex]

  if (first === null || first === undefined || first.kind !== 'heading') {
    return { title: fallback, body: blocks }
  }

  return {
    title: toPlainText(first.content),
    body: [...blocks.slice(0, firstIndex), ...blocks.slice(firstIndex + 1)],
  }
}
