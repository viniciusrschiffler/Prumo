import { describe, expect, it } from 'vitest'
import { buildAllocation, buildPerson } from '@/domain/testing/entityBuilders'
import { derivePeopleSummary } from './derivePeopleSummary'

const ANA = buildPerson({ id: 'ana', name: 'Ana Nogueira', initials: 'AN' })
const RAFAEL = buildPerson({ id: 'rafael', name: 'Rafael Brito', initials: 'RB' })
const PEOPLE = [RAFAEL, ANA]

describe('derivePeopleSummary', () => {
  it('Should report nobody for a project with no allocation', () => {
    expect(derivePeopleSummary(['task-1'], [], PEOPLE)).toEqual({
      people: [],
      hasOnlyEndedAllocations: false,
    })
  })

  it('Should list each person once even with several open allocations', () => {
    const summary = derivePeopleSummary(
      ['task-1', 'task-2'],
      [
        buildAllocation({ id: 'a', taskId: 'task-1', personId: 'ana' }),
        buildAllocation({ id: 'b', taskId: 'task-2', personId: 'ana' }),
      ],
      PEOPLE,
    )

    expect(summary.people.map((person) => person.id)).toEqual(['ana'])
  })

  it('Should order the people by name', () => {
    const summary = derivePeopleSummary(
      ['task-1'],
      [
        buildAllocation({ id: 'a', taskId: 'task-1', personId: 'rafael' }),
        buildAllocation({ id: 'b', taskId: 'task-1', personId: 'ana' }),
      ],
      PEOPLE,
    )

    expect(summary.people.map((person) => person.name)).toEqual([
      'Ana Nogueira',
      'Rafael Brito',
    ])
  })

  it('Should flag the project whose allocations were all ended', () => {
    const summary = derivePeopleSummary(
      ['task-1'],
      [
        buildAllocation({
          id: 'a',
          taskId: 'task-1',
          personId: 'ana',
          endedAt: '2026-08-11T10:05:00Z',
          endedReason: 'projeto bloqueado',
        }),
      ],
      PEOPLE,
    )

    expect(summary).toEqual({ people: [], hasOnlyEndedAllocations: true })
  })

  it('Should not flag ended allocations while one is still open', () => {
    const summary = derivePeopleSummary(
      ['task-1'],
      [
        buildAllocation({ id: 'a', taskId: 'task-1', personId: 'ana', endedAt: '2026-08-11T10:05:00Z' }),
        buildAllocation({ id: 'b', taskId: 'task-1', personId: 'rafael' }),
      ],
      PEOPLE,
    )

    expect(summary.hasOnlyEndedAllocations).toBe(false)
    expect(summary.people.map((person) => person.id)).toEqual(['rafael'])
  })

  it('Should ignore an allocation that belongs to another project', () => {
    const summary = derivePeopleSummary(
      ['task-1'],
      [buildAllocation({ id: 'a', taskId: 'outra-tarefa', personId: 'ana' })],
      PEOPLE,
    )

    expect(summary).toEqual({ people: [], hasOnlyEndedAllocations: false })
  })
})
