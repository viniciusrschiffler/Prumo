import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { BaselineTask } from '@/domain/schemas/baselineSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Task } from '@/domain/schemas/taskSchema'

export function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    projectId: 'project-1',
    phaseId: 'development',
    title: 'Tarefa',
    description: null,
    status: 'todo',
    plannedStart: '2026-03-01',
    plannedEnd: '2026-03-10',
    actualStart: null,
    actualEnd: null,
    estimatedHours: 40,
    sortOrder: 0,
    ...overrides,
  }
}

export function buildBaselineTask(overrides: Partial<BaselineTask> = {}): BaselineTask {
  return {
    baselineId: 'baseline-1',
    taskId: 'task-1',
    plannedStart: '2026-03-01',
    plannedEnd: '2026-03-10',
    estimatedHours: 40,
    ...overrides,
  }
}

export function buildPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'person-1',
    name: 'Ana Nogueira',
    initials: 'AN',
    role: 'Desenvolvedora',
    weeklyCapacityHours: 40,
    active: true,
    ...overrides,
  }
}

export function buildAllocation(overrides: Partial<Allocation> = {}): Allocation {
  return {
    id: 'allocation-1',
    taskId: 'task-1',
    personId: 'person-1',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    percentage: 50,
    endedAt: null,
    endedReason: null,
    ...overrides,
  }
}

export function buildProjectEvent(overrides: Partial<ProjectEvent> = {}): ProjectEvent {
  return {
    id: 'event-1',
    projectId: 'project-1',
    type: 'note',
    eventDate: '2026-03-01',
    title: 'Evento',
    bodyMarkdown: null,
    revertsEventId: null,
    riskOpen: false,
    expectedResumeAt: null,
    createdAt: '2026-03-01T12:00:00Z',
    ...overrides,
  }
}
