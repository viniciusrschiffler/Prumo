import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import {
  isLiveDuring,
  listAllocationsDuring,
  type AllocationDetail,
  type AllocationIndex,
} from './allocationDetails'
import type { CapacityMatrix, CapacityRow } from './capacityMatrix'
import type { CapacityWindow } from './capacityWindow'

export type OverloadAlert = {
  person: Person
  weekIndexes: readonly number[]
  firstWeekNumber: number
  lastWeekNumber: number
  peakPercentage: number
  allocations: readonly AllocationDetail[]
}

export type OverloadAlertsInput = {
  matrix: CapacityMatrix
  allocations: readonly Allocation[]
  index: AllocationIndex
  window: CapacityWindow
}

function collectOverloadedWeekIndexes(row: CapacityRow): number[] {
  return row.cells.filter((cell) => cell.level === 'over').map((cell) => cell.weekIndex)
}

export function findOverloadAlerts(input: OverloadAlertsInput): OverloadAlert[] {
  return input.matrix.rows
    .filter((row) => row.isOverloaded)
    .map((row) => {
      const weekIndexes = collectOverloadedWeekIndexes(row)
      const firstWeek = input.window.weeks[weekIndexes[0] ?? 0]
      const lastWeek = input.window.weeks[weekIndexes[weekIndexes.length - 1] ?? 0]
      const period = {
        start: firstWeek?.period.start ?? input.window.period.start,
        end: lastWeek?.period.end ?? input.window.period.end,
      }

      return {
        person: row.person,
        weekIndexes,
        firstWeekNumber: firstWeek?.number ?? 0,
        lastWeekNumber: lastWeek?.number ?? 0,
        peakPercentage: Math.max(...weekIndexes.map((index) => row.cells[index]?.percentage ?? 0)),
        allocations: listAllocationsDuring(
          row.person.id,
          period,
          input.allocations,
          input.index,
        ),
      }
    })
}

export type InactiveWithFutureWorkAlert = {
  person: Person
  allocations: readonly AllocationDetail[]
  firstWeekNumber: number
}

export type InactiveWithFutureWorkInput = {
  people: readonly Person[]
  allocations: readonly Allocation[]
  index: AllocationIndex
  window: CapacityWindow
}

// Alocação encerrada não é trabalho futuro: ela ficou no histórico de propósito e apontá-la
// como pendência transformaria todo desligamento passado num alerta permanente.
export function findInactiveWithFutureWork(
  input: InactiveWithFutureWorkInput,
): InactiveWithFutureWorkAlert[] {
  return input.people
    .filter((person) => !person.active)
    .map((person) => {
      const allocations = listAllocationsDuring(
        person.id,
        input.window.period,
        input.allocations,
        input.index,
      ).filter((detail) => detail.allocation.endedAt === null)

      const firstWeek = input.window.weeks.find((week) =>
        allocations.some((detail) => isLiveDuring(detail.allocation, week.period)),
      )

      return { person, allocations, firstWeekNumber: firstWeek?.number ?? 0 }
    })
    .filter((alert) => alert.allocations.length > 0)
}
