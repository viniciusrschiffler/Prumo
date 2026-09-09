import { useEffect, useRef } from 'react'
import {
  useSidebarContextStore,
  type SidebarContextItem,
  type SidebarLeadSection,
} from '@/app/stores/useSidebarContextStore'

function buildSignature(items: readonly SidebarContextItem[]): string {
  return items
    .map((item) =>
      [
        item.id,
        item.label,
        item.meta ?? '',
        item.metaTone ?? '',
        item.metaDot ?? '',
        item.subdued ?? '',
        item.color ?? '',
      ].join(':'),
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

// A seção de cima vive fora do `screenMeta` porque só uma tela a tem, e some com ela: sair da
// TodoList não pode deixar a lista de status pendurada na barra lateral de outra tela.
export function useSidebarLeadContext(section: SidebarLeadSection | null): void {
  const publishLead = useSidebarContextStore((state) => state.publishLead)
  const latest = useRef(section)
  const signature =
    section === null
      ? ''
      : [section.label, section.activeId ?? '', buildSignature(section.items)].join('|')

  useEffect(() => {
    latest.current = section
  })

  useEffect(() => {
    const current = latest.current

    publishLead(
      current === null
        ? null
        : {
            label: current.label,
            items: current.items,
            activeId: current.activeId,
            onSelect: (id) => latest.current?.onSelect?.(id),
          },
    )

    return () => publishLead(null)
  }, [signature, publishLead])
}
