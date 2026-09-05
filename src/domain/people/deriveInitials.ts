const MAX_INITIALS = 2

export function deriveInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word !== '')

  if (words.length === 0) {
    return ''
  }

  const first = words[0] ?? ''
  const last = words[words.length - 1] ?? ''
  const picked = words.length === 1 ? first.slice(0, MAX_INITIALS) : `${first[0] ?? ''}${last[0] ?? ''}`

  return picked.toLocaleUpperCase('pt-BR')
}
