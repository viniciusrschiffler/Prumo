import {
  addMonths,
  differenceInDays,
  earliestDate,
  intersectPeriods,
  latestDate,
  startOfMonth,
} from '@/domain/dates/isoDateMath'
import { collectBlockedPeriods } from '@/domain/derived/calculateBlockedDays'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import type { ProjectActivity } from './dashboardActivity'

export type BlockedMonth = {
  monthStart: IsoDate
  blockedDays: number
}

export type BlockedProjectRow = {
  projectId: EntityId
  name: string
  phaseColor: string | null
  blockedDays: number
}

function listMonthStarts(period: DatePeriod): IsoDate[] {
  const months: IsoDate[] = []

  for (
    let monthStart = startOfMonth(period.start);
    monthStart <= period.end;
    monthStart = addMonths(monthStart, 1)
  ) {
    months.push(monthStart)
  }

  return months
}

function listBlockedInPeriod(
  activities: readonly ProjectActivity[],
  period: DatePeriod,
): DatePeriod[] {
  return activities
    .flatMap((activity) => collectBlockedPeriods(activity.events, period.end))
    .map((blocked) => intersectPeriods(blocked, period))
    .filter((blocked) => blocked !== null)
}

// O bloqueio que atravessa a virada do mês é repartido pela fronteira, e não duplicado nela:
// o mês vale do seu primeiro dia até o primeiro dia do mês seguinte, então a soma das colunas
// devolve exatamente o total que `calculateBlockedDays` mede sobre a janela inteira.
export function sumBlockedDaysByMonth(
  activities: readonly ProjectActivity[],
  period: DatePeriod,
): BlockedMonth[] {
  const blockedPeriods = listBlockedInPeriod(activities, period)

  return listMonthStarts(period).map((monthStart) => {
    const nextMonthStart = addMonths(monthStart, 1)

    return {
      monthStart,
      blockedDays: blockedPeriods.reduce((total, blocked) => {
        const from = latestDate(blocked.start, monthStart)
        const to = earliestDate(blocked.end, nextMonthStart)

        return total + Math.max(0, differenceInDays(from, to))
      }, 0),
    }
  })
}

export function listBlockedDaysByProject(
  activities: readonly ProjectActivity[],
): BlockedProjectRow[] {
  return activities
    .filter((activity) => activity.blockedDays > 0)
    .map((activity) => ({
      projectId: activity.row.project.id,
      name: activity.row.project.name,
      phaseColor: activity.row.currentPhase?.color ?? null,
      blockedDays: activity.blockedDays,
    }))
    .toSorted(
      (first, second) =>
        second.blockedDays - first.blockedDays || first.name.localeCompare(second.name, 'pt-BR'),
    )
}

export function sumBlockedDays(activities: readonly ProjectActivity[]): number {
  return activities.reduce((total, activity) => total + activity.blockedDays, 0)
}
