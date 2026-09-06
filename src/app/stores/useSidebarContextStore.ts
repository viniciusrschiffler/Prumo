import { create } from 'zustand'

export type SidebarContextItem = {
  id: string
  label: string
  meta?: string
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
