import { deriveProjectPeriod } from '@/domain/derived/deriveProjectPeriod'
import { calculateTotalEffort } from '@/domain/derived/calculateTotalEffort'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import type { ProjectTaskRow } from './projectRow'

export type TaskPhaseGroup = {
  phase: Phase | null
  tasks: readonly ProjectTaskRow[]
  effortHours: number
  countedTaskCount: number
  period: DatePeriod | null
}

export type TaskGroupsTotals = {
  effortHours: number
  countedTaskCount: number
  period: DatePeriod | null
}

const UNPHASED_KEY = ''

function toPhaseKey(row: ProjectTaskRow): EntityId {
  return row.phase?.id ?? UNPHASED_KEY
}

function buildGroup(phase: Phase | null, rows: readonly ProjectTaskRow[]): TaskPhaseGroup {
  const tasks = rows.map((row) => row.task)

  return {
    phase,
    tasks: rows,
    effortHours: calculateTotalEffort(tasks),
    countedTaskCount: tasks.filter((task) => task.status !== 'cancelled').length,
    period: deriveProjectPeriod(tasks),
  }
}

// A ordem das fases é a do cadastro, não a de aparição das tarefas: o design lê a coluna de
// fases de cima para baixo e uma fase sem tarefa visível simplesmente não abre grupo.
export function groupTasksByPhase(
  rows: readonly ProjectTaskRow[],
  phases: readonly Phase[],
): TaskPhaseGroup[] {
  const rowsByPhase = new Map<EntityId, ProjectTaskRow[]>()

  for (const row of rows) {
    const key = toPhaseKey(row)

    rowsByPhase.set(key, [...(rowsByPhase.get(key) ?? []), row])
  }

  const grouped = phases
    .filter((phase) => rowsByPhase.has(phase.id))
    .map((phase) => buildGroup(phase, rowsByPhase.get(phase.id) ?? []))

  const unphased = rowsByPhase.get(UNPHASED_KEY)

  return unphased === undefined ? grouped : [...grouped, buildGroup(null, unphased)]
}

export function sumTaskGroups(groups: readonly TaskPhaseGroup[]): TaskGroupsTotals {
  const tasks = groups.flatMap((group) => group.tasks).map((row) => row.task)

  return {
    effortHours: calculateTotalEffort(tasks),
    countedTaskCount: tasks.filter((task) => task.status !== 'cancelled').length,
    period: deriveProjectPeriod(tasks),
  }
}
