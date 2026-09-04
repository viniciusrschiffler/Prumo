import { PrumoError } from '@/domain/errors/PrumoError'

export const SHORTCUT_SCOPES = ['global', 'screen', 'modal'] as const

export type ShortcutScope = (typeof SHORTCUT_SCOPES)[number]

export type Shortcut = {
  id: string
  keys: string
  scope: ShortcutScope
  description: string
  allowInTextField?: boolean
  run: () => void
}

export type ShortcutRegistry = {
  register(shortcut: Shortcut): () => void
  list(): Shortcut[]
  resolve(keys: string): Shortcut | null
  isSequencePrefix(keys: string): boolean
}

const SCOPE_PRIORITY: Record<ShortcutScope, number> = {
  global: 0,
  screen: 1,
  modal: 2,
}

function findConflict(shortcuts: readonly Shortcut[], candidate: Shortcut): Shortcut | undefined {
  return shortcuts.find(
    (shortcut) =>
      shortcut.id !== candidate.id &&
      shortcut.scope === candidate.scope &&
      shortcut.keys === candidate.keys,
  )
}

export function createShortcutRegistry(): ShortcutRegistry {
  const shortcutsById = new Map<string, Shortcut>()

  function list(): Shortcut[] {
    return [...shortcutsById.values()]
  }

  function register(shortcut: Shortcut): () => void {
    const conflict = findConflict(list(), shortcut)

    if (conflict !== undefined) {
      throw new PrumoError(
        'SHORTCUT_CONFLICT',
        `"${shortcut.keys}" no escopo ${shortcut.scope} já está em ${conflict.id}, tentado por ${shortcut.id}`,
      )
    }

    shortcutsById.set(shortcut.id, shortcut)

    return () => {
      if (shortcutsById.get(shortcut.id) === shortcut) {
        shortcutsById.delete(shortcut.id)
      }
    }
  }

  function resolve(keys: string): Shortcut | null {
    const matches = list().filter((shortcut) => shortcut.keys === keys)

    if (matches.length === 0) {
      return null
    }

    return matches.reduce((winner, candidate) =>
      SCOPE_PRIORITY[candidate.scope] > SCOPE_PRIORITY[winner.scope] ? candidate : winner,
    )
  }

  function isSequencePrefix(keys: string): boolean {
    return list().some((shortcut) => shortcut.keys.startsWith(`${keys} `))
  }

  return { register, list, resolve, isSequencePrefix }
}

export const shortcutRegistry = createShortcutRegistry()
