import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildTask } from '@/domain/testing/entityBuilders'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readTasks } from '@/domain/testing/seedReaders'
import type { Task } from '@/domain/schemas/taskSchema'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import type { ProjectsSnapshot } from './projectRow'
import {
  buildNewTask,
  nextSortOrder,
  previewTaskImpact,
  previewAllocationConflicts,
  validateNewTask,
  type NewTaskDraft,
} from './newTask'

const IDS = { taskId: 'gw-conc', allocationIds: ['al-conc-1', 'al-conc-2'] }

function buildDraft(overrides: Partial<NewTaskDraft> = {}): NewTaskDraft {
  return {
    projectId: 'gateway',
    title: 'Conciliação automática',
    description: '',
    status: 'todo',
    phaseId: 'production',
    plannedStart: '2026-09-07',
    plannedEnd: '2026-10-09',
    estimatedHours: 80,
    assignees: [],
    ...overrides,
  }
}

let gatewayTasks: Task[]

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  gatewayTasks = readTasks(database, 'gateway')
})

describe('validateNewTask', () => {
  it('Should accept a complete draft', () => {
    expect(validateNewTask(buildDraft())).toEqual({})
  })

  it('Should refuse a title of blanks only', () => {
    expect(validateNewTask(buildDraft({ title: '   ' })).title).toBeDefined()
  })

  it('Should refuse a task with no phase', () => {
    expect(validateNewTask(buildDraft({ phaseId: null })).phaseId).toBeDefined()
  })

  it('Should refuse an end before the start', () => {
    const errors = validateNewTask(
      buildDraft({ plannedStart: '2026-10-09', plannedEnd: '2026-09-07' }),
    )

    expect(errors.plannedEnd).toBeDefined()
  })

  it('Should accept a task with no window at all', () => {
    expect(validateNewTask(buildDraft({ plannedStart: null, plannedEnd: null }))).toEqual({})
  })

  it('Should refuse a negative estimate', () => {
    expect(validateNewTask(buildDraft({ estimatedHours: -8 })).estimatedHours).toBeDefined()
  })

  it('Should refuse an assignee when there is no window to allocate into', () => {
    const errors = validateNewTask(
      buildDraft({
        plannedStart: null,
        plannedEnd: null,
        assignees: [{ personId: 'ana', percentage: 50 }],
      }),
    )

    expect(errors.assignees).toBeDefined()
  })

  it('Should refuse an allocation above one hundred percent', () => {
    const errors = validateNewTask(
      buildDraft({ assignees: [{ personId: 'ana', percentage: 120 }] }),
    )

    expect(errors.assignees).toBeDefined()
  })

  it('Should refuse an allocation of zero percent', () => {
    const errors = validateNewTask(buildDraft({ assignees: [{ personId: 'ana', percentage: 0 }] }))

    expect(errors.assignees).toBeDefined()
  })
})

describe('buildNewTask', () => {
  it('Should be born to do, with no actual date', () => {
    const { task } = buildNewTask(buildDraft(), IDS, 5)

    expect(task).toEqual({
      id: 'gw-conc',
      projectId: 'gateway',
      phaseId: 'production',
      title: 'Conciliação automática',
      description: null,
      status: 'todo',
      plannedStart: '2026-09-07',
      plannedEnd: '2026-10-09',
      actualStart: null,
      actualEnd: null,
      estimatedHours: 80,
      sortOrder: 5,
    })
  })

  it('Should keep the description the form asked about, as null when it is blank', () => {
    expect(buildNewTask(buildDraft({ description: '  ' }), IDS, 1).task.description).toBeNull()
    expect(buildNewTask(buildDraft({ description: '  Sem planilha  ' }), IDS, 1).task.description).toBe(
      'Sem planilha',
    )
  })

  it('Should be born with the status the form chose', () => {
    expect(buildNewTask(buildDraft({ status: 'in_progress' }), IDS, 1).task.status).toBe(
      'in_progress',
    )
  })

  it('Should trim the title before writing it', () => {
    const { task } = buildNewTask(buildDraft({ title: '  Cutover  ' }), IDS, 1)

    expect(task.title).toBe('Cutover')
  })

  it('Should open one open allocation per assignee, over the window of the task', () => {
    const { allocations } = buildNewTask(
      buildDraft({
        assignees: [
          { personId: 'ana', percentage: 50 },
          { personId: 'rafael', percentage: 30 },
        ],
      }),
      IDS,
      5,
    )

    expect(allocations).toEqual([
      {
        id: 'al-conc-1',
        taskId: 'gw-conc',
        personId: 'ana',
        startDate: '2026-09-07',
        endDate: '2026-10-09',
        percentage: 50,
        endedAt: null,
        endedReason: null,
      },
      {
        id: 'al-conc-2',
        taskId: 'gw-conc',
        personId: 'rafael',
        startDate: '2026-09-07',
        endDate: '2026-10-09',
        percentage: 30,
        endedAt: null,
        endedReason: null,
      },
    ])
  })

  it('Should open no allocation for a task without a window', () => {
    const { allocations } = buildNewTask(
      buildDraft({ plannedStart: null, plannedEnd: null }),
      IDS,
      5,
    )

    expect(allocations).toEqual([])
  })
})

