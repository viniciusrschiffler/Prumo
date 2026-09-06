import { earliestDate, isoWeekNumber, toIsoDateOf, weekPeriod } from '@/domain/dates/isoDateMath'
import { calculateBlockedDays } from '@/domain/derived/calculateBlockedDays'
import { calculateWeeklyCapacity } from '@/domain/derived/calculateWeeklyCapacity'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Project } from '@/domain/schemas/projectSchema'
import type { Todo } from '@/domain/schemas/todoSchema'
import type { WeekStart } from '@/domain/settings/appSettings'
import type { DatePeriod } from '@/domain/types/DatePeriod'

const FULL_PERCENTAGE = 100

export type WeekNumbers = {
  period: DatePeriod
  weekNumber: number
  usedHours: number
  capacityHours: number
  capacityUsedPercentage: number
  blockedDays: number
  eventCount: number
  completedTodoCount: number
}

export type WeekNumbersInput = {
  projects: readonly Project[]
  events: readonly ProjectEvent[]
  allocations: readonly Allocation[]
  people: readonly Person[]
  todos: readonly Todo[]
  today: IsoDate
  weekStart: WeekStart
}

function isWithin(date: IsoDate, period: DatePeriod): boolean {
  return period.start <= date && date <= period.end
}

// A capacidade do time é só a das pessoas ativas. Emprestar a da inativa diluiria o uso com
// horas que ninguém pode gastar — a mesma regra da tela de Capacidade.
function sumCapacity(input: WeekNumbersInput, period: DatePeriod) {
  return input.people
    .filter((person) => person.active)
    .reduce(
      (totals, person) => ({
        used: totals.used + calculateWeeklyCapacity(person, input.allocations, period).hours,
        available: totals.available + person.weeklyCapacityHours,
      }),
      { used: 0, available: 0 },
    )
}

// Bloqueio aberto para em hoje, não no domingo: contar até o fim da semana pintaria de
// vermelho dias que ainda não foram perdidos. É a mesma leitura da hachura da Timeline.
function sumBlockedDays(input: WeekNumbersInput, period: DatePeriod): number {
  const elapsed = { start: period.start, end: earliestDate(period.end, input.today) }

  return input.projects
    .filter((project) => project.archivedAt === null)
    .reduce(
      (total, project) =>
        total +
        calculateBlockedDays(
          input.events.filter((event) => event.projectId === project.id),
          elapsed,
        ),
      0,
    )
}

function countCompletedTodos(input: WeekNumbersInput, period: DatePeriod): number {
  return input.todos.filter(
    (todo) =>
      todo.status === 'done' &&
      todo.completedAt !== null &&
      isWithin(toIsoDateOf(todo.completedAt), period),
  ).length
}

export function summarizeWeek(input: WeekNumbersInput): WeekNumbers {
  const period = weekPeriod(input.today, input.weekStart)
  const capacity = sumCapacity(input, period)

  return {
    period,
    weekNumber: isoWeekNumber(period.start),
    usedHours: capacity.used,
    capacityHours: capacity.available,
    capacityUsedPercentage:
      capacity.available === 0
        ? 0
        : Math.round((capacity.used / capacity.available) * FULL_PERCENTAGE),
    blockedDays: sumBlockedDays(input, period),
    eventCount: input.events.filter((event) => isWithin(event.eventDate, period)).length,
    completedTodoCount: countCompletedTodos(input, period),
  }
}
