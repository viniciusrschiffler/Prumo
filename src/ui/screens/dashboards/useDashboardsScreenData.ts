import { useMemo } from 'react'
import type { DashboardPeriodKey } from '@/domain/dashboards/dashboardPeriod'
import { buildDashboardSummary } from '@/domain/dashboards/dashboardSummary'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { WeekStart } from '@/domain/settings/appSettings'

export type DashboardsScreenDataInput = {
  snapshot: ProjectsSnapshot
  today: IsoDate
  weekStart: WeekStart
  periodKey: DashboardPeriodKey
}

export function useDashboardsScreenData({
  snapshot,
  today,
  weekStart,
  periodKey,
}: DashboardsScreenDataInput) {
  return useMemo(
    () => buildDashboardSummary({ snapshot, today, weekStart, periodKey }),
    [snapshot, today, weekStart, periodKey],
  )
}
