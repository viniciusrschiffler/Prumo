import { calculateTotalEffort } from '@/domain/derived/calculateTotalEffort'
import type { Person } from '@/domain/schemas/personSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import type { ProjectActivity } from './dashboardActivity'
import { sumBlockedDays } from './blockedDays'
import { calculateCapacityUsage, type WorkloadRow } from './workloadDistribution'

export type DashboardKpis = {
  deliveredProjectCount: number
  averageDeviationInDays: number | null
  plannedEffortHours: number
  capacityUsagePercentage: number
  blockedDays: number
}

// Entregue é o projeto cujas tarefas contadas terminaram todas, com o último fim caindo dentro
// da janela. O status `completed` existe no schema, mas quem responde pelo que aconteceu é a
// tarefa: um projeto pode ter fechado sem ninguém ter trocado o status.
function isDeliveredIn(activity: ProjectActivity, period: DatePeriod): boolean {
  const { taskProgress, period: projectPeriod } = activity.row

  return (
    taskProgress.countedCount > 0 &&
    taskProgress.doneCount === taskProgress.countedCount &&
    projectPeriod !== null &&
    projectPeriod.end >= period.start &&
    projectPeriod.end <= period.end
  )
}

// O desvio é sempre contra a baseline vigente, como nas telas de Projeto e Timeline. A janela
// só escolhe quais projetos entram na média; um adiantado compensa um atrasado.
function averageDeviation(activities: readonly ProjectActivity[]): number | null {
  const deviations = activities
    .map((activity) => activity.row.deviationInDays)
    .filter((deviation) => deviation !== null)

  if (deviations.length === 0) {
    return null
  }

  return Math.round(
    deviations.reduce((total, deviation) => total + deviation, 0) / deviations.length,
  )
}

export function buildDashboardKpis(
  activities: readonly ProjectActivity[],
  workload: readonly WorkloadRow[],
  people: readonly Person[],
  period: DatePeriod,
): DashboardKpis {
  return {
    deliveredProjectCount: activities.filter((activity) => isDeliveredIn(activity, period)).length,
    averageDeviationInDays: averageDeviation(activities),
    plannedEffortHours: activities.reduce(
      (total, activity) => total + calculateTotalEffort(activity.tasksInPeriod),
      0,
    ),
    capacityUsagePercentage: calculateCapacityUsage(workload, people),
    blockedDays: sumBlockedDays(activities),
  }
}
