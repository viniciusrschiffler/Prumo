import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function listFocusable(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
}

export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    const container = containerRef.current

    if (!active || container === null) {
      return
    }

    const previouslyFocused = document.activeElement
    const focusable = listFocusable(container)

    ;(focusable[0] ?? container).focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || container === null) {
        return
      }

      const current = listFocusable(container)
      const first = current[0]
      const last = current[current.length - 1]

      if (first === undefined || last === undefined) {
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  }, [containerRef, active])
}
