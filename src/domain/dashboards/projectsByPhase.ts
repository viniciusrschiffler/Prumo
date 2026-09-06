import type { Phase } from '@/domain/schemas/phaseSchema'
import type { ProjectActivity } from './dashboardActivity'

export type PhaseProjectCount = {
  phase: Phase
  projectCount: number
}

// A fase de um projeto é a da primeira tarefa ainda aberta, a mesma leitura do resto do app.
// Contar todas as fases que ele tocou somaria mais "projetos" do que existem projetos.
export function countProjectsByPhase(
  activities: readonly ProjectActivity[],
  phases: readonly Phase[],
): PhaseProjectCount[] {
  return phases
    .filter((phase) => phase.active)
    .map((phase) => ({
      phase,
      projectCount: activities.filter(
        (activity) => activity.row.currentPhase?.id === phase.id,
      ).length,
    }))
}
