const NAMED_KEYS: Record<string, string> = {
  ' ': 'space',
  escape: 'escape',
  enter: 'enter',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
}

export type KeyEventLike = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

// Shift não vira modificador em tecla de um caractere porque o próprio caractere já o carrega:
// em "@" o evento chega com shift ligado, e listar o modificador quebraria o casamento.
export function describeKeyEvent(event: KeyEventLike): string {
  const lowerKey = event.key.toLowerCase()
  const key = NAMED_KEYS[lowerKey] ?? lowerKey
  const isNamedKey = key.length > 1
  const parts: string[] = []

  if (event.ctrlKey || event.metaKey) {
    parts.push('mod')
  }

  if (event.altKey) {
    parts.push('alt')
  }

  if (event.shiftKey && isNamedKey) {
    parts.push('shift')
  }

  parts.push(key)

  return parts.join('+')
}
