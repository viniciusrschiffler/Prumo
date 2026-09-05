export const PROJECT_TABS = ['tasks', 'allocations', 'notes'] as const

export type ProjectTab = (typeof PROJECT_TABS)[number]
