import { addDays } from '@/domain/dates/isoDateMath'
import { formatIsoDayMonth } from '@/domain/format/displayDate'
import type { EntityId, IsoDateTime } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export const SCHEDULE_EDIT_MODES = ['move', 'start', 'end'] as const

export type ScheduleEditMode = (typeof SCHEDULE_EDIT_MODES)[number]

export type TaskReschedule = {
  taskId: EntityId
  period: DatePeriod
  event: ProjectEvent
}

// Nem mover nem redimensionar podem cruzar as bordas: encolher o começo para além do fim
// inverteria a barra, e a coluna do banco recusaria a linha depois de a tela já ter mexido nela.
export function applyScheduleEdit(
  period: DatePeriod,
  mode: ScheduleEditMode,
  offsetDays: number,
): DatePeriod {
  if (mode === 'move') {
    return { start: addDays(period.start, offsetDays), end: addDays(period.end, offsetDays) }
  }

  if (mode === 'start') {
    const start = addDays(period.start, offsetDays)

    return { start: start > period.end ? period.end : start, end: period.end }
  }

  const end = addDays(period.end, offsetDays)

  return { start: period.start, end: end < period.start ? period.start : end }
}

export function hasScheduleChanged(before: DatePeriod, after: DatePeriod): boolean {
  return before.start !== after.start || before.end !== after.end
}

function describeEdge(label: string, before: string, after: string): string | null {
  return before === after
    ? null
    : `${label} ${formatIsoDayMonth(before)} → ${formatIsoDayMonth(after)}`
}

export function describeScheduleChange(before: DatePeriod, after: DatePeriod): string {
  return [
    describeEdge('Início', before.start, after.start),
    describeEdge('Fim', before.end, after.end),
  ]
    .filter((part) => part !== null)
    .join(' · ')
}

export type TaskRescheduleInput = {
  taskId: EntityId
  projectId: EntityId
  taskTitle: string
  before: DatePeriod
  after: DatePeriod
  eventId: EntityId
  now: IsoDateTime
}

export function buildTaskReschedule(input: TaskRescheduleInput): TaskReschedule {
  return {
    taskId: input.taskId,
    period: input.after,
    event: {
      id: input.eventId,
      projectId: input.projectId,
      type: 'replan',
      eventDate: input.now.slice(0, 10),
      title: input.taskTitle,
      bodyMarkdown: describeScheduleChange(input.before, input.after),
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: null,
      createdAt: input.now,
    },
  }
}
