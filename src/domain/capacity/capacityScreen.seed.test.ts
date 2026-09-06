import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { buildAllocationIndex, type AllocationIndex } from './allocationDetails'
import { findInactiveWithFutureWork, findOverloadAlerts } from './capacityAlerts'
import { buildCapacityMatrix, type CapacityMatrix } from './capacityMatrix'
import { findMostAvailablePerson } from './capacitySlack'
import { buildCapacityWindow, type CapacityWindow } from './capacityWindow'

let snapshot: ProjectsSnapshot
let window: CapacityWindow
let matrix: CapacityMatrix
let index: AllocationIndex

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  snapshot = readProjectsSnapshot(database)
  window = buildCapacityWindow(DESIGN_TODAY, 'monday')
  index = buildAllocationIndex({
    tasks: snapshot.tasks,
    projects: snapshot.projects,
    phases: snapshot.phases,
    weekStart: 'monday',
  })
  matrix = buildCapacityMatrix({
    people: snapshot.people,
    allocations: snapshot.allocations,
    tasks: snapshot.tasks,
    window,
    projectId: null,
  })
})

describe('Janela da Capacidade sobre o seed', () => {
  it('Should open on S36 and close on S47, as the design header prints', () => {
    expect(window.weeks[0]?.number).toBe(36)
    expect(window.weeks[window.weeks.length - 1]?.number).toBe(47)
    expect(window.period).toEqual({ start: '2026-08-31', end: '2026-11-22' })
  })
})

describe('Matriz sobre o seed', () => {
  it('Should order the active people by name and leave the inactive one last', () => {
    expect(matrix.rows.map((row) => row.person.name)).toEqual([
      'Ana Nogueira',
      'Marcos Teles',
      'Rafael Brito',
      'Júlia Farah',
    ])
  })

  it('Should hold Ana at half capacity for four weeks and free after that', () => {
    const ana = matrix.rows.find((row) => row.person.id === 'ana')

    expect(ana?.cells.map((cell) => cell.percentage)).toEqual([
      50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0,
    ])
  })

  it('Should hold Rafael at half capacity for the same four weeks', () => {
    const rafael = matrix.rows.find((row) => row.person.id === 'rafael')

    expect(rafael?.cells.map((cell) => cell.percentage)).toEqual([
      50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0,
    ])
  })

  // O piloto em campo acaba em 31/08 e o roteiro começa em 03/09: as duas alocações tocam a
  // mesma semana, e é isso que põe Marcos em 60% só em S36.
  it('Should put Marcos at 60% in S36, where two allocations of his meet', () => {
    const marcos = matrix.rows.find((row) => row.person.id === 'marcos')

    expect(marcos?.cells.map((cell) => cell.percentage)).toEqual([
      60, 30, 30, 30, 30, 0, 0, 0, 0, 0, 0, 0,
    ])
  })

  it('Should leave Júlia with no live allocation and mark her every cell inactive', () => {
    const julia = matrix.rows.find((row) => row.person.id === 'julia')

    expect(julia?.cells.every((cell) => cell.level === 'inactive')).toBe(true)
    expect(julia?.cells.every((cell) => cell.percentage === 0)).toBe(true)
  })

  it('Should total the weekly capacity of the three active people', () => {
    expect(matrix.teamWeeklyCapacityHours).toBe(110)
    expect(matrix.teamCapacityHours).toBe(1320)
  })

  it('Should report the free hours of the team, against the empty card of the mockup', () => {
    expect(matrix.teamUsedHours).toBe(214)
    expect(matrix.freeHours).toBe(1106)
    expect(Math.round(matrix.freePercentage)).toBe(84)
  })

  it('Should average the team at 16% of use over the window', () => {
    expect(Math.round(matrix.teamAveragePercentage)).toBe(16)
  })

  it('Should leave the capacity free from S41 on, exactly as the mockup alert says', () => {
    expect(window.weeks[matrix.firstFreeWeekIndex ?? 0]?.number).toBe(41)
  })

  // O mockup desenha Rafael a 150% em S37–S40, mas as sobrecargas do seed são de março e
  // junho: a janela olha para frente e não as alcança.
  it('Should find no overloaded week ahead, where the mockup counts four', () => {
    expect(matrix.overloadedWeekCount).toBe(0)
    expect(matrix.overloadedPeopleCount).toBe(0)
    expect(matrix.rows.every((row) => !row.isOverloaded)).toBe(true)
  })
})

describe('Painéis sobre o seed', () => {
  it('Should raise no overload alert, where the mockup shows a red one for Rafael', () => {
    expect(
      findOverloadAlerts({ matrix, allocations: snapshot.allocations, index, window }),
    ).toEqual([])
  })

  // A alocação da Júlia foi encerrada em 11/08 pelo bloqueio do Portal, e alocação encerrada
  // não é trabalho futuro.
  it('Should raise no inactive alert, where the mockup shows one for Júlia', () => {
    expect(
      findInactiveWithFutureWork({
        people: snapshot.people,
        allocations: snapshot.allocations,
        index,
        window,
      }),
    ).toEqual([])
  })

  it('Should name Ana as the most available, tied with Rafael and broken by name', () => {
    const mostAvailable = findMostAvailablePerson(matrix)

    expect(mostAvailable?.person.name).toBe('Ana Nogueira')
    expect(mostAvailable?.freeHours).toBe(400)
    expect(window.weeks[mostAvailable?.firstFreeWeekIndex ?? 0]?.number).toBe(40)
  })
})

describe('Filtro por projeto sobre o seed', () => {
  it('Should keep only what the gateway consumes', () => {
    const filtered = buildCapacityMatrix({
      people: snapshot.people,
      allocations: snapshot.allocations,
      tasks: snapshot.tasks,
      window,
      projectId: 'gateway',
    })

    expect(filtered.rows.find((row) => row.person.id === 'marcos')?.usedHours).toBe(0)
    expect(filtered.teamUsedHours).toBe(160)
  })
})
