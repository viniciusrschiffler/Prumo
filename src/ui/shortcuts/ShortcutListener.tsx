import { useEffect, useRef } from 'react'
import { describeKeyEvent } from './describeKeyEvent'
import { shortcutRegistry } from './shortcutRegistry'

const SEQUENCE_TIMEOUT_MS = 1200
const TEXT_FIELD_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return TEXT_FIELD_TAGS.has(target.tagName) || target.isContentEditable
}

export function ShortcutListener() {
  const pendingPrefix = useRef<string | null>(null)
  const pendingTimer = useRef<number | null>(null)

  useEffect(() => {
    function clearPending() {
      pendingPrefix.current = null

      if (pendingTimer.current !== null) {
        window.clearTimeout(pendingTimer.current)
        pendingTimer.current = null
      }
    }

    function startPending(prefix: string) {
      pendingPrefix.current = prefix
      pendingTimer.current = window.setTimeout(clearPending, SEQUENCE_TIMEOUT_MS)
    }

    function handleKeyDown(event: KeyboardEvent) {
      const keys = describeKeyEvent(event)
      const prefix = pendingPrefix.current

      if (prefix !== null) {
        clearPending()

        const sequenced = shortcutRegistry.resolve(`${prefix} ${keys}`)

        if (sequenced !== null) {
          event.preventDefault()
          sequenced.run()
        }

        return
      }

      const typing = isTypingTarget(event.target)

      if (!typing && shortcutRegistry.isSequencePrefix(keys)) {
        event.preventDefault()
        startPending(keys)
        return
      }

      const shortcut = shortcutRegistry.resolve(keys)

      if (shortcut === null) {
        return
      }

      if (typing && shortcut.allowInTextField !== true) {
        return
      }

      event.preventDefault()
      shortcut.run()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearPending()
    }
  }, [])

  return null
}
