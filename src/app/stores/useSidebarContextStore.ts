import { create } from 'zustand'

export type SidebarContextMetaTone = 'default' | 'danger'

export type SidebarContextItem = {
  id: string
  label: string
  meta?: string
  metaTone?: SidebarContextMetaTone
  // O ponto colorido do design é sinal sem número: risco em aberto no projeto, onde o desvio
  // não tem o que dizer.
  metaDot?: SidebarContextMetaTone
  subdued?: boolean
  color?: string
}

type SidebarContextState = {
  items: readonly SidebarContextItem[]
  activeId: string | null
  onSelect: ((id: string) => void) | null
  publish: (
    items: readonly SidebarContextItem[],
    activeId: string | null,
    onSelect: ((id: string) => void) | null,
  ) => void
  clear: () => void
}

export const useSidebarContextStore = create<SidebarContextState>((set) => ({
  items: [],
  activeId: null,
  onSelect: null,
  publish: (items, activeId, onSelect) => set(() => ({ items, activeId, onSelect })),
  clear: () => set(() => ({ items: [], activeId: null, onSelect: null })),
}))
