const SEPARATOR = '/'
const MARKDOWN_EXTENSION = '.md'
const COMBINING_MARKS = /[\u0300-\u036f]/g
const NON_SLUG_CHARACTERS = /[^a-z0-9]+/g
const EDGE_DASHES = /^-+|-+$/g
const FALLBACK_SLUG = 'nota'

// O caminho da nota é relativo à pasta de dados e sempre com barra normal, porque é ele que
// vai para a coluna `note.path` — o separador do Windows deixaria a mesma nota com dois nomes.
export const NOTES_ROOT = 'notas'

export function joinNotePath(...segments: readonly string[]): string {
  return segments
    .flatMap((segment) => segment.split(SEPARATOR))
    .filter((segment) => segment !== '')
    .join(SEPARATOR)
}

export function noteSegments(path: string): string[] {
  return path.split(SEPARATOR).filter((segment) => segment !== '')
}

export function noteFileName(path: string): string {
  return noteSegments(path).at(-1) ?? ''
}

export function noteFolderOf(path: string): string {
  return noteSegments(path).slice(0, -1).join(SEPARATOR)
}

export function noteBaseName(path: string): string {
  const name = noteFileName(path)

  return name.endsWith(MARKDOWN_EXTENSION)
    ? name.slice(0, -MARKDOWN_EXTENSION.length)
    : name
}

export function isMarkdownPath(path: string): boolean {
  return path.toLowerCase().endsWith(MARKDOWN_EXTENSION)
}

export function isInsideNotesRoot(path: string): boolean {
  return noteSegments(path)[0] === NOTES_ROOT
}

// A profundidade é contada a partir de `notas/`, que não vira linha na árvore: o filho direto
// dela desenha no primeiro nível.
export function noteDepth(path: string): number {
  return Math.max(0, noteSegments(path).length - 2)
}

export function toNoteSlug(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_SLUG_CHARACTERS, '-')
    .replace(EDGE_DASHES, '')

  return slug === '' ? FALLBACK_SLUG : slug
}

export function buildUniqueNotePath(
  folder: string,
  slug: string,
  takenPaths: ReadonlySet<string>,
): string {
  const candidate = joinNotePath(folder, `${slug}${MARKDOWN_EXTENSION}`)

  if (!takenPaths.has(candidate)) {
    return candidate
  }

  for (let suffix = 2; ; suffix += 1) {
    const next = joinNotePath(folder, `${slug}-${suffix}${MARKDOWN_EXTENSION}`)

    if (!takenPaths.has(next)) {
      return next
    }
  }
}
