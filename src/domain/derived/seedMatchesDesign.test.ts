import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import {
  readAllocations,
  readBaselineTasks,
  readEvents,
  readPerson,
  readTasks,
} from '@/domain/testing/seedReaders'
import { calculateBlockedDays } from './calculateBlockedDays'
import { calculateDeviationInDays, isDelayed } from './calculateDeviationInDays'
import { calculateProgress } from './calculateProgress'
import { calculateTotalEffort } from './calculateTotalEffort'
import { calculateWeeklyCapacity, isOverallocated } from './calculateWeeklyCapacity'
import { deriveBaselinePeriod, deriveProjectPeriod } from './deriveProjectPeriod'
import { listActivePersonIds } from './listActivePersonIds'

const WHOLE_HISTORY = { start: '2026-01-01', end: DESIGN_TODAY }

let database: DatabaseSync

beforeAll(() => {
  database = openSeedDatabase()
})

describe('Migração do gateway', () => {
  it('Should total the 320h that the design shows', () => {
    expect(calculateTotalEffort(readTasks(database, 'gateway'))).toBe(320)
  })

  it('Should total 240h in the first baseline, matching the scope change event', () => {
    const firstBaselineHours = readBaselineTasks(database, 'bl-gw-1').reduce(
      (total, baselineTask) => total + (baselineTask.estimatedHours ?? 0),
      0,
    )

    expect(firstBaselineHours).toBe(240)
  })

  it('Should be eleven days late against the current baseline', () => {
    const current = deriveProjectPeriod(readTasks(database, 'gateway'))
    const baseline = deriveBaselinePeriod(readBaselineTasks(database, 'bl-gw-2'))
    const deviation = calculateDeviationInDays(current?.end ?? null, baseline?.end ?? null)

    expect(deviation).toBe(11)
    expect(isDelayed(deviation)).toBe(true)
  })

  it('Should count the eight days between the block and its unblock', () => {
    expect(calculateBlockedDays(readEvents(database, 'gateway'), WHOLE_HISTORY)).toBe(8)
  })

  it('Should list the two people with an open allocation', () => {
    expect(listActivePersonIds(readAllocations(database, 'gateway')).toSorted()).toEqual([
      'ana',
      'rafael',
    ])
  })

  it('Should report progress weighted by the completed hours', () => {
    const progress = calculateProgress(readTasks(database, 'gateway'))

    expect(progress.totalHours).toBe(320)
    expect(progress.completedHours).toBe(40)
  })
})

describe('Portal do parceiro', () => {
  it('Should total the 168h that the design shows', () => {
    expect(calculateTotalEffort(readTasks(database, 'parceiro'))).toBe(168)
  })

  it('Should be twenty three days late', () => {
    const current = deriveProjectPeriod(readTasks(database, 'parceiro'))
    const baseline = deriveBaselinePeriod(readBaselineTasks(database, 'bl-pp-1'))

    expect(calculateDeviationInDays(current?.end ?? null, baseline?.end ?? null)).toBe(23)
  })

  it('Should have been blocked for twenty three days with no unblock yet', () => {
    expect(calculateBlockedDays(readEvents(database, 'parceiro'), WHOLE_HISTORY)).toBe(23)
  })

  it('Should have no open allocation, keeping the closed ones in history', () => {
    const allocations = readAllocations(database, 'parceiro')

    expect(listActivePersonIds(allocations)).toEqual([])
    expect(allocations).toHaveLength(2)
    expect(allocations.every((allocation) => allocation.endedReason === 'projeto bloqueado')).toBe(
      true,
    )
  })
})

describe('App de campo v2', () => {
  it('Should be two days ahead of its baseline', () => {
    const current = deriveProjectPeriod(readTasks(database, 'campo'))
    const baseline = deriveBaselinePeriod(readBaselineTasks(database, 'bl-ac-1'))
    const deviation = calculateDeviationInDays(current?.end ?? null, baseline?.end ?? null)

    expect(deviation).toBe(-2)
    expect(isDelayed(deviation)).toBe(false)
  })
})

describe('Conflito de alocação do Rafael', () => {
  it('Should put Rafael at 150 percent on the week the design flags', () => {
    const capacity = calculateWeeklyCapacity(
      readPerson(database, 'rafael'),
      readAllocations(database),
      { start: '2026-06-01', end: '2026-06-07' },
    )

    expect(capacity.percentage).toBe(150)
    expect(capacity.hours).toBe(60)
    expect(isOverallocated(capacity)).toBe(true)
  })

  it('Should be back inside capacity after the reallocation', () => {
    const capacity = calculateWeeklyCapacity(
      readPerson(database, 'rafael'),
      readAllocations(database),
      { start: '2026-08-31', end: '2026-09-06' },
    )

    expect(isOverallocated(capacity)).toBe(false)
  })
})

describe('Janela de cutover', () => {
  it('Should start today with nobody allocated', () => {
    const cutover = readTasks(database, 'observabilidade').find((task) => task.id === 'ob-cut')
    const allocations = readAllocations(database).filter(
      (allocation) => allocation.taskId === 'ob-cut',
    )

    expect(cutover?.plannedStart).toBe(DESIGN_TODAY)
    expect(allocations).toEqual([])
  })
})
