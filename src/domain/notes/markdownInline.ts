const CODE = '`([^`\\n]+)`'
const BOLD = '\\*\\*([\\s\\S]+?)\\*\\*'
const LINK = '\\[([^\\]\\n]+)\\]\\(([^)\\s]+)\\)'
const STAR_EMPHASIS = '\\*([^*\\n]+)\\*'
const UNDERSCORE_EMPHASIS = '_([^_\\n]+)_'

const INLINE_SOURCE = [CODE, BOLD, LINK, STAR_EMPHASIS, UNDERSCORE_EMPHASIS].join('|')

export type MarkdownInline = {
  text: string
  bold: boolean
  italic: boolean
  code: boolean
  href: string | null
}

const PLAIN: Omit<MarkdownInline, 'text'> = {
  bold: false,
  italic: false,
  code: false,
  href: null,
}

type InlineStyle = Omit<MarkdownInline, 'text'>

// O código entre crases não recursa: dentro dele o asterisco é asterisco. O resto recursa,
// para que **negrito com *ênfase* dentro** saia com as duas marcas.
function parseWithStyle(text: string, style: InlineStyle): MarkdownInline[] {
  const pattern = new RegExp(INLINE_SOURCE, 'g')
  const segments: MarkdownInline[] = []
  let lastIndex = 0

  for (const match of text.matchAll(pattern)) {
    const [whole, code, bold, linkText, href, star, underscore] = match

    if (match.index === undefined) {
      continue
    }

    if (match.index > lastIndex) {
      segments.push({ ...style, text: text.slice(lastIndex, match.index) })
    }

    if (code !== undefined) {
      segments.push({ ...style, code: true, text: code })
    } else if (bold !== undefined) {
      segments.push(...parseWithStyle(bold, { ...style, bold: true }))
    } else if (linkText !== undefined && href !== undefined) {
      segments.push(...parseWithStyle(linkText, { ...style, href }))
    } else {
      segments.push(...parseWithStyle(star ?? underscore ?? '', { ...style, italic: true }))
    }

    lastIndex = match.index + whole.length
  }

  if (lastIndex < text.length) {
    segments.push({ ...style, text: text.slice(lastIndex) })
  }

  return segments.filter((segment) => segment.text !== '')
}

export function parseInline(text: string): MarkdownInline[] {
  return parseWithStyle(text, PLAIN)
}

export function toPlainText(segments: readonly MarkdownInline[]): string {
  return segments.map((segment) => segment.text).join('')
}
