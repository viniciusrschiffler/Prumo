import type { DatabaseSync } from 'node:sqlite'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { BaselineTask } from '@/domain/schemas/baselineSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { Project } from '@/domain/schemas/projectSchema'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Task } from '@/domain/schemas/taskSchema'

type TaskRow = {
  id: string
  project_id: string
  phase_id: string
  title: string
  status: Task['status']
  planned_start: string | null
  planned_end: string | null
  actual_start: string | null
  actual_end: string | null
  estimated_hours: number | null
  sort_order: number
}

type BaselineTaskRow = {
  baseline_id: string
  task_id: string
  planned_start: string | null
  planned_end: string | null
  estimated_hours: number | null
}

type AllocationRow = {
  id: string
  task_id: string
  person_id: string
  start_date: string
  end_date: string
  percentage: number
  ended_at: string | null
  ended_reason: string | null
}

type ProjectEventRow = {
  id: string
  project_id: string
  type: ProjectEvent['type']
  event_date: string
  title: string
  body_md: string | null
  reverts_event_id: string | null
  risk_open: number
  expected_resume_at: string | null
  created_at: string
}

type PersonRow = {
  id: string
  name: string
  initials: string
  role: string | null
  weekly_capacity_hours: number
  active: number
}

function selectRows<TRow>(
  database: DatabaseSync,
  query: string,
  values: readonly unknown[] = [],
): TRow[] {
  return database.prepare(query).all(...(values as never[])) as TRow[]
}

export function readTasks(database: DatabaseSync, projectId: string): Task[] {
  return selectRows<TaskRow>(database, 'SELECT * FROM task WHERE project_id = ?', [projectId]).map(
    (row) => ({
      id: row.id,
      projectId: row.project_id,
      phaseId: row.phase_id,
      title: row.title,
      status: row.status,
      plannedStart: row.planned_start,
      plannedEnd: row.planned_end,
      actualStart: row.actual_start,
      actualEnd: row.actual_end,
      estimatedHours: row.estimated_hours,
      sortOrder: row.sort_order,
    }),
  )
}

export function readBaselineTasks(database: DatabaseSync, baselineId: string): BaselineTask[] {
  return selectRows<BaselineTaskRow>(
    database,
    'SELECT * FROM baseline_task WHERE baseline_id = ?',
    [baselineId],
  ).map((row) => ({
    baselineId: row.baseline_id,
    taskId: row.task_id,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    estimatedHours: row.estimated_hours,
  }))
}

export function readAllocations(database: DatabaseSync, projectId?: string): Allocation[] {
  const query =
    projectId === undefined
      ? 'SELECT a.* FROM allocation a'
      : 'SELECT a.* FROM allocation a JOIN task t ON t.id = a.task_id WHERE t.project_id = ?'

  return selectRows<AllocationRow>(
    database,
    query,
    projectId === undefined ? [] : [projectId],
  ).map((row) => ({
    id: row.id,
    taskId: row.task_id,
    personId: row.person_id,
    startDate: row.start_date,
    endDate: row.end_date,
    percentage: row.percentage,
    endedAt: row.ended_at,
    endedReason: row.ended_reason,
  }))
}

export function readEvents(database: DatabaseSync, projectId: string): ProjectEvent[] {
  return selectRows<ProjectEventRow>(
    database,
    'SELECT * FROM project_event WHERE project_id = ?',
    [projectId],
  ).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    eventDate: row.event_date,
    title: row.title,
    bodyMarkdown: row.body_md,
    revertsEventId: row.reverts_event_id,
    riskOpen: row.risk_open !== 0,
    expectedResumeAt: row.expected_resume_at,
    createdAt: row.created_at,
  }))
}

export function readPerson(database: DatabaseSync, id: string): Person {
  const row = selectRows<PersonRow>(database, 'SELECT * FROM person WHERE id = ?', [id])[0]

  if (row === undefined) {
    throw new Error(`pessoa ${id} não encontrada no seed`)
  }

  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    role: row.role,
    weeklyCapacityHours: row.weekly_capacity_hours,
    active: row.active !== 0,
  }
}

type ProjectRow = {
  id: string
  name: string
  description: string | null
  status: Project['status']
  priority: Project['priority']
  owner_person_id: string | null
  planned_start: string | null
  planned_end: string | null
  created_at: string
  archived_at: string | null
}

type BaselineRow = {
  id: string
  project_id: string
  version: number
  created_at: string
  reason: string
}

type PhaseRow = {
  id: string
  name: string
  sort_order: number
  color: string
  active: number
}

type TagRow = {
  id: string
  name: string
}

type ProjectTagRow = {
  project_id: string
  tag_id: string
}

export function readProjectsSnapshot(database: DatabaseSync): ProjectsSnapshot {
  return {
    projects: selectRows<ProjectRow>(database, 'SELECT * FROM project ORDER BY name').map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      priority: row.priority,
      ownerPersonId: row.owner_person_id,
      plannedStart: row.planned_start,
      plannedEnd: row.planned_end,
      createdAt: row.created_at,
      archivedAt: row.archived_at,
    })),
    tasks: selectRows<TaskRow>(database, 'SELECT * FROM task ORDER BY project_id, sort_order').map(
      (row) => ({
        id: row.id,
        projectId: row.project_id,
        phaseId: row.phase_id,
        title: row.title,
        status: row.status,
        plannedStart: row.planned_start,
        plannedEnd: row.planned_end,
        actualStart: row.actual_start,
        actualEnd: row.actual_end,
        estimatedHours: row.estimated_hours,
        sortOrder: row.sort_order,
      }),
    ),
    phases: selectRows<PhaseRow>(database, 'SELECT * FROM phase ORDER BY sort_order').map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
      color: row.color,
      active: row.active !== 0,
    })),
    people: selectRows<PersonRow>(database, 'SELECT * FROM person ORDER BY name').map((row) => ({
      id: row.id,
      name: row.name,
      initials: row.initials,
      role: row.role,
      weeklyCapacityHours: row.weekly_capacity_hours,
      active: row.active !== 0,
    })),
    allocations: readAllocations(database),
    baselines: selectRows<BaselineRow>(database, 'SELECT * FROM baseline').map((row) => ({
      id: row.id,
      projectId: row.project_id,
      version: row.version,
      createdAt: row.created_at,
      reason: row.reason,
    })),
    baselineTasks: selectRows<BaselineTaskRow>(database, 'SELECT * FROM baseline_task').map(
      (row) => ({
        baselineId: row.baseline_id,
        taskId: row.task_id,
        plannedStart: row.planned_start,
        plannedEnd: row.planned_end,
        estimatedHours: row.estimated_hours,
      }),
    ),
    events: selectRows<ProjectEventRow>(database, 'SELECT * FROM project_event').map((row) => ({
      id: row.id,
      projectId: row.project_id,
      type: row.type,
      eventDate: row.event_date,
      title: row.title,
      bodyMarkdown: row.body_md,
      revertsEventId: row.reverts_event_id,
      riskOpen: row.risk_open !== 0,
      expectedResumeAt: row.expected_resume_at,
      createdAt: row.created_at,
    })),
    tags: selectRows<TagRow>(database, 'SELECT * FROM tag ORDER BY name').map((row) => ({
      id: row.id,
      name: row.name,
    })),
    projectTags: selectRows<ProjectTagRow>(database, 'SELECT * FROM project_tag').map((row) => ({
      projectId: row.project_id,
      tagId: row.tag_id,
    })),
  }
}
