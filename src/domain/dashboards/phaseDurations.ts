import { calculateAverageDaysPerPhase } from '@/domain/derived/calculateAverageDaysPerPhase'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { ProjectActivity } from './dashboardActivity'

export type PhaseDurationRow = {
  phase: Phase
  averageDays: number | null
  taskCount: number
}

export type PhaseBottleneck = {
  slowest: Phase
  fastest: Phase
  ratio: number
}

export function buildPhaseDurations(
  activities: readonly ProjectActivity[],
  phases: readonly Phase[],
): PhaseDurationRow[] {
  const durations = calculateAverageDaysPerPhase(
    activities.flatMap((activity) => activity.tasksInPeriod),
  )

  return phases
    .filter((phase) => phase.active)
    .map((phase) => {
      const duration = durations.find((candidate) => candidate.phaseId === phase.id)

      return {
        phase,
        averageDays: duration === undefined ? null : duration.averageDays,
        taskCount: duration?.taskCount ?? 0,
      }
    })
}

type MeasuredRow = PhaseDurationRow & { averageDays: number }

function isMeasured(row: PhaseDurationRow): row is MeasuredRow {
  return row.averageDays !== null && row.averageDays > 0
}

// O mockup compara o gargalo com a primeira fase, chamando-a de "desenvolvimento". Fase é
// configurável e a primeira pode ser a mais lenta, o que daria "X é 1,0× o tempo de X": a
// comparação que sempre diz alguma coisa é contra a fase mais rápida da janela.
export function findPhaseBottleneck(rows: readonly PhaseDurationRow[]): PhaseBottleneck | null {
  const measured = rows.filter(isMeasured).toSorted((first, second) => second.averageDays - first.averageDays)
  const slowest = measured[0]
  const fastest = measured[measured.length - 1]

  if (slowest === undefined || fastest === undefined || slowest.phase.id === fastest.phase.id) {
    return null
  }

  return {
    slowest: slowest.phase,
    fastest: fastest.phase,
    ratio: slowest.averageDays / fastest.averageDays,
  }
}

export function findSlowestPhaseId(rows: readonly PhaseDurationRow[]): string | null {
  return rows.filter(isMeasured).reduce<MeasuredRow | null>(
    (slowest, row) => (slowest === null || row.averageDays > slowest.averageDays ? row : slowest),
    null,
  )?.phase.id ?? null
}
