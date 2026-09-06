import { useCallback, useRef, type KeyboardEvent } from 'react'
import type { EntityId } from '@/domain/schemas/primitives'

const CHECKBOX_SELECTOR = 'input[type="checkbox"]'

export type TodoRowFocus = {
  registerRef: (id: EntityId, element: HTMLDivElement | null) => void
  focusRow: (id: EntityId) => void
  moveFocus: (fromId: EntityId, offset: number) => boolean
}

// O foco vive na caixa de marcar, que é um input de verdade: o espaço já alterna sem
// preventDefault e o Tab alcança toda linha sem tabindex móvel.
export function useTodoRowFocus(orderedIds: readonly EntityId[]): TodoRowFocus {
  const rows = useRef(new Map<EntityId, HTMLDivElement>())

  const registerRef = useCallback((id: EntityId, element: HTMLDivElement | null) => {
    if (element === null) {
      rows.current.delete(id)
      return
    }

    rows.current.set(id, element)
  }, [])

  const focusRow = useCallback((id: EntityId) => {
    rows.current.get(id)?.querySelector<HTMLInputElement>(CHECKBOX_SELECTOR)?.focus()
  }, [])

  const moveFocus = useCallback(
    (fromId: EntityId, offset: number) => {
      const index = orderedIds.indexOf(fromId)
      const target = orderedIds[index + offset]

      if (index === -1 || target === undefined) {
        return false
      }

      focusRow(target)

      return true
    },
    [orderedIds, focusRow],
  )

  return { registerRef, focusRow, moveFocus }
}

export function isRowShortcut(event: KeyboardEvent<HTMLElement>): boolean {
  return !event.ctrlKey && !event.metaKey && !event.altKey
}
