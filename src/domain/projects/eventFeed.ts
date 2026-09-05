import { calculateBlockedDays } from '@/domain/derived/calculateBlockedDays'
import { deriveBaselinePeriod } from '@/domain/derived/deriveProjectPeriod'
import type { Baseline, BaselineTask } from '@/domain/schemas/baselineSchema'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { ProjectEvent, ProjectEventTask } from '@/domain/schemas/projectEventSchema'
import type { Task } from '@/domain/schemas/taskSchema'

export const EVENTS_PER_PAGE = 7

export type FrozenBaseline = {
  version: number
  effortBefore: number
  effortAfter: number
  endBefore: IsoDate | null
  endAfter: IsoDate | null
}

export type EventFeedEntry = {
  event: ProjectEvent
  tasks: readonly Task[]
  reverts: ProjectEvent | null
  frozenBaseline: FrozenBaseline | null
  blockedDays: number | null
}

export type EventFeedInput = {
  events: readonly ProjectEvent[]
  eventTasks: readonly ProjectEventTask[]
  tasks: readonly Task[]
  baselines: readonly Baseline[]
  baselineTasks: readonly BaselineTask[]
}

function compareByDateDescending(first: ProjectEvent, second: ProjectEvent): number {
  if (first.eventDate !== second.eventDate) {
    return first.eventDate < second.eventDate ? 1 : -1
  }

  return first.createdAt < second.createdAt ? 1 : -1
}

function sumBaselineEffort(baselineTasks: readonly BaselineTask[]): number {
  return baselineTasks.reduce(
    (total, baselineTask) => total + (baselineTask.estimatedHours ?? 0),
    0,
  )
}

// A baseline não guarda o evento que a congelou: o que liga os dois é o instante, porque
// congelar a baseline e gravar a mudança de escopo acontecem na mesma transação.
function findFrozenBaseline(
  event: ProjectEvent,
  baselines: readonly Baseline[],
  baselineTasksByBaseline: Map<EntityId, BaselineTask[]>,
): FrozenBaseline | null {
  const frozen = baselines.find(
    (baseline) => baseline.projectId === event.projectId && baseline.createdAt === event.createdAt,
  )

  if (frozen === undefined) {
    return null
  }

  const previous = baselines
    .filter((baseline) => baseline.projectId === event.projectId)
    .filter((baseline) => baseline.version < frozen.version)
    .toSorted((first, second) => first.version - second.version)
    .at(-1)

  const frozenTasks = baselineTasksByBaseline.get(frozen.id) ?? []
  const previousTasks = previous === undefined ? [] : (baselineTasksByBaseline.get(previous.id) ?? [])

  return {
    version: frozen.version,
    effortBefore: sumBaselineEffort(previousTasks),
    effortAfter: sumBaselineEffort(frozenTasks),
    endBefore: deriveBaselinePeriod(previousTasks)?.end ?? null,
    endAfter: deriveBaselinePeriod(frozenTasks)?.end ?? null,
  }
}

// Só o desbloqueio conta dias: o bloqueio ainda aberto não tem fim para medir, e o número
// que o design imprime é a distância até o desbloqueio que veio depois.
function countBlockedDaysUntil(event: ProjectEvent, events: readonly ProjectEvent[]): number | null {
  if (event.type !== 'unblock') {
    return null
  }

  const opening = events
    .filter((candidate) => candidate.type === 'block' && candidate.eventDate <= event.eventDate)
    .toSorted((first, second) => first.eventDate.localeCompare(second.eventDate))
    .at(-1)

  if (opening === undefined) {
    return null
  }

  return calculateBlockedDays(events, { start: opening.eventDate, end: event.eventDate })
}

export function buildEventFeed(input: EventFeedInput): EventFeedEntry[] {
  const eventsById = new Map(input.events.map((event) => [event.id, event]))
  const tasksById = new Map(input.tasks.map((task) => [task.id, task]))
  const baselineTasksByBaseline = new Map<EntityId, BaselineTask[]>()

  for (const baselineTask of input.baselineTasks) {
    baselineTasksByBaseline.set(baselineTask.baselineId, [
      ...(baselineTasksByBaseline.get(baselineTask.baselineId) ?? []),
      baselineTask,
    ])
  }

  return input.events.toSorted(compareByDateDescending).map((event) => ({
    event,
    tasks: input.eventTasks
      .filter((link) => link.projectEventId === event.id)
      .map((link) => tasksById.get(link.taskId))
      .filter((task) => task !== undefined),
    reverts: event.revertsEventId === null ? null : (eventsById.get(event.revertsEventId) ?? null),
    frozenBaseline: findFrozenBaseline(event, input.baselines, baselineTasksByBaseline),
    blockedDays: countBlockedDaysUntil(event, input.events),
  }))
}

export type EventFeedPage = {
  visible: readonly EventFeedEntry[]
  remainingCount: number
}

export function paginateEventFeed(
  entries: readonly EventFeedEntry[],
  pageCount: number,
): EventFeedPage {
  const visibleCount = Math.max(1, pageCount) * EVENTS_PER_PAGE

  return {
    visible: entries.slice(0, visibleCount),
    remainingCount: Math.max(0, entries.length - visibleCount),
  }
}
