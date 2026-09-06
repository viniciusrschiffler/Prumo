export type CommandEntry = {
  id: string
  label: string
  keys: string
}

const DIACRITICS = /\p{Diacritic}/gu

// Quem digita "acoes" quer achar "Ações": a busca compara sem acento e sem caixa dos dois lados.
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(DIACRITICS, '').toLocaleLowerCase('pt-BR')
}

const PREFIX_RANK = 0
const WORD_START_RANK = 1
const CONTAINS_RANK = 2

export function rankCommand(label: string, query: string): number | null {
  const normalizedLabel = normalizeForSearch(label)
  const normalizedQuery = normalizeForSearch(query.trim())

  if (normalizedQuery === '') {
    return WORD_START_RANK
  }

  if (normalizedLabel.startsWith(normalizedQuery)) {
    return PREFIX_RANK
  }

  const wordStarts = normalizedLabel.split(/\s+/)

  if (wordStarts.some((word) => word.startsWith(normalizedQuery))) {
    return WORD_START_RANK
  }

  return normalizedLabel.includes(normalizedQuery) ? CONTAINS_RANK : null
}

export function filterCommands(
  commands: readonly CommandEntry[],
  query: string,
): CommandEntry[] {
  return commands
    .map((command) => ({ command, rank: rankCommand(command.label, query) }))
    .filter((entry) => entry.rank !== null)
    .toSorted((first, second) => {
      if (first.rank !== second.rank) {
        return (first.rank ?? 0) - (second.rank ?? 0)
      }

      return first.command.label.localeCompare(second.command.label, 'pt-BR')
    })
    .map((entry) => entry.command)
}
