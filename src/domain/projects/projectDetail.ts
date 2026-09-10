import type { EntityId } from '@/domain/schemas/primitives'
import { buildAllocationRows, type AllocationRow } from './allocationRows'
import { findAllocationConflicts, type AllocationConflict } from './allocationConflicts'
import {
  compareAgainstBaseline,
  listBaselineOptions,
  type BaselineComparison,
  type BaselineOption,
} from './baselineOptions'
import { buildEventFeed, type EventFeedEntry } from './eventFeed'
import { listProjectNoteCards, type ProjectNoteCard } from './projectNotes'
import { buildProjectRows, type ProjectRow, type ProjectsSnapshot } from './projectRow'

export type ProjectDetail = {
  row: ProjectRow
  baselineOptions: readonly BaselineOption[]
  comparison: BaselineComparison
  allocationRows: readonly AllocationRow[]
  conflicts: readonly AllocationConflict[]
  feed: readonly EventFeedEntry[]
  noteCards: readonly ProjectNoteCard[]
}

export function findProjectDetail(
  snapshot: ProjectsSnapshot,
  projectId: EntityId,
  selectedBaselineId: EntityId | null,
): ProjectDetail | null {
  const row = buildProjectRows(snapshot).find((candidate) => candidate.project.id === projectId)

  if (row === undefined) {
    return null
  }

  const taskIds = row.tasks.map((taskRow) => taskRow.task.id)
  const baselines = snapshot.baselines.filter((baseline) => baseline.projectId === projectId)

  return {
    row,
    baselineOptions: listBaselineOptions(baselines, snapshot.baselineTasks),
    comparison: compareAgainstBaseline(
      selectedBaselineId,
      baselines,
      snapshot.baselineTasks,
      row.period?.end ?? null,
    ),
    allocationRows: buildAllocationRows(
      taskIds,
      snapshot.allocations,
      snapshot.tasks,
      snapshot.people,
    ),
    conflicts: findAllocationConflicts({
      projectId,
      taskIds,
      allocations: snapshot.allocations,
      tasks: snapshot.tasks,
      projects: snapshot.projects,
      people: snapshot.people,
    }),
    feed: buildEventFeed({
      events: snapshot.events.filter((event) => event.projectId === projectId),
      eventTasks: snapshot.eventTasks,
      tasks: snapshot.tasks,
      baselines,
      baselineTasks: snapshot.baselineTasks,
    }),
    noteCards: listProjectNoteCards(snapshot.notes, snapshot.events, projectId),
  }
}
