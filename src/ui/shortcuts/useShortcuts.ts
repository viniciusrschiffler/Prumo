import { useEffect, useRef } from 'react'
import { shortcutRegistry, type Shortcut } from './shortcutRegistry'

function buildSignature(shortcuts: readonly Shortcut[]): string {
  return shortcuts.map((shortcut) => `${shortcut.id}:${shortcut.scope}:${shortcut.keys}`).join('|')
}

export function useShortcuts(shortcuts: readonly Shortcut[]): void {
  const latestShortcuts = useRef(shortcuts)
  const signature = buildSignature(shortcuts)

  useEffect(() => {
    latestShortcuts.current = shortcuts
  })

  useEffect(() => {
    const unregisters = latestShortcuts.current.map((shortcut, index) =>
      shortcutRegistry.register({
        ...shortcut,
        run: () => latestShortcuts.current[index]?.run(),
      }),
    )

    return () => {
      for (const unregister of unregisters) {
        unregister()
      }
    }
  }, [signature])
}
