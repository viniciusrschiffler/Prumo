import type { Baseline } from '@/domain/schemas/baselineSchema'

// A baseline é versionada por projeto e o desvio se mede contra a vigente, que é a de maior
// versão — nunca contra a v1, que sobrevive apenas como histórico.
export function selectCurrentBaseline(baselines: readonly Baseline[]): Baseline | null {
  if (baselines.length === 0) {
    return null
  }

  return baselines.reduce((current, candidate) =>
    candidate.version > current.version ? candidate : current,
  )
}
