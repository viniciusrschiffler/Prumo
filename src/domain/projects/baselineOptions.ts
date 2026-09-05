import { calculateDeviationInDays, isDelayed } from '@/domain/derived/calculateDeviationInDays'
import { deriveBaselinePeriod } from '@/domain/derived/deriveProjectPeriod'
import { selectCurrentBaseline } from '@/domain/derived/selectCurrentBaseline'
import type { Baseline, BaselineTask } from '@/domain/schemas/baselineSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export type BaselineOption = {
  baseline: Baseline
  period: DatePeriod | null
  isCurrent: boolean
}

export type BaselineComparison = {
  baseline: Baseline | null
  period: DatePeriod | null
  deviationInDays: number | null
  isDelayed: boolean
}

function tasksOf(
  baselineId: EntityId,
  baselineTasks: readonly BaselineTask[],
): BaselineTask[] {
  return baselineTasks.filter((baselineTask) => baselineTask.baselineId === baselineId)
}

// A vigente encabeça a lista porque é contra ela que o desvio é medido; as anteriores
// sobrevivem abaixo, em ordem decrescente, apenas como histórico consultável.
export function listBaselineOptions(
  baselines: readonly Baseline[],
  baselineTasks: readonly BaselineTask[],
): BaselineOption[] {
  const current = selectCurrentBaseline(baselines)

  return baselines
    .toSorted((first, second) => second.version - first.version)
    .map((baseline) => ({
      baseline,
      period: deriveBaselinePeriod(tasksOf(baseline.id, baselineTasks)),
      isCurrent: baseline.id === current?.id,
    }))
}

export function compareAgainstBaseline(
  baselineId: EntityId | null,
  baselines: readonly Baseline[],
  baselineTasks: readonly BaselineTask[],
  currentEnd: string | null,
): BaselineComparison {
  const chosen =
    baselines.find((baseline) => baseline.id === baselineId) ?? selectCurrentBaseline(baselines)

  if (chosen === null || chosen === undefined) {
    return { baseline: null, period: null, deviationInDays: null, isDelayed: false }
  }

  const period = deriveBaselinePeriod(tasksOf(chosen.id, baselineTasks))
  const deviationInDays = calculateDeviationInDays(currentEnd, period?.end ?? null)

  return {
    baseline: chosen,
    period,
    deviationInDays,
    isDelayed: isDelayed(deviationInDays),
  }
}
