import { describe, expect, it } from 'vitest'
import { formatShortcutHint, resolveScreenFromPath, SCREEN_META } from './screenMeta'

describe('resolveScreenFromPath', () => {
  it('Should resolve each screen from its own path', () => {
    for (const meta of Object.values(SCREEN_META)) {
      const pathname = meta.path.replace(':projectId', 'algum-projeto')

      expect(resolveScreenFromPath(pathname)).toBe(meta.screen)
    }
  })

  it('Should prefer the project detail over the project list', () => {
    expect(resolveScreenFromPath('/projetos')).toBe('projects')
    expect(resolveScreenFromPath('/projetos/migracao-do-gateway')).toBe('project')
  })

  it('Should fall back to the first screen for an unknown path', () => {
    expect(resolveScreenFromPath('/inexistente')).toBe('today')
  })
})

describe('formatShortcutHint', () => {
  it('Should render a sequence in upper case', () => {
    expect(formatShortcutHint('g t')).toBe('G T')
  })

  it('Should render the command modifier as a symbol', () => {
    expect(formatShortcutHint('mod+k')).toBe('⌘K')
  })
})

describe('SCREEN_META', () => {
  it('Should not bind the same navigation keys to two screens', () => {
    const keys = Object.values(SCREEN_META)
      .map((meta) => meta.navigationKeys)
      .filter((navigationKeys) => navigationKeys !== null)

    expect(new Set(keys).size).toBe(keys.length)
  })
})
