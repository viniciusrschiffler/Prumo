import { calculateWeeklyCapacity } from '@/domain/derived/calculateWeeklyCapacity'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { Task } from '@/domain/schemas/taskSchema'
import { isOverCapacity, toHeatLevel, type CapacityHeatLevel } from './capacityHeat'
import type { CapacityWindow } from './capacityWindow'

const FULL_ALLOCATION_PERCENTAGE = 100

export type CapacityCell = {
  weekIndex: number
  percentage: number
  hours: number
  level: CapacityHeatLevel
}

export type CapacityRow = {
  person: Person
  cells: readonly CapacityCell[]
  averagePercentage: number
  averageHours: number
  usedHours: number
  freeHours: number
  isOverloaded: boolean
  firstFreeWeekIndex: number | null
}

export type CapacityWeekTotal = {
  weekIndex: number
  hours: number
  percentage: number
  isOver: boolean
}

export type CapacityMatrix = {
  rows: readonly CapacityRow[]
  totals: readonly CapacityWeekTotal[]
  teamWeeklyCapacityHours: number
  teamCapacityHours: number
  teamUsedHours: number
  teamAveragePercentage: number
  teamAverageHours: number
  freeHours: number
  freePercentage: number
  overloadedWeekCount: number
  overloadedPeopleCount: number
  firstFreeWeekIndex: number | null
}

export type CapacityMatrixInput = {
  people: readonly Person[]
  allocations: readonly Allocation[]
  tasks: readonly Task[]
  window: CapacityWindow
  projectId: EntityId | null
}

function compareByStatusThenName(first: Person, second: Person): number {
  if (first.active !== second.active) {
    return first.active ? -1 : 1
  }

  return first.name.localeCompare(second.name, 'pt-BR')
}

function filterByProject(
  allocations: readonly Allocation[],
  tasks: readonly Task[],
  projectId: EntityId | null,
): readonly Allocation[] {
  if (projectId === null) {
    return allocations
  }

  const taskIdsOfProject = new Set(
    tasks.filter((task) => task.projectId === projectId).map((task) => task.id),
  )

  return allocations.filter((allocation) => taskIdsOfProject.has(allocation.taskId))
}

type WeeklyLoad = { weekIndex: number; percentage: number }

function findFirstFreeWeekIndex(loads: readonly WeeklyLoad[]): number | null {
  const lastBusy = loads.reduce(
    (found, load) => (load.percentage > 0 ? load.weekIndex : found),
    -1,
  )

  return lastBusy + 1 >= loads.length ? null : lastBusy + 1
}

function buildRow(
  person: Person,
  allocations: readonly Allocation[],
  window: CapacityWindow,
): CapacityRow {
  const cells = window.weeks.map((week) => {
    const capacity = calculateWeeklyCapacity(person, allocations, week.period)

    return {
      weekIndex: week.index,
      percentage: capacity.percentage,
      hours: capacity.hours,
      level: toHeatLevel(capacity.percentage, person.active),
    }
  })

  const usedHours = cells.reduce((total, cell) => total + cell.hours, 0)
  const averagePercentage =
    cells.reduce((total, cell) => total + cell.percentage, 0) / cells.length
  const availableHours = person.active ? person.weeklyCapacityHours * cells.length : 0

  return {
    person,
    cells,
    averagePercentage,
    averageHours: usedHours / cells.length,
    usedHours,
    freeHours: Math.max(0, availableHours - usedHours),
    isOverloaded: cells.some((cell) => isOverCapacity(cell.percentage)),
    firstFreeWeekIndex: findFirstFreeWeekIndex(cells),
  }
}

function buildTotals(
  rows: readonly CapacityRow[],
  teamWeeklyCapacityHours: number,
  window: CapacityWindow,
): CapacityWeekTotal[] {
  return window.weeks.map((week) => {
    const hours = rows.reduce(
      (total, row) => total + (row.cells[week.index]?.hours ?? 0),
      0,
    )
    const percentage =
      teamWeeklyCapacityHours === 0 ? 0 : (hours / teamWeeklyCapacityHours) * FULL_ALLOCATION_PERCENTAGE

    return {
      weekIndex: week.index,
      hours,
      percentage,
      isOver: isOverCapacity(percentage),
    }
  })
}

export function buildCapacityMatrix(input: CapacityMatrixInput): CapacityMatrix {
  const visibleAllocations = filterByProject(input.allocations, input.tasks, input.projectId)
  const rows = input.people
    .toSorted(compareByStatusThenName)
    .map((person) => buildRow(person, visibleAllocations, input.window))

  // A pessoa inativa fica na matriz porque o histórico dela não some, mas não empresta
  // capacidade ao time: contá-la diluiria o uso médio com horas que ninguém pode gastar.
  const teamWeeklyCapacityHours = input.people
    .filter((person) => person.active)
    .reduce((total, person) => total + person.weeklyCapacityHours, 0)
  const teamCapacityHours = teamWeeklyCapacityHours * input.window.weeks.length
  const teamUsedHours = rows.reduce((total, row) => total + row.usedHours, 0)
  const totals = buildTotals(rows, teamWeeklyCapacityHours, input.window)
  const overloadedCells = rows.flatMap((row) =>
    row.cells.filter((cell) => isOverCapacity(cell.percentage)).map((cell) => ({ row, cell })),
  )

  return {
    rows,
    totals,
    teamWeeklyCapacityHours,
    teamCapacityHours,
    teamUsedHours,
    teamAveragePercentage:
      teamCapacityHours === 0 ? 0 : (teamUsedHours / teamCapacityHours) * FULL_ALLOCATION_PERCENTAGE,
    teamAverageHours: teamUsedHours / input.window.weeks.length,
    freeHours: Math.max(0, teamCapacityHours - teamUsedHours),
    freePercentage:
      teamCapacityHours === 0
        ? 0
        : (Math.max(0, teamCapacityHours - teamUsedHours) / teamCapacityHours) *
          FULL_ALLOCATION_PERCENTAGE,
    overloadedWeekCount: new Set(overloadedCells.map((entry) => entry.cell.weekIndex)).size,
    overloadedPeopleCount: new Set(overloadedCells.map((entry) => entry.row.person.id)).size,
    firstFreeWeekIndex: findFirstFreeWeekIndex(totals),
  }
}
