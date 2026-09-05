import { useCallback, useRef, useState } from 'react'
import { selectRange } from './selectRange'

export type RowSelection = {
  selectedIds: ReadonlySet<string>
  isSelected: (id: string) => boolean
  select: (id: string, extend: boolean) => void
  clear: () => void
}

export function useRowSelection(orderedIds: readonly string[]): RowSelection {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const anchorId = useRef<string | null>(null)

  const select = useCallback(
    (id: string, extend: boolean) => {
      const anchor = anchorId.current

      if (extend && anchor !== null) {
        const range = selectRange(orderedIds, anchor, id)

        setSelectedIds((current) => new Set([...current, ...range]))

        return
      }

      anchorId.current = id

      setSelectedIds((current) => {
        const next = new Set(current)

        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }

        return next
      })
    },
    [orderedIds],
  )

  const clear = useCallback(() => {
    anchorId.current = null
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  return { selectedIds, isSelected, select, clear }
}
