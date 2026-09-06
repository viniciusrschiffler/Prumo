import { describe, expect, it } from 'vitest'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import { buildAllocation, buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import { buildAllocationIndex } from './allocationDetails'
import { buildCapacityMatrix } from './capacityMatrix'
import { buildCapacityWindow } from './capacityWindow'
import { findMostAvailablePerson, findReleaseCandidates } from './capacitySlack'
import { buildProject } from '@/domain/testing/projectRowBuilders'

const WINDOW = buildCapacityWindow('2026-09-03', 'monday')

const ANA = buildPerson({ id: 'ana', name: 'Ana Nogueira', weeklyCapacityHours: 40 })
const RAFAEL = buildPerson({
  id: 'rafael',
  name: 'Rafael Brito',
  initials: 'RB',
  weeklyCapacityHours: 40,
})
const MARCOS = buildPerson({
  id: 'marcos',
  name: 'Marcos Teles',
  initials: 'MT',
  weeklyCapacityHours: 30,
})

const TASK = buildTask({ id: 'gw-tes', projectId: 'gateway', phaseId: 'development' })
const PROJECT = buildProject({ id: 'gateway', name: 'Migração do gateway' })

const INDEX = buildAllocationIndex({
  tasks: [TASK],
  projects: [PROJECT],
  phases: [],
  weekStart: 'monday',
})

function matrixOf(people: readonly Person[], allocations: readonly Allocation[]) {
  return buildCapacityMatrix({
    people,
    allocations,
    tasks: [TASK],
    window: WINDOW,
    projectId: null,
  })
}

describe('findMostAvailablePerson', () => {
  it('Should pick the person with the most free hours in the window', () => {
    const matrix = matrixOf(
      [ANA, MARCOS],
      [
        buildAllocation({
          id: 'a1',
          personId: 'marcos',
          taskId: 'gw-tes',
          startDate: '2026-08-31',
          endDate: '2026-11-22',
          percentage: 100,
        }),
      ],
    )

    expect(findMostAvailablePerson(matrix)?.person.id).toBe('ana')
  })

  it('Should break a tie by name so the answer is stable', () => {
    const matrix = matrixOf([RAFAEL, ANA], [])

    expect(findMostAvailablePerson(matrix)?.person.id).toBe('ana')
  })

  it('Should report the first week the person is free from', () => {
    const matrix = matrixOf(
      [ANA],
      [
        buildAllocation({
          id: 'a1',
          personId: 'ana',
          taskId: 'gw-tes',
          startDate: '2026-08-31',
          endDate: '2026-09-27',
          percentage: 50,
        }),
      ],
    )

    expect(findMostAvailablePerson(matrix)?.firstFreeWeekIndex).toBe(4)
  })

  it('Should report nobody when every active person is fully booked', () => {
    const matrix = matrixOf(
      [ANA],
      [
        buildAllocation({
          id: 'a1',
          personId: 'ana',
          taskId: 'gw-tes',
          startDate: '2026-08-31',
          endDate: '2026-11-22',
          percentage: 100,
        }),
      ],
    )

    expect(findMostAvailablePerson(matrix)).toBeNull()
  })
})

describe('findReleaseCandidates', () => {
  const allocations = [
    buildAllocation({
      id: 'a1',
      personId: 'rafael',
      taskId: 'gw-tes',
      startDate: '2026-08-31',
      endDate: '2026-09-13',
      percentage: 100,
    }),
    buildAllocation({
      id: 'a2',
      personId: 'marcos',
      taskId: 'gw-tes',
      startDate: '2026-08-31',
      endDate: '2026-09-13',
      percentage: 40,
    }),
  ]

  const period = { start: '2026-08-31', end: '2026-09-13' }
  const weekIndexes = [0, 1]

  it('Should leave out the person the question is about', () => {
    const candidates = findReleaseCandidates({
      matrix: matrixOf([ANA, RAFAEL, MARCOS], allocations),
      allocations,
      index: INDEX,
      period,
      weekIndexes,
      exceptPersonId: 'ana',
    })

    expect(candidates.map((candidate) => candidate.person.id)).toEqual(['marcos'])
  })

  it('Should leave out whoever has no hour to spare in the period', () => {
    const candidates = findReleaseCandidates({
      matrix: matrixOf([RAFAEL, MARCOS], allocations),
      allocations,
      index: INDEX,
      period,
      weekIndexes,
      exceptPersonId: null,
    })

    expect(candidates.map((candidate) => candidate.person.id)).toEqual(['marcos'])
    expect(candidates[0]?.usedPercentage).toBe(40)
    expect(candidates[0]?.freeHours).toBeCloseTo(18)
  })

  it('Should list what the candidate is doing in the period', () => {
    const candidates = findReleaseCandidates({
      matrix: matrixOf([MARCOS], allocations),
      allocations,
      index: INDEX,
      period,
      weekIndexes,
      exceptPersonId: null,
    })

    expect(candidates[0]?.allocations.map((detail) => detail.task.title)).toEqual(['Tarefa'])
    expect(candidates[0]?.allocations[0]?.project.name).toBe('Migração do gateway')
  })

  it('Should order the candidates by free hours, then by name', () => {
    const candidates = findReleaseCandidates({
      matrix: matrixOf([ANA, RAFAEL, MARCOS], []),
      allocations: [],
      index: INDEX,
      period,
      weekIndexes,
      exceptPersonId: null,
    })

    expect(candidates.map((candidate) => candidate.person.id)).toEqual([
      'ana',
      'rafael',
      'marcos',
    ])
  })
})
