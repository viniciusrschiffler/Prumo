import { buildProjectRows, type ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { WeekStart } from '@/domain/settings/appSettings'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import {
  buildAllocationByProject,
  sumAllocations,
  type ProjectAllocationRow,
} from './allocationByProject'
import {
  listBlockedDaysByProject,
  sumBlockedDaysByMonth,
  type BlockedMonth,
  type BlockedProjectRow,
} from './blockedDays'
import { listProjectActivity } from './dashboardActivity'
import { buildDashboardKpis, type DashboardKpis } from './dashboardKpis'
import {
  buildDashboardPeriod,
  listWeeksIn,
  type DashboardPeriodKey,
} from './dashboardPeriod'
import { buildEventTypeCounts, sumEvents, type EventTypeCount } from './eventCounts'
import {
  buildPhaseDurations,
  findPhaseBottleneck,
  type PhaseBottleneck,
  type PhaseDurationRow,
} from './phaseDurations'
import { countProjectsByPhase, type PhaseProjectCount } from './projectsByPhase'
import { buildWorkloadDistribution, type WorkloadRow } from './workloadDistribution'

export type DashboardSummaryInput = {
  snapshot: ProjectsSnapshot
  today: IsoDate
  weekStart: WeekStart
  periodKey: DashboardPeriodKey
}

export type DashboardSummary = {
  periodKey: DashboardPeriodKey
  period: DatePeriod
  projectCount: number
  kpis: DashboardKpis
  allocationByProject: readonly ProjectAllocationRow[]
  allocationCount: number
  projectsByPhase: readonly PhaseProjectCount[]
  phaseDurations: readonly PhaseDurationRow[]
  bottleneck: PhaseBottleneck | null
  blockedByMonth: readonly BlockedMonth[]
  blockedByProject: readonly BlockedProjectRow[]
  workload: readonly WorkloadRow[]
  events: readonly EventTypeCount[]
  eventCount: number
}

export function buildDashboardSummary({
  snapshot,
  today,
  weekStart,
  periodKey,
}: DashboardSummaryInput): DashboardSummary {
  const period = buildDashboardPeriod(today, periodKey)
  const activities = listProjectActivity(buildProjectRows(snapshot), snapshot, period)
  const weeks = listWeeksIn(period, weekStart)
  const workload = buildWorkloadDistribution(snapshot.people, snapshot.allocations, weeks)
  const allocationByProject = buildAllocationByProject(activities, period)
  const phaseDurations = buildPhaseDurations(activities, snapshot.phases)
  const events = buildEventTypeCounts(activities, period)

  return {
    periodKey,
    period,
    projectCount: activities.length,
    kpis: buildDashboardKpis(activities, workload, snapshot.people, period),
    allocationByProject,
    allocationCount: sumAllocations(allocationByProject),
    projectsByPhase: countProjectsByPhase(activities, snapshot.phases),
    phaseDurations,
    bottleneck: findPhaseBottleneck(phaseDurations),
    blockedByMonth: sumBlockedDaysByMonth(activities, period),
    blockedByProject: listBlockedDaysByProject(activities),
    workload,
    events,
    eventCount: sumEvents(events),
  }
}
