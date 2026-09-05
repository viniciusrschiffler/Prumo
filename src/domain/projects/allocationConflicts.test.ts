import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildAllocation, buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { findAllocationConflicts, type AllocationConflict } from './allocationConflicts'
import type { ProjectsSnapshot } from './projectRow'

function conflictsOf(snapshot: ProjectsSnapshot, projectId: string): AllocationConflict[] {
  return findAllocationConflicts({
    projectId,
    taskIds: snapshot.tasks.filter((task) => task.projectId === projectId).map((task) => task.id),
    allocations: snapshot.allocations,
    tasks: snapshot.tasks,
    projects: snapshot.projects,
    people: snapshot.people,
  })
}

let seed: ProjectsSnapshot

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()

  seed = readProjectsSnapshot(database)
})

describe('findAllocationConflicts sobre o seed', () => {
  it('Should find the 150 percent of Rafael between the two dates the design prints', () => {
    const rafael = conflictsOf(seed, 'gateway').find((conflict) => conflict.person.id === 'rafael')

    expect(rafael?.period).toEqual({ start: '2026-06-01', end: '2026-06-26' })
    expect(rafael?.totalPercentage).toBe(150)
  })

  it('Should name the task here and the project elsewhere, as the design sentence does', () => {
    const rafael = conflictsOf(seed, 'gateway').find((conflict) => conflict.person.id === 'rafael')

    expect(
      rafael?.contributions.map((contribution) => ({
        percentage: contribution.allocation.percentage,
        task: contribution.taskTitle,
        project: contribution.projectName,
        here: contribution.isSameProject,
      })),
    ).toEqual([
      {
        percentage: 50,
        task: 'Testes de carga',
        project: 'Migração do gateway',
        here: true,
      },
      {
        percentage: 100,
        task: 'Instrumentar serviços críticos',
        project: 'Observabilidade',
        here: false,
      },
    ])
  })

  it('Should not invent a conflict on the day the reallocation replaces the allocation', () => {
    const onHandoverDay = conflictsOf(seed, 'gateway').filter(
      (conflict) => conflict.period.start <= '2026-08-28' && '2026-08-28' <= conflict.period.end,
    )

    expect(onHandoverDay).toEqual([])
  })

  it('Should also report Ana, who runs at 150 percent across two projects in March', () => {
    const ana = conflictsOf(seed, 'gateway').find((conflict) => conflict.person.id === 'ana')

    expect(ana?.period).toEqual({ start: '2026-03-12', end: '2026-03-27' })
    expect(ana?.totalPercentage).toBe(150)
  })

  it('Should still see the March overlap from the side of the blocked project', () => {
    const conflicts = conflictsOf(seed, 'parceiro')

    expect(conflicts.map((conflict) => [conflict.person.id, conflict.period])).toEqual([
      ['ana', { start: '2026-03-12', end: '2026-03-27' }],
    ])
  })

  it('Should leave the paused project alone, nobody there passing one hundred percent', () => {
    expect(conflictsOf(seed, 'campo')).toEqual([])
  })

  it('Should order the conflicts by when they start', () => {
    expect(conflictsOf(seed, 'gateway').map((conflict) => conflict.period.start)).toEqual([
      '2026-03-12',
      '2026-06-01',
    ])
  })
})

describe('findAllocationConflicts', () => {
  const person = buildPerson({ id: 'rafael' })
  const here = buildTask({ id: 'aqui', projectId: 'gateway' })
  const elsewhere = buildTask({ id: 'la', projectId: 'outro' })
  const projects = [buildProject(), buildProject({ id: 'outro', name: 'Outro' })]

  function findWith(allocations: readonly ReturnType<typeof buildAllocation>[]) {
    return findAllocationConflicts({
      projectId: 'gateway',
      taskIds: ['aqui'],
      allocations,
      tasks: [here, elsewhere],
      projects,
      people: [person],
    })
  }

  it('Should see no conflict at exactly one hundred percent', () => {
    expect(
      findWith([
        buildAllocation({ id: 'a', taskId: 'aqui', personId: 'rafael', percentage: 50 }),
        buildAllocation({ id: 'b', taskId: 'la', personId: 'rafael', percentage: 50 }),
      ]),
    ).toEqual([])
  })

  it('Should ignore an overload that never touches this project', () => {
    expect(
      findWith([
        buildAllocation({
          id: 'aqui-1',
          taskId: 'aqui',
          personId: 'rafael',
          percentage: 10,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        }),
        buildAllocation({
          id: 'la-1',
          taskId: 'la',
          personId: 'rafael',
          percentage: 80,
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        }),
        buildAllocation({
          id: 'la-2',
          taskId: 'la',
          personId: 'rafael',
          percentage: 80,
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        }),
      ]),
    ).toEqual([])
  })

  it('Should cut the conflict to the days the overlap lasts', () => {
    const conflicts = findWith([
      buildAllocation({
        id: 'a',
        taskId: 'aqui',
        personId: 'rafael',
        percentage: 100,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      }),
      buildAllocation({
        id: 'b',
        taskId: 'la',
        personId: 'rafael',
        percentage: 100,
        startDate: '2026-03-10',
        endDate: '2026-03-20',
      }),
    ])

    expect(conflicts[0]?.period).toEqual({ start: '2026-03-10', end: '2026-03-20' })
    expect(conflicts[0]?.totalPercentage).toBe(200)
  })

  it('Should split a conflict whose percentage changes in the middle', () => {
    const conflicts = findWith([
      buildAllocation({
        id: 'a',
        taskId: 'aqui',
        personId: 'rafael',
        percentage: 100,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      }),
      buildAllocation({
        id: 'b',
        taskId: 'la',
        personId: 'rafael',
        percentage: 50,
        startDate: '2026-03-01',
        endDate: '2026-03-15',
      }),
      buildAllocation({
        id: 'c',
        taskId: 'la',
        personId: 'rafael',
        percentage: 30,
        startDate: '2026-03-16',
        endDate: '2026-03-31',
      }),
    ])

    expect(conflicts.map((conflict) => [conflict.period, conflict.totalPercentage])).toEqual([
      [{ start: '2026-03-01', end: '2026-03-15' }, 150],
      [{ start: '2026-03-16', end: '2026-03-31' }, 130],
    ])
  })

  it('Should drop an allocation ended before it ever started', () => {
    expect(
      findWith([
        buildAllocation({
          id: 'a',
          taskId: 'aqui',
          personId: 'rafael',
          percentage: 100,
          startDate: '2026-03-01',
          endDate: '2026-03-31',
        }),
        buildAllocation({
          id: 'b',
          taskId: 'la',
          personId: 'rafael',
          percentage: 100,
          startDate: '2026-03-01',
          endDate: '2026-03-31',
          endedAt: '2026-03-01T09:00:00Z',
          endedReason: 'projeto bloqueado',
        }),
      ]),
    ).toEqual([])
  })
})
