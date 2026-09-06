export const GRID_MOVE_KEYS = ['ArrowUp', 'ArrowDown', 'Home', 'End'] as const

export type GridMoveKey = (typeof GRID_MOVE_KEYS)[number]

export function isGridMoveKey(key: string): key is GridMoveKey {
  return (GRID_MOVE_KEYS as readonly string[]).includes(key)
}

export function resolveRowMove(
  rowIds: readonly string[],
  activeId: string | null,
  key: GridMoveKey,
): string | null {
  if (rowIds.length === 0) {
    return null
  }

  const first = rowIds[0] ?? null
  const last = rowIds[rowIds.length - 1] ?? null

  if (key === 'Home') {
    return first
  }

  if (key === 'End') {
    return last
  }

  const currentIndex = activeId === null ? -1 : rowIds.indexOf(activeId)

  if (currentIndex === -1) {
    return key === 'ArrowDown' ? first : last
  }

  const nextIndex = currentIndex + (key === 'ArrowDown' ? 1 : -1)

  if (nextIndex < 0 || nextIndex >= rowIds.length) {
    return null
  }

  return rowIds[nextIndex] ?? null
}

export const MATRIX_MOVE_KEYS = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
] as const

export type MatrixMoveKey = (typeof MATRIX_MOVE_KEYS)[number]

export type MatrixPosition = {
  row: number
  column: number
}

export type MatrixBounds = {
  rowCount: number
  columnCount: number
}

export function isMatrixMoveKey(key: string): key is MatrixMoveKey {
  return (MATRIX_MOVE_KEYS as readonly string[]).includes(key)
}

function clamp(value: number, limit: number): number {
  return Math.max(0, Math.min(limit - 1, value))
}

// Home e End andam na linha; com o modificador, saltam para a primeira e a última célula da
// matriz inteira, que é o que a navegação de grade da ARIA descreve.
function resolveEdge(
  position: MatrixPosition,
  bounds: MatrixBounds,
  key: 'Home' | 'End',
  wholeMatrix: boolean,
): MatrixPosition {
  const column = key === 'Home' ? 0 : bounds.columnCount - 1

  if (!wholeMatrix) {
    return { row: position.row, column }
  }

  return { row: key === 'Home' ? 0 : bounds.rowCount - 1, column }
}

const STEPS: Record<'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', MatrixPosition> = {
  ArrowUp: { row: -1, column: 0 },
  ArrowDown: { row: 1, column: 0 },
  ArrowLeft: { row: 0, column: -1 },
  ArrowRight: { row: 0, column: 1 },
}

export function resolveCellMove(
  position: MatrixPosition,
  bounds: MatrixBounds,
  key: MatrixMoveKey,
  wholeMatrix = false,
): MatrixPosition | null {
  if (bounds.rowCount === 0 || bounds.columnCount === 0) {
    return null
  }

  const next =
    key === 'Home' || key === 'End'
      ? resolveEdge(position, bounds, key, wholeMatrix)
      : {
          row: position.row + STEPS[key].row,
          column: position.column + STEPS[key].column,
        }

  const clamped = { row: clamp(next.row, bounds.rowCount), column: clamp(next.column, bounds.columnCount) }

  return clamped.row === position.row && clamped.column === position.column ? null : clamped
}
