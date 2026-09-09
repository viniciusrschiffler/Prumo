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

// A TodoList é a única tela com duas listas na barra lateral: o design põe Status acima de
// Tags. A seção de cima é opcional e tem rótulo próprio, porque o rótulo do `screenMeta` já
// nomeia a de baixo.
export type SidebarLeadSection = {
  label: string
  items: readonly SidebarContextItem[]
  activeId: string | null
  onSelect: ((id: string) => void) | null
}

type SidebarContextState = {
  items: readonly SidebarContextItem[]
  activeId: string | null
  onSelect: ((id: string) => void) | null
  lead: SidebarLeadSection | null
  publishLead: (lead: SidebarLeadSection | null) => void
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
  lead: null,
  publishLead: (lead) => set(() => ({ lead })),
  publish: (items, activeId, onSelect) => set(() => ({ items, activeId, onSelect })),
  clear: () => set(() => ({ items: [], activeId: null, onSelect: null })),
}))
