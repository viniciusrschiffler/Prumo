import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import { buildTimelinePersonRows, type TimelinePersonRow } from './timelinePersonRows'
import { buildTimelinePhaseRows, type TimelinePhaseRow } from './timelinePhaseRows'
import { buildTimelineProjectRows, type TimelineProjectRow } from './timelineProjectRows'

export const TIMELINE_GROUPINGS = ['project', 'person', 'phase'] as const

export type TimelineGrouping = (typeof TIMELINE_GROUPINGS)[number]

export type TimelineGroupRow = TimelineProjectRow | TimelinePersonRow | TimelinePhaseRow

export type TimelineRows = {
  project: readonly TimelineProjectRow[]
  person: readonly TimelinePersonRow[]
  phase: readonly TimelinePhaseRow[]
}

export function buildTimelineRows(snapshot: ProjectsSnapshot, today: IsoDate): TimelineRows {
  return {
    project: buildTimelineProjectRows(snapshot, today),
    person: buildTimelinePersonRows(snapshot),
    phase: buildTimelinePhaseRows(snapshot, today),
  }
}

export function collectRowPeriods(rows: TimelineRows): DatePeriod[] {
  return [
    ...rows.project.flatMap((row) => [row.period, ...row.tasks.map((task) => task.period)]),
    ...rows.person.flatMap((row) => row.allocations.map((allocation) => allocation.period)),
    ...rows.phase.flatMap((row) => row.projects.map((entry) => entry.period)),
  ].filter((period) => period !== null)
}

// O rodapé conta o mesmo que a visão por pessoa pinta, então o número sai das linhas e não de
// uma segunda varredura que poderia divergir dela.
export function countOverloads(rows: TimelineRows): number {
  return rows.person.reduce((total, row) => total + row.overloads.length, 0)
}

// O grupo nasce aberto, então o que a tela guarda é quem foi fechado: uma lista de expandidos
// precisaria ser semeada a cada recarga e perderia o grupo que acabou de nascer.
export function countVisibleItems(
  rows: readonly TimelineGroupRow[],
  collapsedIds: ReadonlySet<EntityId>,
): number {
  return rows
    .filter((row) => !collapsedIds.has(row.id))
    .reduce((total, row) => total + row.itemCount, 0)
}
