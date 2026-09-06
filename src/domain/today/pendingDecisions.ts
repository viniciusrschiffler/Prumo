import { differenceInDays, toIsoDateOf } from '@/domain/dates/isoDateMath'
import { findOpenBlockEvent } from '@/domain/derived/calculateBlockedDays'
import { effectiveEndOf } from '@/domain/derived/calculateWeeklyCapacity'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Project } from '@/domain/schemas/projectSchema'
import type { Task } from '@/domain/schemas/taskSchema'

export type PendingDecisionKind = 'blocked' | 'paused'

export type AllocatedPerson = {
  person: Person
  percentage: number
}

export type PendingDecision = {
  project: Project
  kind: PendingDecisionKind
  sinceDate: IsoDate
  sinceDays: number
  blockEvent: ProjectEvent | null
  expectedResumeAt: IsoDate | null
  overdueResumeDays: number | null
  allocatedPeople: readonly AllocatedPerson[]
}

export type PendingDecisionsInput = {
  projects: readonly Project[]
  tasks: readonly Task[]
  events: readonly ProjectEvent[]
  allocations: readonly Allocation[]
  people: readonly Person[]
  today: IsoDate
}

function isLiveOn(allocation: Allocation, date: IsoDate): boolean {
  return (
    allocation.endedAt === null &&
    allocation.startDate <= date &&
    date <= effectiveEndOf(allocation)
  )
}

// "Marcos segue 30% alocado" sai das alocações vivas, não da prosa do evento que pausou o
// projeto: o que importa é quem ainda consome capacidade hoje.
function listAllocatedPeople(
  project: Project,
  input: PendingDecisionsInput,
): AllocatedPerson[] {
  const taskIds = new Set(
    input.tasks.filter((task) => task.projectId === project.id).map((task) => task.id),
  )
  const percentageByPerson = new Map<EntityId, number>()

  for (const allocation of input.allocations) {
    if (!taskIds.has(allocation.taskId) || !isLiveOn(allocation, input.today)) {
      continue
    }

    percentageByPerson.set(
      allocation.personId,
      (percentageByPerson.get(allocation.personId) ?? 0) + allocation.percentage,
    )
  }

  return input.people
    .filter((person) => percentageByPerson.has(person.id))
    .map((person) => ({ person, percentage: percentageByPerson.get(person.id) ?? 0 }))
    .toSorted((first, second) => first.person.name.localeCompare(second.person.name, 'pt-BR'))
}

function toOverdueResumeDays(expectedResumeAt: IsoDate | null, today: IsoDate): number | null {
  if (expectedResumeAt === null || expectedResumeAt >= today) {
    return null
  }

  return differenceInDays(expectedResumeAt, today)
}

function toBlockedDecision(
  project: Project,
  input: PendingDecisionsInput,
): PendingDecision | null {
  const blockEvent = findOpenBlockEvent(
    input.events.filter((event) => event.projectId === project.id),
  )

  if (blockEvent === null) {
    return null
  }

  return {
    project,
    kind: 'blocked',
    sinceDate: blockEvent.eventDate,
    sinceDays: differenceInDays(blockEvent.eventDate, input.today),
    blockEvent,
    expectedResumeAt: blockEvent.expectedResumeAt,
    overdueResumeDays: toOverdueResumeDays(blockEvent.expectedResumeAt, input.today),
    allocatedPeople: listAllocatedPeople(project, input),
  }
}

function toPausedDecision(
  project: Project,
  input: PendingDecisionsInput,
): PendingDecision | null {
  if (project.pausedAt === null) {
    return null
  }

  const sinceDate = toIsoDateOf(project.pausedAt)

  return {
    project,
    kind: 'paused',
    sinceDate,
    sinceDays: differenceInDays(sinceDate, input.today),
    blockEvent: null,
    expectedResumeAt: null,
    overdueResumeDays: null,
    allocatedPeople: listAllocatedPeople(project, input),
  }
}

// Bloqueado antes de pausado, e o mais antigo primeiro: o card de cima é o que espera há mais
// tempo, que é o que a coluna contextual do design mostra.
function compareDecisions(first: PendingDecision, second: PendingDecision): number {
  if (first.kind !== second.kind) {
    return first.kind === 'blocked' ? -1 : 1
  }

  return second.sinceDays - first.sinceDays
}

function toDecision(project: Project, input: PendingDecisionsInput): PendingDecision | null {
  if (project.status === 'blocked') {
    return toBlockedDecision(project, input)
  }

  return project.status === 'paused' ? toPausedDecision(project, input) : null
}

export function findPendingDecisions(input: PendingDecisionsInput): PendingDecision[] {
  return input.projects
    .filter((project) => project.archivedAt === null)
    .map((project) => toDecision(project, input))
    .filter((decision) => decision !== null)
    .toSorted(compareDecisions)
}
