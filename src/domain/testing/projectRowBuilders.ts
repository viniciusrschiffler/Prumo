import type { ProjectRow } from '@/domain/projects/projectRow'
import type { Project } from '@/domain/schemas/projectSchema'

export function buildProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'gateway',
    name: 'Migração do gateway',
    description: null,
    status: 'active',
    priority: 'P1',
    ownerPersonId: 'ana',
    plannedStart: '2026-03-12',
    plannedEnd: '2026-09-29',
    createdAt: '2026-02-20T09:00:00Z',
    archivedAt: null,
    pausedAt: null,
    ...overrides,
  }
}

export function buildProjectRow(
  project: Partial<Project> = {},
  overrides: Partial<ProjectRow> = {},
): ProjectRow {
  return {
    project: buildProject(project),
    currentPhase: null,
    people: [],
    hasOnlyEndedAllocations: false,
    tagNames: [],
    effortHours: 0,
    countedTaskCount: 0,
    hoursProgress: { completedHours: 0, totalHours: 0, ratio: 0 },
    taskProgress: { doneCount: 0, countedCount: 0, ratio: 0 },
    period: null,
    deviationInDays: null,
    isDelayed: false,
    hasOpenRisk: false,
    tasks: [],
    ...overrides,
  }
}
