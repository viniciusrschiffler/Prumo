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
