export function selectRange(
  orderedIds: readonly string[],
  fromId: string,
  toId: string,
): string[] {
  const fromIndex = orderedIds.indexOf(fromId)
  const toIndex = orderedIds.indexOf(toId)

  if (fromIndex === -1 || toIndex === -1) {
    return []
  }

  const start = Math.min(fromIndex, toIndex)
  const end = Math.max(fromIndex, toIndex)

  return orderedIds.slice(start, end + 1)
}
