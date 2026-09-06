import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import {
  listAllocationsDuring,
  type AllocationDetail,
  type AllocationIndex,
} from './allocationDetails'
import type { CapacityMatrix, CapacityRow } from './capacityMatrix'

const FULL_ALLOCATION_PERCENTAGE = 100

export type MostAvailablePerson = {
  person: Person
  freeHours: number
  firstFreeWeekIndex: number | null
}

// O empate é real quando duas pessoas têm a mesma folga, e a tela precisa de uma resposta só.
// Desempatar por nome deixa a escolha estável entre dois carregamentos da mesma janela.
export function findMostAvailablePerson(matrix: CapacityMatrix): MostAvailablePerson | null {
  const candidates = matrix.rows
    .filter((row) => row.person.active)
    .toSorted(compareByFreeHoursThenName)

  const best = candidates[0]

  if (best === undefined || best.freeHours === 0) {
    return null
  }

  return {
    person: best.person,
    freeHours: best.freeHours,
    firstFreeWeekIndex: best.firstFreeWeekIndex,
  }
}

function compareByFreeHoursThenName(first: CapacityRow, second: CapacityRow): number {
  if (first.freeHours !== second.freeHours) {
    return second.freeHours - first.freeHours
  }

  return first.person.name.localeCompare(second.person.name, 'pt-BR')
}

export type ReleaseCandidate = {
  person: Person
  freeHours: number
  usedPercentage: number
  allocations: readonly AllocationDetail[]
}

export type ReleaseCandidatesInput = {
  matrix: CapacityMatrix
  allocations: readonly Allocation[]
  index: AllocationIndex
  period: DatePeriod
  weekIndexes: readonly number[]
  exceptPersonId: EntityId | null
}

function averagePercentageOver(row: CapacityRow, weekIndexes: readonly number[]): number {
  if (weekIndexes.length === 0) {
    return 0
  }

  const total = weekIndexes.reduce(
    (sum, weekIndex) => sum + (row.cells[weekIndex]?.percentage ?? 0),
    0,
  )

  return total / weekIndexes.length
}

// Quem já está cheio no período não é resposta para "quem eu consigo tirar", então só entra
// quem tem hora sobrando nele — e a hora sobrando é medida no período, não na janela inteira.
export function findReleaseCandidates(input: ReleaseCandidatesInput): ReleaseCandidate[] {
  return input.matrix.rows
    .filter((row) => row.person.active && row.person.id !== input.exceptPersonId)
    .map((row) => {
      const usedPercentage = averagePercentageOver(row, input.weekIndexes)
      const freeRatio = Math.max(0, FULL_ALLOCATION_PERCENTAGE - usedPercentage)

      return {
        person: row.person,
        freeHours: (freeRatio / FULL_ALLOCATION_PERCENTAGE) * row.person.weeklyCapacityHours,
        usedPercentage,
        allocations: listAllocationsDuring(
          row.person.id,
          input.period,
          input.allocations,
          input.index,
        ),
      }
    })
    .filter((candidate) => candidate.freeHours > 0)
    .toSorted((first, second) => {
      if (first.freeHours !== second.freeHours) {
        return second.freeHours - first.freeHours
      }

      return first.person.name.localeCompare(second.person.name, 'pt-BR')
    })
}
