import { addDays, differenceInDays, latestDate } from '@/domain/dates/isoDateMath'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { Task } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import {
  effectiveEndOf,
  isLiveDuring,
  toAllocationDetail,
  type AllocationDetail,
  type AllocationIndex,
} from './allocationDetails'

const DAYS_PER_WEEK = 7
const FULL_ALLOCATION_PERCENTAGE = 100

export const REMOVAL_WEEK_OPTIONS = [1, 2, 3, 4, 6, 8, 12] as const

export type WeeklyHoursInput = {
  percentage: number
  weeklyCapacityHours: number
}

export function toWeeklyHours({ percentage, weeklyCapacityHours }: WeeklyHoursInput): number {
  return (percentage / FULL_ALLOCATION_PERCENTAGE) * weeklyCapacityHours
}

export type DelayInput = {
  removedWeeklyHours: number
  remainingWeeklyHours: number
  weeksRemoved: number
}

// As horas que a pessoa deixa de entregar não somem: quem fica na tarefa precisa de tempo a
// mais para cobri-las. Sem ninguém para cobrir, o trabalho simplesmente espera a volta dela,
// e o atraso é o próprio afastamento.
export function calculateDelayInDays({
  removedWeeklyHours,
  remainingWeeklyHours,
  weeksRemoved,
}: DelayInput): number {
  const lostHours = removedWeeklyHours * weeksRemoved

  if (lostHours === 0) {
    return 0
  }

  if (remainingWeeklyHours === 0) {
    return weeksRemoved * DAYS_PER_WEEK
  }

  return Math.ceil((lostHours / remainingWeeklyHours) * DAYS_PER_WEEK)
}

export type ImpactRow = {
  id: string
  label: string
  phaseColor: string | null
  before: IsoDate | null
  after: IsoDate | null
  deltaDays: number
}

export type ReallocationSimulation = {
  person: Person
  removed: AllocationDetail
  weeksRemoved: number
  removalPeriod: DatePeriod
  delayInDays: number
  taskPeriodAfter: DatePeriod | null
  rows: readonly ImpactRow[]
  peakPercentageBefore: number
  peakPercentageAfter: number
  resolvesOverload: boolean
}

export type SimulationInput = {
  person: Person
  allocationId: EntityId
  weeksRemoved: number
  allocations: readonly Allocation[]
  tasks: readonly Task[]
  people: readonly Person[]
  index: AllocationIndex
  today: IsoDate
  weeks: readonly DatePeriod[]
}

function sumWeeklyHours(
  allocations: readonly Allocation[],
  people: readonly Person[],
): number {
  const capacityByPerson = new Map(people.map((person) => [person.id, person.weeklyCapacityHours]))

  return allocations.reduce(
    (total, allocation) =>
      total +
      toWeeklyHours({
        percentage: allocation.percentage,
        weeklyCapacityHours: capacityByPerson.get(allocation.personId) ?? 0,
      }),
    0,
  )
}

function loadDuring(
  personId: EntityId,
  period: DatePeriod,
  allocations: readonly Allocation[],
): number {
  return allocations
    .filter((allocation) => allocation.personId === personId)
    .filter((allocation) => isLiveDuring(allocation, period))
    .reduce((total, allocation) => total + allocation.percentage, 0)
}

function peakOver(
  personId: EntityId,
  weeks: readonly DatePeriod[],
  allocations: readonly Allocation[],
): number {
  return weeks.reduce(
    (peak, week) => Math.max(peak, loadDuring(personId, week, allocations)),
    0,
  )
}

function toTaskEndRow(
  detail: AllocationDetail,
  deltaDays: number,
): ImpactRow {
  const before = detail.task.plannedEnd

  return {
    id: `task-${detail.task.id}`,
    label: `${detail.project.name} — ${detail.task.title}`,
    phaseColor: detail.phaseColor,
    before,
    after: before === null || deltaDays === 0 ? before : addDays(before, deltaDays),
    deltaDays,
  }
}

