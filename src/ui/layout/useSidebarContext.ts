import { useEffect, useRef } from 'react'
import {
  useSidebarContextStore,
  type SidebarContextItem,
} from '@/app/stores/useSidebarContextStore'

function buildSignature(items: readonly SidebarContextItem[]): string {
  return items
    .map((item) =>
      [item.id, item.label, item.meta ?? '', item.metaTone ?? '', item.subdued ?? ''].join(':'),
    )
    .join('|')
}

export function useSidebarContext(
  items: readonly SidebarContextItem[],
  activeId: string | null,
  onSelect: ((id: string) => void) | null = null,
): void {
  const publish = useSidebarContextStore((state) => state.publish)
  const clear = useSidebarContextStore((state) => state.clear)
  const latest = useRef({ items, onSelect })
  const signature = buildSignature(items)

  useEffect(() => {
    latest.current = { items, onSelect }
  })

  useEffect(() => {
    publish(
      latest.current.items,
      activeId,
      latest.current.onSelect === null ? null : (id) => latest.current.onSelect?.(id),
    )

    return clear
  }, [signature, activeId, publish, clear])
}
