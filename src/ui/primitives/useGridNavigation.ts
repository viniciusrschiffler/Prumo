import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { isGridMoveKey, resolveRowMove } from './gridNavigationKeys'

export type GridRowProps = {
  tabIndex: number
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  onFocus: () => void
  ref: (element: HTMLElement | null) => void
}

export type GridNavigation = {
  activeId: string | null
  getRowProps: (id: string) => GridRowProps
}

type GridNavigationOptions = {
  rowIds: readonly string[]
  onActivate?: (id: string) => void
  onToggleSelect?: (id: string, extend: boolean) => void
  onExpand?: (id: string) => void
  onCollapse?: (id: string) => void
}

export function useGridNavigation({
  rowIds,
  onActivate,
  onToggleSelect,
  onExpand,
  onCollapse,
}: GridNavigationOptions): GridNavigation {
  const [preferredId, setPreferredId] = useState<string | null>(null)
  const elements = useRef(new Map<string, HTMLElement>())

  // A linha ativa é derivada, não sincronizada: filtrar a tabela some com ela sem passar por
  // efeito nenhum, e a primeira linha volta a receber o tabindex.
  const activeId =
    preferredId !== null && rowIds.includes(preferredId) ? preferredId : (rowIds[0] ?? null)

  const focusRow = useCallback((id: string) => {
    setPreferredId(id)
    elements.current.get(id)?.focus()
  }, [])

  const getRowProps = useCallback(
    (id: string): GridRowProps => ({
      tabIndex: id === activeId ? 0 : -1,
      ref: (element) => {
        if (element === null) {
          elements.current.delete(id)
          return
        }

        elements.current.set(id, element)
      },
      onFocus: () => setPreferredId(id),
      onKeyDown: (event) => {
        if (isGridMoveKey(event.key)) {
          const nextId = resolveRowMove(rowIds, id, event.key)

          if (nextId !== null) {
            event.preventDefault()
            focusRow(nextId)
          }

          return
        }

        if (event.key === ' ') {
          event.preventDefault()
          onToggleSelect?.(id, event.shiftKey)
          return
        }

        if (event.key === 'Enter') {
          event.preventDefault()
          onActivate?.(id)
          return
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault()
          onExpand?.(id)
          return
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          onCollapse?.(id)
        }
      },
    }),
    [activeId, rowIds, focusRow, onActivate, onToggleSelect, onExpand, onCollapse],
  )

  return { activeId, getRowProps }
}
