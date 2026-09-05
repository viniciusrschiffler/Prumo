export function groupBy<TItem, TKey>(
  items: readonly TItem[],
  toKey: (item: TItem) => TKey,
): Map<TKey, TItem[]> {
  const groups = new Map<TKey, TItem[]>()

  for (const item of items) {
    const key = toKey(item)
    const group = groups.get(key)

    if (group === undefined) {
      groups.set(key, [item])
      continue
    }

    group.push(item)
  }

  return groups
}
