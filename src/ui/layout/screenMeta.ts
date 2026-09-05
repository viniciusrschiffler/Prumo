import type { Screen } from '@/domain/schemas/savedViewSchema'

export type ScreenMeta = {
  screen: Screen
  path: string
  title: string
  contextLabel: string
  navigationKeys: string | null
}

export const SCREEN_META: Record<Screen, ScreenMeta> = {
  today: {
    screen: 'today',
    path: '/hoje',
    title: 'Hoje',
    contextLabel: 'Projetos ativos',
    navigationKeys: 'g t',
  },
  projects: {
    screen: 'projects',
    path: '/projetos',
    title: 'Projetos',
    contextLabel: 'Visões salvas',
    navigationKeys: 'g p',
  },
  project: {
    screen: 'project',
    path: '/projetos/:projectId',
    title: 'Projeto',
    contextLabel: 'Projetos ativos',
    navigationKeys: null,
  },
  timeline: {
    screen: 'timeline',
    path: '/timeline',
    title: 'Timeline',
    contextLabel: 'Fases',
    navigationKeys: 'g l',
  },
  capacity: {
    screen: 'capacity',
    path: '/capacidade',
    title: 'Capacidade',
    contextLabel: 'Pessoas',
    navigationKeys: 'g c',
  },
  todos: {
    screen: 'todos',
    path: '/todolist',
    title: 'TodoList',
    contextLabel: 'Tags',
    navigationKeys: 'g d',
  },
  notes: {
    screen: 'notes',
    path: '/notas',
    title: 'Notas',
    contextLabel: 'Filtrar por projeto',
    navigationKeys: 'g n',
  },
  dashboards: {
    screen: 'dashboards',
    path: '/paineis',
    title: 'Painéis',
    contextLabel: 'Fases',
    navigationKeys: 'g g',
  },
  settings: {
    screen: 'settings',
    path: '/configuracoes',
    title: 'Configurações',
    contextLabel: 'Seções',
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
