import { create } from 'zustand'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { SavedView } from '@/domain/schemas/savedViewSchema'
import { getSqlGateway } from '@/infra/database/DatabaseConnection'
import { SqliteAllocationRepository } from '@/infra/repositories/SqliteAllocationRepository'
import { SqliteBaselineRepository } from '@/infra/repositories/SqliteBaselineRepository'
import { SqlitePersonRepository } from '@/infra/repositories/SqlitePersonRepository'
import { SqlitePhaseRepository } from '@/infra/repositories/SqlitePhaseRepository'
import { SqliteProjectEventRepository } from '@/infra/repositories/SqliteProjectEventRepository'
import { SqliteProjectRepository } from '@/infra/repositories/SqliteProjectRepository'
import { SqliteSavedViewRepository } from '@/infra/repositories/SqliteSavedViewRepository'
import { SqliteTagRepository } from '@/infra/repositories/SqliteTagRepository'
import { SqliteTaskRepository } from '@/infra/repositories/SqliteTaskRepository'

export type ProjectsStatus = 'idle' | 'loading' | 'ready' | 'error'

const EMPTY_SNAPSHOT: ProjectsSnapshot = {
  projects: [],
  tasks: [],
  phases: [],
  people: [],
  allocations: [],
  baselines: [],
  baselineTasks: [],
  events: [],
  tags: [],
  projectTags: [],
}

type ProjectsState = {
  status: ProjectsStatus
  errorMessage: string | null
  snapshot: ProjectsSnapshot
  savedViews: readonly SavedView[]
  load: () => Promise<void>
  refresh: () => Promise<void>
}

async function readEverything(): Promise<{
  snapshot: ProjectsSnapshot
  savedViews: SavedView[]
}> {
  const gateway = getSqlGateway()
  const baselineRepository = new SqliteBaselineRepository(gateway)
  const tagRepository = new SqliteTagRepository(gateway)

  const [
    projects,
    tasks,
    phases,
    people,
    allocations,
    baselines,
    baselineTasks,
    events,
    tags,
    projectTags,
    savedViews,
  ] = await Promise.all([
    new SqliteProjectRepository(gateway).listAll(),
    new SqliteTaskRepository(gateway).listAll(),
    new SqlitePhaseRepository(gateway).listAll(),
    new SqlitePersonRepository(gateway).listAll(),
    new SqliteAllocationRepository(gateway).listAll(),
    baselineRepository.listAll(),
    baselineRepository.listTasks(),
    new SqliteProjectEventRepository(gateway).listAll(),
    tagRepository.listAll(),
    tagRepository.listProjectTags(),
    new SqliteSavedViewRepository(gateway).listByScreen('projects'),
  ])

  return {
    snapshot: {
      projects,
      tasks,
      phases,
      people,
      allocations,
      baselines,
      baselineTasks,
      events,
      tags,
      projectTags,
    },
    savedViews,
  }
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  status: 'idle',
  errorMessage: null,
  snapshot: EMPTY_SNAPSHOT,
  savedViews: [],

  load: async () => {
    set(() => ({ status: 'loading', errorMessage: null }))

    try {
      const loaded = await readEverything()

      set(() => ({ status: 'ready', errorMessage: null, ...loaded }))
    } catch (cause) {
      console.error('Não foi possível carregar a tela de Projetos.', cause)
      set(() => ({ status: 'error', errorMessage: toPublicMessage(cause) }))
    }
  },

  refresh: async () => {
    if (get().status !== 'ready') {
      await get().load()
      return
    }

    set(await readEverything())
  },
}))