function toProjectEndRow(
  detail: AllocationDetail,
  tasks: readonly Task[],
  deltaDays: number,
): ImpactRow {
  const ends = tasks
    .filter((task) => task.projectId === detail.project.id && task.status !== 'cancelled')
    .map((task) => task.plannedEnd)
    .filter((end) => end !== null)

  const before = ends.length === 0 ? null : ends.toSorted()[ends.length - 1] ?? null
  const shifted =
    detail.task.plannedEnd === null || deltaDays === 0
      ? detail.task.plannedEnd
      : addDays(detail.task.plannedEnd, deltaDays)
  const after = before === null || shifted === null ? before : latestDate(shifted, before)

  return {
    id: `project-${detail.project.id}`,
    label: `${detail.project.name} — fim previsto`,
    phaseColor: detail.phaseColor,
    before,
    after,
    deltaDays: before === null || after === null ? 0 : differenceInDays(before, after),
  }
}

// A tabela existe para mostrar o que o afastamento move e o que ele não move, então só o
// trabalho que ainda corre entra: alocação já cumprida não tem plano a deslocar.
function buildOtherWorkRows(detail: AllocationDetail, input: SimulationInput): ImpactRow[] {
  return listRemovableAllocations(
    input.person.id,
    input.allocations,
    input.index,
    input.today,
  )
    .filter((other) => other.allocation.id !== detail.allocation.id)
    .map((other) => toTaskEndRow(other, 0))
}

export function simulateReallocation(input: SimulationInput): ReallocationSimulation | null {
  const allocation = input.allocations.find((candidate) => candidate.id === input.allocationId)
  const detail = allocation === undefined ? null : toAllocationDetail(allocation, input.index)

  if (allocation === undefined || detail === null) {
    return null
  }

  const start = input.today > allocation.startDate ? input.today : allocation.startDate
  const removalPeriod = {
    start,
    end: addDays(start, input.weeksRemoved * DAYS_PER_WEEK - 1),
  }

  const remaining = input.allocations.filter(
    (candidate) =>
      candidate.taskId === allocation.taskId &&
      candidate.id !== allocation.id &&
      candidate.endedAt === null,
  )

  const delayInDays = calculateDelayInDays({
    removedWeeklyHours: toWeeklyHours({
      percentage: allocation.percentage,
      weeklyCapacityHours: input.person.weeklyCapacityHours,
    }),
    remainingWeeklyHours: sumWeeklyHours(remaining, input.people),
    weeksRemoved: input.weeksRemoved,
  })

  const withoutRemoved = input.allocations.filter((candidate) => candidate.id !== allocation.id)
  const overlappedWeeks = input.weeks.filter(
    (week) => week.start <= removalPeriod.end && removalPeriod.start <= week.end,
  )
  const peakPercentageBefore = peakOver(input.person.id, overlappedWeeks, input.allocations)
  const peakPercentageAfter = peakOver(input.person.id, overlappedWeeks, withoutRemoved)

  return {
    person: input.person,
    removed: detail,
    weeksRemoved: input.weeksRemoved,
    removalPeriod,
    delayInDays,
    taskPeriodAfter:
      detail.task.plannedStart === null || detail.task.plannedEnd === null
        ? null
        : {
            start: detail.task.plannedStart,
            end: addDays(detail.task.plannedEnd, delayInDays),
          },
    rows: [
      toTaskEndRow(detail, delayInDays),
      ...buildOtherWorkRows(detail, input),
      toProjectEndRow(detail, input.tasks, delayInDays),
    ],
    peakPercentageBefore,
    peakPercentageAfter,
    resolvesOverload:
      peakPercentageBefore > FULL_ALLOCATION_PERCENTAGE &&
      peakPercentageAfter <= FULL_ALLOCATION_PERCENTAGE,
  }
}

export function listRemovableAllocations(
  personId: EntityId,
  allocations: readonly Allocation[],
  index: AllocationIndex,
  today: IsoDate,
): AllocationDetail[] {
  return allocations
    .filter((allocation) => allocation.personId === personId)
    .filter((allocation) => allocation.endedAt === null && effectiveEndOf(allocation) >= today)
    .map((allocation) => toAllocationDetail(allocation, index))
    .filter((detail) => detail !== null)
    .toSorted((first, second) => second.allocation.percentage - first.allocation.percentage)
}
