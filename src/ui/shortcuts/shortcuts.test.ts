import { describe, expect, it, vi } from 'vitest'
import { describeKeyEvent, type KeyEventLike } from './describeKeyEvent'
import { createShortcutRegistry, type Shortcut } from './shortcutRegistry'

function buildKeyEvent(overrides: Partial<KeyEventLike> & { key: string }): KeyEventLike {
  return { ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...overrides }
}

function buildShortcut(overrides: Partial<Shortcut> & { id: string }): Shortcut {
  return {
    keys: 'g t',
    scope: 'global',
    description: 'Ir para Hoje',
    run: () => {},
    ...overrides,
  }
}

describe('describeKeyEvent', () => {
  it('Should lowercase a plain letter', () => {
    expect(describeKeyEvent(buildKeyEvent({ key: 'G' }))).toBe('g')
  })

  it('Should read control and command as the same modifier', () => {
    expect(describeKeyEvent(buildKeyEvent({ key: 'k', ctrlKey: true }))).toBe('mod+k')
    expect(describeKeyEvent(buildKeyEvent({ key: 'k', metaKey: true }))).toBe('mod+k')
  })

  it('Should name the keys that are not a single character', () => {
    expect(describeKeyEvent(buildKeyEvent({ key: 'Escape' }))).toBe('escape')
    expect(describeKeyEvent(buildKeyEvent({ key: ' ' }))).toBe('space')
    expect(describeKeyEvent(buildKeyEvent({ key: 'Enter', ctrlKey: true }))).toBe('mod+enter')
  })

  it('Should not add shift to a symbol that already carries it', () => {
    expect(describeKeyEvent(buildKeyEvent({ key: '@', shiftKey: true }))).toBe('@')
  })

  it('Should keep shift on a named key', () => {
    expect(describeKeyEvent(buildKeyEvent({ key: 'Enter', shiftKey: true }))).toBe('shift+enter')
  })
})

describe('createShortcutRegistry', () => {
  it('Should resolve a registered shortcut by its keys', () => {
    const registry = createShortcutRegistry()
    const run = vi.fn()

    registry.register(buildShortcut({ id: 'today', keys: 'g t', run }))
    registry.resolve('g t')?.run()

    expect(run).toHaveBeenCalledOnce()
  })

  it('Should return null for keys nobody registered', () => {
    const registry = createShortcutRegistry()

    expect(registry.resolve('g z')).toBeNull()
  })

  it('Should let the innermost scope win over the outer ones', () => {
    const registry = createShortcutRegistry()

    registry.register(buildShortcut({ id: 'global-escape', keys: 'escape', scope: 'global' }))
    registry.register(buildShortcut({ id: 'screen-escape', keys: 'escape', scope: 'screen' }))
    registry.register(buildShortcut({ id: 'modal-escape', keys: 'escape', scope: 'modal' }))

    expect(registry.resolve('escape')?.id).toBe('modal-escape')
  })

  it('Should refuse two shortcuts on the same keys inside one scope', () => {
    const registry = createShortcutRegistry()

    registry.register(buildShortcut({ id: 'new-project', keys: 'mod+n', scope: 'screen' }))

    expect(() =>
      registry.register(buildShortcut({ id: 'new-task', keys: 'mod+n', scope: 'screen' })),
    ).toThrow(/já está em new-project/)
  })

  it('Should free the keys again after unregistering', () => {
    const registry = createShortcutRegistry()
    const unregister = registry.register(buildShortcut({ id: 'first', keys: 'mod+n', scope: 'screen' }))

    unregister()
    registry.register(buildShortcut({ id: 'second', keys: 'mod+n', scope: 'screen' }))

    expect(registry.resolve('mod+n')?.id).toBe('second')
  })

  it('Should recognise the first key of a sequence as a prefix', () => {
    const registry = createShortcutRegistry()

    registry.register(buildShortcut({ id: 'today', keys: 'g t' }))

    expect(registry.isSequencePrefix('g')).toBe(true)
    expect(registry.isSequencePrefix('t')).toBe(false)
  })

  it('Should not treat a single key shortcut as a prefix', () => {
    const registry = createShortcutRegistry()

    registry.register(buildShortcut({ id: 'new-task', keys: 't', scope: 'screen' }))

    expect(registry.isSequencePrefix('t')).toBe(false)
  })
})
