import { describe, expect, it } from 'vitest'
import { buildAllocation } from '@/domain/testing/entityBuilders'
import { buildProjectRow } from '@/domain/testing/projectRowBuilders'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { ProjectActivity } from './dashboardActivity'
import {
  buildAllocationByProject,
  peakPercentageIn,
  sumAllocations,
} from './allocationByProject'

const PERIOD = { start: '2026-06-01', end: '2026-08-31' }

const DEVELOPMENT: Phase = {
  id: 'development',
  name: 'Desenvolvimento',
  sortOrder: 0,
  color: 'oklch(0.545 0.16 292)',
  active: true,
}

function buildActivity(
  project: { id: string; name: string; status?: 'active' | 'blocked'; pausedAt?: string | null },
  allocations: readonly Allocation[],
): ProjectActivity {
  return {
    row: buildProjectRow(
      {
        id: project.id,
        name: project.name,
        status: project.status ?? 'active',
        pausedAt: project.pausedAt ?? null,
      },
      { currentPhase: DEVELOPMENT },
    ),
    tasksInPeriod: [],
    events: [],
    eventsInPeriod: [],
    allocationsInPeriod: allocations,
    blockedDays: 0,
  }
}

describe('peakPercentageIn', () => {
  it('Should take the simultaneous peak, not the sum of everything that crossed the window', () => {
    const first = buildAllocation({ id: 'a', startDate: '2026-06-01', endDate: '2026-06-30' })
    const second = buildAllocation({ id: 'b', startDate: '2026-07-01', endDate: '2026-07-31' })

    expect(peakPercentageIn([first, second], PERIOD)).toBe(50)
  })

  it('Should stack the percentages of allocations that share a day', () => {
    const first = buildAllocation({ id: 'a', startDate: '2026-06-01', endDate: '2026-06-30' })
    const second = buildAllocation({ id: 'b', startDate: '2026-06-15', endDate: '2026-07-31' })

    expect(peakPercentageIn([first, second], PERIOD)).toBe(100)
  })

  it('Should not stack a handover, because the ended allocation stops consuming on the day it closes', () => {
    const closed = buildAllocation({
      id: 'a',
      startDate: '2026-06-01',
      endDate: '2026-07-31',
      endedAt: '2026-07-01T09:00:00Z',
      endedReason: 'realocação',
    })
    const opened = buildAllocation({ id: 'b', startDate: '2026-07-01', endDate: '2026-07-31' })

    expect(peakPercentageIn([closed, opened], PERIOD)).toBe(50)
  })

  it('Should measure the peak inside the window, ignoring what only happens outside it', () => {
    const outside = buildAllocation({
      id: 'a',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      percentage: 100,
    })

    expect(peakPercentageIn([outside], PERIOD)).toBe(0)
  })

  it('Should be zero when the project has no allocation left in the window', () => {
    expect(peakPercentageIn([], PERIOD)).toBe(0)
  })
})

describe('buildAllocationByProject', () => {
  it('Should order by load and break the tie by name', () => {
    const rows = buildAllocationByProject(
      [
        buildActivity({ id: 'portal', name: 'Portal do parceiro' }, [
          buildAllocation({ id: 'a', percentage: 50, startDate: '2026-06-01', endDate: '2026-06-30' }),
        ]),
        buildActivity({ id: 'gateway', name: 'Migração do gateway' }, [
          buildAllocation({ id: 'b', percentage: 50, startDate: '2026-06-01', endDate: '2026-06-30' }),
        ]),
        buildActivity({ id: 'field', name: 'App de campo v2' }, [
          buildAllocation({ id: 'c', percentage: 150, startDate: '2026-06-01', endDate: '2026-06-30' }),
        ]),
      ],
      PERIOD,
    )

    expect(rows.map((row) => row.name)).toEqual([
      'App de campo v2',
      'Migração do gateway',
      'Portal do parceiro',
    ])
  })

  it('Should count each person once, however many allocations they had in the window', () => {
    const [row] = buildAllocationByProject(
      [
        buildActivity({ id: 'gateway', name: 'Migração do gateway' }, [
          buildAllocation({ id: 'a', personId: 'ana', startDate: '2026-06-01', endDate: '2026-06-30' }),
          buildAllocation({ id: 'b', personId: 'ana', startDate: '2026-07-01', endDate: '2026-07-31' }),
          buildAllocation({ id: 'c', personId: 'rafael', startDate: '2026-07-01', endDate: '2026-07-31' }),
        ]),
      ],
      PERIOD,
    )

    expect(row?.personCount).toBe(2)
    expect(row?.allocationCount).toBe(3)
  })

  it('Should carry the block and the pause, which paint the bar and the number', () => {
    const rows = buildAllocationByProject(
      [
        buildActivity({ id: 'portal', name: 'Portal do parceiro', status: 'blocked' }, []),
        buildActivity({ id: 'field', name: 'App de campo v2', pausedAt: '2026-08-20T09:00:00Z' }, []),
      ],
      PERIOD,
    )

    expect(rows.find((row) => row.projectId === 'portal')?.isBlocked).toBe(true)
    expect(rows.find((row) => row.projectId === 'field')?.isPaused).toBe(true)
  })
})

describe('sumAllocations', () => {
  it('Should add the allocations of every project on the chart', () => {
    const rows = buildAllocationByProject(
      [
        buildActivity({ id: 'gateway', name: 'Migração do gateway' }, [
          buildAllocation({ id: 'a', startDate: '2026-06-01', endDate: '2026-06-30' }),
          buildAllocation({ id: 'b', startDate: '2026-07-01', endDate: '2026-07-31' }),
        ]),
        buildActivity({ id: 'portal', name: 'Portal do parceiro' }, [
          buildAllocation({ id: 'c', startDate: '2026-06-01', endDate: '2026-06-30' }),
        ]),
      ],
      PERIOD,
    )

    expect(sumAllocations(rows)).toBe(3)
  })
})
