import { describe, expect, it } from 'vitest'
import { buildAllocation, buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import { buildCapacityMatrix } from './capacityMatrix'
import { buildCapacityWindow } from './capacityWindow'

const WINDOW = buildCapacityWindow('2026-09-03', 'monday')

const ANA = buildPerson({ id: 'ana', name: 'Ana Nogueira', weeklyCapacityHours: 40 })
const RAFAEL = buildPerson({
  id: 'rafael',
  name: 'Rafael Brito',
  initials: 'RB',
  weeklyCapacityHours: 40,
})
const JULIA = buildPerson({
  id: 'julia',
  name: 'Júlia Farah',
  initials: 'JF',
  weeklyCapacityHours: 40,
  active: false,
})

const GATEWAY_TASK = buildTask({ id: 'gw-tes', projectId: 'gateway' })
const PORTAL_TASK = buildTask({ id: 'pp-jur', projectId: 'parceiro' })

function matrixOf(
  people: Parameters<typeof buildCapacityMatrix>[0]['people'],
  allocations: Parameters<typeof buildCapacityMatrix>[0]['allocations'],
  projectId: string | null = null,
) {
  return buildCapacityMatrix({
    people,
    allocations,
    tasks: [GATEWAY_TASK, PORTAL_TASK],
    window: WINDOW,
    projectId,
  })
}

describe('buildCapacityMatrix', () => {
  it('Should give every person one cell per week of the window', () => {
    const matrix = matrixOf([ANA], [])

    expect(matrix.rows).toHaveLength(1)
    expect(matrix.rows[0]?.cells).toHaveLength(WINDOW.weeks.length)
    expect(matrix.rows[0]?.cells.every((cell) => cell.percentage === 0)).toBe(true)
  })

  it('Should sum the percentage of every allocation that touches the week', () => {
    const matrix = matrixOf(
      [ANA],
      [
        buildAllocation({
          id: 'a1',
          personId: 'ana',
          taskId: 'gw-tes',
          startDate: '2026-08-31',
          endDate: '2026-09-13',
          percentage: 50,
        }),
        buildAllocation({
          id: 'a2',
          personId: 'ana',
          taskId: 'pp-jur',
          startDate: '2026-09-07',
          endDate: '2026-09-13',
          percentage: 30,
        }),
      ],
    )

    expect(matrix.rows[0]?.cells.slice(0, 3).map((cell) => cell.percentage)).toEqual([50, 80, 0])
    expect(matrix.rows[0]?.cells[1]?.hours).toBe(32)
  })

  it('Should mark the person overloaded and the week over capacity above 100%', () => {
    const matrix = matrixOf(
      [ANA],
      [
        buildAllocation({
          id: 'a1',
          personId: 'ana',
          taskId: 'gw-tes',
          startDate: '2026-08-31',
          endDate: '2026-09-06',
          percentage: 100,
        }),
        buildAllocation({
          id: 'a2',
          personId: 'ana',
          taskId: 'pp-jur',
          startDate: '2026-08-31',
          endDate: '2026-09-06',
          percentage: 50,
        }),
      ],
    )

    expect(matrix.rows[0]?.isOverloaded).toBe(true)
    expect(matrix.rows[0]?.cells[0]?.level).toBe('over')
    expect(matrix.overloadedWeekCount).toBe(1)
    expect(matrix.overloadedPeopleCount).toBe(1)
  })

  it('Should leave the inactive person out of the team capacity but keep her row', () => {
    const matrix = matrixOf([ANA, JULIA], [])

    expect(matrix.rows.map((row) => row.person.id)).toEqual(['ana', 'julia'])
    expect(matrix.teamWeeklyCapacityHours).toBe(40)
    expect(matrix.rows[1]?.cells[0]?.level).toBe('inactive')
    expect(matrix.rows[1]?.freeHours).toBe(0)
  })

  it('Should order active people by name and push the inactive ones to the end', () => {
    const matrix = matrixOf([JULIA, RAFAEL, ANA], [])

    expect(matrix.rows.map((row) => row.person.id)).toEqual(['ana', 'rafael', 'julia'])
  })

  it('Should count only the allocations of the filtered project', () => {
    const allocations = [
      buildAllocation({
        id: 'a1',
        personId: 'ana',
        taskId: 'gw-tes',
        startDate: '2026-08-31',
        endDate: '2026-09-06',
        percentage: 50,
      }),
      buildAllocation({
        id: 'a2',
        personId: 'ana',
        taskId: 'pp-jur',
        startDate: '2026-08-31',
        endDate: '2026-09-06',
        percentage: 30,
      }),
    ]

    expect(matrixOf([ANA], allocations, 'gateway').rows[0]?.cells[0]?.percentage).toBe(50)
    expect(matrixOf([ANA], allocations, 'parceiro').rows[0]?.cells[0]?.percentage).toBe(30)
  })

  it('Should report the free hours of the team against its whole capacity', () => {
    const matrix = matrixOf(
      [ANA],
      [
        buildAllocation({
          id: 'a1',
          personId: 'ana',
          taskId: 'gw-tes',
          startDate: '2026-08-31',
          endDate: '2026-09-06',
          percentage: 50,
        }),
      ],
    )

    expect(matrix.teamCapacityHours).toBe(480)
    expect(matrix.teamUsedHours).toBe(20)
    expect(matrix.freeHours).toBe(460)
    expect(matrix.totals[0]?.percentage).toBe(50)
    expect(matrix.totals[1]?.percentage).toBe(0)
  })

  it('Should point at the first week where nobody is booked any more', () => {
    const matrix = matrixOf(
      [ANA],
      [
        buildAllocation({
          id: 'a1',
          personId: 'ana',
          taskId: 'gw-tes',
          startDate: '2026-08-31',
          endDate: '2026-09-13',
          percentage: 50,
        }),
      ],
    )

    expect(matrix.rows[0]?.firstFreeWeekIndex).toBe(2)
    expect(matrix.firstFreeWeekIndex).toBe(2)
  })

  it('Should report no free week when the last one is still booked', () => {
    const matrix = matrixOf(
      [ANA],
      [
        buildAllocation({
          id: 'a1',
          personId: 'ana',
          taskId: 'gw-tes',
          startDate: '2026-08-31',
          endDate: '2026-11-22',
          percentage: 50,
        }),
      ],
    )

    expect(matrix.firstFreeWeekIndex).toBeNull()
  })
})
