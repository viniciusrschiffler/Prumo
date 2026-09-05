export function moveInOrder<TItem>(
  items: readonly TItem[],
  fromIndex: number,
  toIndex: number,
): TItem[] {
  const isOutOfRange =
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex

  if (isOutOfRange) {
    return [...items]
  }

  const reordered = [...items]
  const [moved] = reordered.splice(fromIndex, 1)

  if (moved === undefined) {
    return [...items]
  }

  reordered.splice(toIndex, 0, moved)

  return reordered
}
