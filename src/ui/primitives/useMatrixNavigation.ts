import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import {
  isMatrixMoveKey,
  resolveCellMove,
  type MatrixBounds,
  type MatrixPosition,
} from './gridNavigationKeys'

export type MatrixCellProps = {
  tabIndex: number
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  onFocus: () => void
  ref: (element: HTMLElement | null) => void
}

export type MatrixNavigation = {
  activeCell: MatrixPosition
  focusCell: (position: MatrixPosition) => void
  getCellProps: (position: MatrixPosition) => MatrixCellProps
}

type MatrixNavigationOptions = MatrixBounds & {
  onActivate?: (position: MatrixPosition) => void
}

function toKey(position: MatrixPosition): string {
  return `${position.row}:${position.column}`
}

function clampToBounds(position: MatrixPosition, bounds: MatrixBounds): MatrixPosition {
  return {
    row: Math.max(0, Math.min(bounds.rowCount - 1, position.row)),
    column: Math.max(0, Math.min(bounds.columnCount - 1, position.column)),
  }
}

export function useMatrixNavigation({
  rowCount,
  columnCount,
  onActivate,
}: MatrixNavigationOptions): MatrixNavigation {
  const [preferred, setPreferred] = useState<MatrixPosition>({ row: 0, column: 0 })
  const elements = useRef(new Map<string, HTMLElement>())

  // A célula ativa é derivada, não sincronizada: filtrar a matriz encolhe os limites sem
  // passar por efeito nenhum, e o tabindex volta sozinho para uma célula que ainda existe.
  const activeCell = clampToBounds(preferred, { rowCount, columnCount })

  const focusCell = useCallback((position: MatrixPosition) => {
    setPreferred(position)
    elements.current.get(toKey(position))?.focus()
  }, [])

  const getCellProps = useCallback(
    (position: MatrixPosition): MatrixCellProps => ({
      tabIndex:
        position.row === activeCell.row && position.column === activeCell.column ? 0 : -1,
      ref: (element) => {
        if (element === null) {
          elements.current.delete(toKey(position))
          return
        }

        elements.current.set(toKey(position), element)
      },
      onFocus: () => setPreferred(position),
      onKeyDown: (event) => {
        if (isMatrixMoveKey(event.key)) {
          const next = resolveCellMove(
            position,
            { rowCount, columnCount },
            event.key,
            event.ctrlKey || event.metaKey,
          )

          if (next !== null) {
            event.preventDefault()
            focusCell(next)
          }

          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate?.(position)
        }
      },
    }),
    [activeCell.row, activeCell.column, rowCount, columnCount, focusCell, onActivate],
  )

  return { activeCell, focusCell, getCellProps }
}