describe('nextSortOrder', () => {
  it('Should place the new task after the last one of the gateway', () => {
    expect(nextSortOrder(gatewayTasks)).toBe(5)
  })

  it('Should start at one on a project with no task', () => {
    expect(nextSortOrder([])).toBe(1)
  })

  it('Should not repeat an order when the numbers have gaps', () => {
    expect(nextSortOrder([buildTask({ sortOrder: 9 }), buildTask({ sortOrder: 2 })])).toBe(10)
  })
})

describe('previewTaskImpact', () => {
  it('Should show the effort the design previews for a new eighty hour task', () => {
    const impact = previewTaskImpact(gatewayTasks, buildDraft())

    expect(impact.effortBefore).toBe(320)
    expect(impact.effortAfter).toBe(400)
  })

  it('Should push the end of the project when the task ends later', () => {
    const impact = previewTaskImpact(gatewayTasks, buildDraft())

    expect(impact.periodBefore).toEqual({ start: '2026-03-12', end: '2026-09-29' })
    expect(impact.periodAfter).toEqual({ start: '2026-03-12', end: '2026-10-09' })
  })

  it('Should leave the window untouched by a task that fits inside it', () => {
    const impact = previewTaskImpact(
      gatewayTasks,
      buildDraft({ plannedStart: '2026-04-01', plannedEnd: '2026-04-30' }),
    )

    expect(impact.periodAfter).toEqual(impact.periodBefore)
  })

  it('Should not change the effort for a task with no estimate', () => {
    const impact = previewTaskImpact(gatewayTasks, buildDraft({ estimatedHours: null }))

    expect(impact.effortAfter).toBe(impact.effortBefore)
  })

  it('Should replace the edited task instead of counting it twice', () => {
    const edited = gatewayTasks[0]
    const impact = previewTaskImpact(
      gatewayTasks,
      buildDraft({ estimatedHours: (edited?.estimatedHours ?? 0) + 8 }),
      edited?.id ?? null,
    )

    expect(impact.effortBefore).toBe(320)
    expect(impact.effortAfter).toBe(328)
  })
})

describe('previewAllocationConflicts', () => {
  let seed: ProjectsSnapshot

  beforeAll(() => {
    seed = readProjectsSnapshot(openSeedDatabase())
  })

  function previewWith(assignees: NewTaskDraft['assignees']) {
    return previewAllocationConflicts({
      draft: buildDraft({ assignees }),
      tasks: seed.tasks,
      allocations: seed.allocations,
      projects: seed.projects,
      people: seed.people,
    })
  }

  it('Should report no conflict when nobody is assigned', () => {
    expect(previewWith([])).toEqual([])
  })

  it('Should push Ana past one hundred percent, she is already at fifty in the window', () => {
    const conflicts = previewWith([{ personId: 'ana', percentage: 100 }])

    expect(conflicts.map((conflict) => conflict.totalPercentage)).toEqual([150])
    expect(conflicts[0]?.person.id).toBe('ana')
  })

  it('Should leave Ana inside capacity at the fifty percent that still fits', () => {
    expect(previewWith([{ personId: 'ana', percentage: 50 }])).toEqual([])
  })

  it('Should name the new task among what builds the conflict it causes', () => {
    const conflicts = previewWith([{ personId: 'ana', percentage: 100 }])

    expect(conflicts[0]?.contributions.map((contribution) => contribution.taskTitle)).toEqual([
      'Testes de carga',
      'Conciliação automática',
    ])
  })
})
