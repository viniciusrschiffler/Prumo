import type { Screen } from '@/domain/schemas/savedViewSchema'

export type SidebarContextVariant = 'list' | 'pills' | 'legend'

export type ScreenMeta = {
  screen: Screen
  path: string
  title: string
  contextLabel: string
  contextVariant: SidebarContextVariant
  navigationKeys: string | null
}

export const SCREEN_META: Record<Screen, ScreenMeta> = {
  today: {
    screen: 'today',
    path: '/hoje',
    title: 'Hoje',
    contextLabel: 'Projetos ativos',
    contextVariant: 'list',
    navigationKeys: 'g t',
  },
  projects: {
    screen: 'projects',
    path: '/projetos',
    title: 'Projetos',
    contextLabel: 'Visões salvas',
    contextVariant: 'list',
    navigationKeys: 'g p',
  },
  project: {
    screen: 'project',
    path: '/projetos/:projectId',
    title: 'Projeto',
    contextLabel: 'Projetos ativos',
    contextVariant: 'list',
    navigationKeys: null,
  },
  timeline: {
    screen: 'timeline',
    path: '/timeline',
    title: 'Timeline',
    contextLabel: 'Fases',
    contextVariant: 'legend',
    navigationKeys: 'g l',
  },
  capacity: {
    screen: 'capacity',
    path: '/capacidade',
    title: 'Capacidade',
    contextLabel: 'Pessoas',
    contextVariant: 'list',
    navigationKeys: 'g c',
  },
  todos: {
    screen: 'todos',
    path: '/todolist',
    title: 'TodoList',
    contextLabel: 'Tags',
    contextVariant: 'pills',
    navigationKeys: 'g d',
  },
  notes: {
    screen: 'notes',
    path: '/notas',
    title: 'Notas',
    contextLabel: 'Filtrar por projeto',
    contextVariant: 'list',
    navigationKeys: 'g n',
  },
  dashboards: {
    screen: 'dashboards',
    path: '/paineis',
    title: 'Painéis',
    contextLabel: 'Fases',
    contextVariant: 'legend',
    navigationKeys: 'g g',
  },
  settings: {
    screen: 'settings',
    path: '/configuracoes',
    title: 'Configurações',
    contextLabel: 'Seções',
    contextVariant: 'list',
    navigationKeys: null,
  },
}

export const SIDEBAR_SCREENS: readonly Screen[] = [
  'today',
  'projects',
  'timeline',
  'capacity',
  'todos',
  'notes',
  'dashboards',
]


function toPathPattern(path: string): RegExp {
  return new RegExp(`^${path.replace(/:[^/]+/g, '[^/]+')}$`)
}

export function resolveScreenFromPath(pathname: string): Screen {
  const orderedByPrecision = Object.values(SCREEN_META).toSorted(
    (first, second) => second.path.length - first.path.length,
  )
  const match = orderedByPrecision.find((meta) => toPathPattern(meta.path).test(pathname))

  return match?.screen ?? 'today'
}
