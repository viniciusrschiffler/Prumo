import { create } from 'zustand'
import { useNavigationCountsStore } from '@/app/stores/useNavigationCountsStore'
import type { ReallocationSimulation } from '@/domain/capacity/reallocationImpact'
import { buildReallocation } from '@/domain/capacity/reallocationWrite'
import { toIsoDateOf } from '@/domain/dates/isoDateMath'
import { findOpenBlockEvent } from '@/domain/derived/calculateBlockedDays'
import { toPlannedPeriod } from '@/domain/derived/taskPeriods'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import {
  buildProjectBlock,
  listOpenAllocationIds,
  type BlockProjectsDraft,
} from '@/domain/projects/blockProjects'
import { buildNewProject, type NewProjectDraft } from '@/domain/projects/newProject'
import {
  buildNewProjectEvent,
  type NewProjectEventDraft,
} from '@/domain/projects/newProjectEvent'
import { buildNewTask, nextSortOrder, type NewTaskDraft } from '@/domain/projects/newTask'
import {
  buildResumePostponement,
  type PostponeResumeDraft,
} from '@/domain/projects/postponeResume'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import { buildProjectResume } from '@/domain/projects/resumeProjects'
import {
  buildProjectUnblock,
  listAllocationsEndedByBlock,
  type UnblockProjectDraft,
} from '@/domain/projects/unblockProjects'
import type { EntityId, Priority } from '@/domain/schemas/primitives'
import type { SavedView } from '@/domain/schemas/savedViewSchema'
import {
  applyScheduleEdit,
  buildTaskReschedule,
  hasScheduleChanged,
  type ScheduleEditMode,
} from '@/domain/timeline/timelineSchedule'
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
  createTask: (draft: NewTaskDraft) => Promise<void>
  registerEvent: (draft: NewProjectEventDraft) => Promise<void>
  setPriority: (projectIds: readonly EntityId[], priority: Priority) => Promise<void>
  blockProjects: (projectIds: readonly EntityId[], draft: BlockProjectsDraft) => Promise<void>
  unblockProject: (projectId: EntityId, draft: UnblockProjectDraft) => Promise<void>
  resumeProject: (projectId: EntityId) => Promise<void>
  postponeResume: (draft: PostponeResumeDraft) => Promise<void>
  rescheduleTask: (
    taskId: EntityId,
    mode: ScheduleEditMode,
    offsetDays: number,
  ) => Promise<void>
  applyReallocation: (simulation: ReallocationSimulation) => Promise<void>
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

  createTask: async (draft) => {
    const projectTasks = get().snapshot.tasks.filter((task) => task.projectId === draft.projectId)
    const newTask = buildNewTask(
      draft,
      {
        taskId: crypto.randomUUID(),
        allocationIds: draft.assignees.map(() => crypto.randomUUID()),
      },
      nextSortOrder(projectTasks),
    )

    await new SqliteTaskRepository(getSqlGateway()).create(newTask)
    await get().refresh()
  },

  registerEvent: async (draft) => {
    const event = buildNewProjectEvent(draft, crypto.randomUUID(), new Date().toISOString())

    await new SqliteProjectEventRepository(getSqlGateway()).create(event)
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

  unblockProject: async (projectId, draft) => {
    const { tasks, allocations, events } = get().snapshot
    const blockEvent = findOpenBlockEvent(events.filter((event) => event.projectId === projectId))

    if (blockEvent === null) {
      return
    }

    const projectTasks = tasks.filter((task) => task.projectId === projectId)
    const endedByBlock = listAllocationsEndedByBlock({
      blockEvent,
      tasks: projectTasks,
      allocations,
    })

    await new SqliteProjectRepository(getSqlGateway()).unblock(
      buildProjectUnblock({
        projectId,
        blockEvent,
        tasks: projectTasks,
        allocations,
        draft,
        eventId: crypto.randomUUID(),
        allocationIds: endedByBlock.map(() => crypto.randomUUID()),
        today: todayIsoDate(),
        now: new Date().toISOString(),
      }),
    )

    await get().refresh()
  },

  resumeProject: async (projectId) => {
    const project = get().snapshot.projects.find((candidate) => candidate.id === projectId)

    if (project === undefined || project.pausedAt === null) {
      return
    }

    await new SqliteProjectRepository(getSqlGateway()).resume(
      buildProjectResume({
        projectId,
        pausedSince: toIsoDateOf(project.pausedAt),
        eventId: crypto.randomUUID(),
        today: todayIsoDate(),
        now: new Date().toISOString(),
      }),
    )

    await get().refresh()
  },

  postponeResume: async (draft) => {
    const postponement = buildResumePostponement(draft)

    if (postponement === null) {
      return
    }

    await new SqliteProjectRepository(getSqlGateway()).postponeResume(postponement)
    await get().refresh()
  },

  // O arrasto e as setas mexem na barra desenhada, que pode nascer da data real; o que vai ao
  // banco é sempre o deslocamento aplicado sobre o plano, a única parte que o replanejamento muda.
  rescheduleTask: async (taskId, mode, offsetDays) => {
    const task = get().snapshot.tasks.find((candidate) => candidate.id === taskId)
    const before = task === undefined ? null : toPlannedPeriod(task)

    if (task === undefined || before === null) {
      return
    }

    const after = applyScheduleEdit(before, mode, offsetDays)

    if (!hasScheduleChanged(before, after)) {
      return
    }

    await new SqliteTaskRepository(getSqlGateway()).reschedule(
      buildTaskReschedule({
        taskId,
        projectId: task.projectId,
        taskTitle: task.title,
        before,
        after,
        eventId: crypto.randomUUID(),
        now: new Date().toISOString(),
      }),
    )

    await get().refresh()
  },

  applyReallocation: async (simulation) => {
    const { tasks, baselines } = get().snapshot

    await new SqliteAllocationRepository(getSqlGateway()).applyReallocation(
      buildReallocation({
        simulation,
        tasks,
        baselines,
        ids: {
          eventId: crypto.randomUUID(),
          baselineId: crypto.randomUUID(),
          resumedAllocationId: crypto.randomUUID(),
        },
        now: new Date().toISOString(),
      }),
    )

    await get().refresh()
  },

  refresh: async () => {
    if (get().status !== 'ready') {
      await get().load()
      return
    }

    set(await readEverything())
    await useNavigationCountsStore.getState().refresh()
  },
}))
