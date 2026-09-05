const BOLD_PATTERN = /\*\*(.+?)\*\*/g
const PARAGRAPH_SEPARATOR = /\n{2,}/

export type MarkdownSegment = {
  text: string
  isBold: boolean
}

// O corpo do evento é markdown gravado pelo usuário, mas o histórico o mostra numa linha de
// texto. Só o negrito do design é reconhecido; o resto sobrevive como texto puro.
export function parseInlineMarkdown(text: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = []
  let lastIndex = 0

  BOLD_PATTERN.lastIndex = 0

  for (const match of text.matchAll(BOLD_PATTERN)) {
    const bold = match[1]

    if (match.index === undefined || bold === undefined) {
      continue
    }

    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), isBold: false })
    }

    segments.push({ text: bold, isBold: true })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isBold: false })
  }

  return segments
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(PARAGRAPH_SEPARATOR)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
}
