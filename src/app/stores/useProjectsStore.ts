import { create } from 'zustand'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import {
  buildProjectBlock,
  listOpenAllocationIds,
  type BlockProjectsDraft,
} from '@/domain/projects/blockProjects'
import { buildNewProject, type NewProjectDraft } from '@/domain/projects/newProject'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { SavedView } from '@/domain/schemas/savedViewSchema'
import type { EntityId, Priority } from '@/domain/schemas/primitives'
import { todayIsoDate } from '@/app/clock'
import { getSqlGateway } from '@/infra/database/DatabaseConnection'
import { SqliteAllocationRepository } from '@/infra/repositories/SqliteAllocationRepository'
import { SqliteBaselineRepository } from '@/infra/repositories/SqliteBaselineRepository'
import { SqliteNoteRepository } from '@/infra/repositories/SqliteNoteRepository'
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
  taskDependencies: [],
  phases: [],
  people: [],
  allocations: [],
  baselines: [],
  baselineTasks: [],
  events: [],
  eventTasks: [],
  notes: [],
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
  createProject: (draft: NewProjectDraft) => Promise<void>
  setPriority: (projectIds: readonly EntityId[], priority: Priority) => Promise<void>
  blockProjects: (projectIds: readonly EntityId[], draft: BlockProjectsDraft) => Promise<void>
}

async function readEverything(): Promise<{
  snapshot: ProjectsSnapshot
  savedViews: SavedView[]
}> {
  const gateway = getSqlGateway()
  const baselineRepository = new SqliteBaselineRepository(gateway)
  const tagRepository = new SqliteTagRepository(gateway)
  const taskRepository = new SqliteTaskRepository(gateway)
  const eventRepository = new SqliteProjectEventRepository(gateway)

  const [
    projects,
    tasks,
    taskDependencies,
    phases,
    people,
    allocations,
    baselines,
    baselineTasks,
    events,
    eventTasks,
    notes,
    tags,
    projectTags,
    savedViews,
  ] = await Promise.all([
    new SqliteProjectRepository(gateway).listAll(),
    taskRepository.listAll(),
    taskRepository.listDependencies(),
    new SqlitePhaseRepository(gateway).listAll(),
    new SqlitePersonRepository(gateway).listAll(),
    new SqliteAllocationRepository(gateway).listAll(),
    baselineRepository.listAll(),
    baselineRepository.listTasks(),
    eventRepository.listAll(),
    eventRepository.listEventTasks(),
    new SqliteNoteRepository(gateway).listAll(),
    tagRepository.listAll(),
    tagRepository.listProjectTags(),
    new SqliteSavedViewRepository(gateway).listByScreen('projects'),
  ])

  return {
    snapshot: {
      projects,
      tasks,
      taskDependencies,
      phases,
      people,
      allocations,
      baselines,
      baselineTasks,
      events,
      eventTasks,
      notes,
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

  createProject: async (draft) => {
    const newProject = buildNewProject(
      draft,
      { projectId: crypto.randomUUID(), baselineId: crypto.randomUUID() },
      new Date().toISOString(),
    )

    await new SqliteProjectRepository(getSqlGateway()).create(
      newProject,
      newProject.tagNames.map((name) => ({ id: crypto.randomUUID(), name })),
    )

    await get().refresh()
  },

  setPriority: async (projectIds, priority) => {
    await new SqliteProjectRepository(getSqlGateway()).setPriority(projectIds, priority)
    await get().refresh()
  },

  blockProjects: async (projectIds, draft) => {
    const { tasks, allocations } = get().snapshot
    const now = new Date().toISOString()
    const today = todayIsoDate()

    const blocks = projectIds.map((projectId) => {
      const taskIds = tasks
        .filter((task) => task.projectId === projectId)
        .map((task) => task.id)

      return buildProjectBlock(
        projectId,
        listOpenAllocationIds(taskIds, allocations),
        draft,
        crypto.randomUUID(),
        today,
        now,
      )
    })

    await new SqliteProjectRepository(getSqlGateway()).blockMany(blocks)
    await get().refresh()
  },

  refresh: async () => {
    if (get().status !== 'ready') {
      await get().load()
      return
    }

    set(await readEverything())
  },
}))
