import { collectBlockedPeriods } from '@/domain/derived/calculateBlockedDays'
import { intersectPeriods, toIsoDateOf } from '@/domain/dates/isoDateMath'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Project } from '@/domain/schemas/projectSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

// A hachura tem exatamente o comprimento do número que o selo mostra: o bloqueio ainda aberto
// para em hoje, porque os dias que vêm depois ainda não foram perdidos.
export function collectBlockedOverlays(
  events: readonly ProjectEvent[],
  today: IsoDate,
): DatePeriod[] {
  return collectBlockedPeriods(events, today).filter((period) => period.start <= period.end)
}

export function findPausedOverlay(
  project: Project,
  period: DatePeriod | null,
): DatePeriod | null {
  if (project.status !== 'paused' || project.pausedAt === null || period === null) {
    return null
  }

  return intersectPeriods({ start: toIsoDateOf(project.pausedAt), end: period.end }, period)
}
