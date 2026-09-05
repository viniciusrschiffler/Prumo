import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildAllocation, buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import {
  buildAllocationRows,
  countOpenAllocations,
  mapOpenPercentagesByTask,
  type AllocationRow,
} from './allocationRows'
import type { ProjectsSnapshot } from './projectRow'

function rowsOf(snapshot: ProjectsSnapshot, projectId: string): AllocationRow[] {
  return buildAllocationRows(
    snapshot.tasks.filter((task) => task.projectId === projectId).map((task) => task.id),
    snapshot.allocations,
    snapshot.tasks,
    snapshot.people,
  )
}

let gatewayRows: AllocationRow[]

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  gatewayRows = rowsOf(readProjectsSnapshot(database), 'gateway')
})

describe('buildAllocationRows sobre o seed', () => {
  it('Should keep the eight allocations of the gateway, ended ones included', () => {
    expect(gatewayRows).toHaveLength(8)
    expect(countOpenAllocations(gatewayRows)).toBe(5)
  })

  it('Should push every ended allocation below the open ones', () => {
    const endedFlags = gatewayRows.map((row) => row.isEnded)

    expect(endedFlags).toEqual([false, false, false, false, false, true, true, true])
  })

  it('Should read the hours the allocation of Ana consumes, as the design row shows', () => {
    const anaOnRewrite = gatewayRows.find((row) => row.allocation.id === 'al-gw-2')

    expect(anaOnRewrite).toMatchObject({
      consumedWeeklyHours: 20,
      isEnded: false,
    })
    expect(anaOnRewrite?.task?.title).toBe('Rewrite do roteador de pagamentos')
  })

  it('Should give the whole capacity to a full allocation', () => {
    const rafaelOnRewrite = gatewayRows.find((row) => row.allocation.id === 'al-gw-3')

    expect(rafaelOnRewrite?.consumedWeeklyHours).toBe(40)
  })

  it('Should keep the reason an allocation was ended', () => {
    const endedByBlock = gatewayRows.find((row) => row.allocation.id === 'al-gw-4')

    expect(endedByBlock?.allocation.endedReason).toBe('projeto bloqueado')
  })
})

describe('buildAllocationRows', () => {
  it('Should return nothing when the project has no task', () => {
    expect(buildAllocationRows([], [buildAllocation()], [buildTask()], [buildPerson()])).toEqual([])
  })

  it('Should leave the allocation of another project out', () => {
    const rows = buildAllocationRows(
      ['aqui'],
      [buildAllocation({ taskId: 'la' })],
      [buildTask({ id: 'la' })],
      [buildPerson()],
    )

    expect(rows).toEqual([])
  })

  it('Should order the open allocations by the name of the person', () => {
    const rows = buildAllocationRows(
      ['aqui'],
      [
        buildAllocation({ id: 'r', taskId: 'aqui', personId: 'rafael' }),
        buildAllocation({ id: 'a', taskId: 'aqui', personId: 'ana' }),
      ],
      [buildTask({ id: 'aqui' })],
      [
        buildPerson({ id: 'rafael', name: 'Rafael Brito' }),
        buildPerson({ id: 'ana', name: 'Ana Nogueira' }),
      ],
    )

    expect(rows.map((row) => row.person?.name)).toEqual(['Ana Nogueira', 'Rafael Brito'])
  })

  it('Should survive an allocation whose person is no longer in the register', () => {
    const rows = buildAllocationRows(
      ['aqui'],
      [buildAllocation({ taskId: 'aqui', personId: 'sumiu' })],
      [buildTask({ id: 'aqui' })],
      [],
    )

    expect(rows[0]).toMatchObject({ person: null, consumedWeeklyHours: 0 })
  })
})

describe('mapOpenPercentagesByTask', () => {
  it('Should read the percentage each person holds on the rewrite of the gateway', () => {
    const byPerson = mapOpenPercentagesByTask(gatewayRows).get('gw-rew')

    expect([...(byPerson ?? [])]).toEqual([
      ['ana', 50],
      ['rafael', 100],
    ])
  })

  it('Should keep only the open allocation of a task that had its team replaced', () => {
    const byPerson = mapOpenPercentagesByTask(gatewayRows).get('gw-tes')

    expect([...(byPerson ?? [])]).toEqual([
      ['ana', 50],
      ['rafael', 50],
    ])
  })

  it('Should leave a task nobody is on out of the map', () => {
    expect(mapOpenPercentagesByTask(gatewayRows).has('gw-cut')).toBe(false)
  })
})
