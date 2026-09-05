// O design escreve o modificador como ⌘ mesmo no Windows; trocar por Ctrl é mudar aqui e só aqui.
const MODIFIER_SYMBOL = '⌘'

const KEY_SYMBOLS: Record<string, string> = {
  mod: MODIFIER_SYMBOL,
  shift: '⇧',
  alt: '⌥',
  enter: '↵',
  escape: 'esc',
  space: 'espaço',
  click: 'clique',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
}

export function formatKeyTokens(keys: string): string[] {
  return keys
    .split(' ')
    .flatMap((chord) => chord.split('+'))
    .filter((key) => key !== '')
    .map((key) => KEY_SYMBOLS[key] ?? key.toUpperCase())
}
