import { describe, expect, it } from 'vitest'
import {
  buildAllocation,
  buildPerson,
  buildProjectEvent,
  buildTask,
} from '@/domain/testing/entityBuilders'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { findPendingDecisions, type PendingDecisionsInput } from './pendingDecisions'

const TODAY = '2026-09-03'

function buildInput(overrides: Partial<PendingDecisionsInput> = {}): PendingDecisionsInput {
  return {
    projects: [],
    tasks: [],
    events: [],
    allocations: [],
    people: [],
    today: TODAY,
    ...overrides,
  }
}

describe('Projeto bloqueado', () => {
  const blocked = buildProject({ id: 'parceiro', status: 'blocked' })

  it('Should count the days since the block that has no unblock yet', () => {
    const decisions = findPendingDecisions(
      buildInput({
        projects: [blocked],
        events: [
          buildProjectEvent({
            id: 'block',
            projectId: 'parceiro',
            type: 'block',
            eventDate: '2026-08-11',
          }),
        ],
      }),
    )

    expect(decisions[0]?.kind).toBe('blocked')
    expect(decisions[0]?.sinceDays).toBe(23)
  })

  it('Should ignore a block that was already undone', () => {
    const decisions = findPendingDecisions(
      buildInput({
        projects: [blocked],
        events: [
          buildProjectEvent({ id: '1', projectId: 'parceiro', type: 'block', eventDate: '2026-07-22' }),
          buildProjectEvent({ id: '2', projectId: 'parceiro', type: 'unblock', eventDate: '2026-07-30' }),
        ],
      }),
    )

    expect(decisions).toEqual([])
  })

  it('Should measure how long ago the expected resume date expired', () => {
    const decisions = findPendingDecisions(
      buildInput({
        projects: [blocked],
        events: [
          buildProjectEvent({
            projectId: 'parceiro',
            type: 'block',
            eventDate: '2026-08-11',
            expectedResumeAt: '2026-08-26',
          }),
        ],
      }),
    )

    expect(decisions[0]?.overdueResumeDays).toBe(8)
  })

  it('Should leave the overdue days empty while the resume date has not arrived', () => {
    const decisions = findPendingDecisions(
      buildInput({
        projects: [blocked],
        events: [
          buildProjectEvent({
            projectId: 'parceiro',
            type: 'block',
            eventDate: '2026-08-11',
            expectedResumeAt: '2026-09-20',
          }),
        ],
      }),
    )

    expect(decisions[0]?.overdueResumeDays).toBeNull()
  })
})

describe('Projeto pausado', () => {
  const paused = buildProject({
    id: 'campo',
    status: 'paused',
    pausedAt: '2026-08-28T16:00:00Z',
  })

  it('Should count the days since the pause', () => {
    const decisions = findPendingDecisions(buildInput({ projects: [paused] }))

    expect(decisions[0]?.kind).toBe('paused')
    expect(decisions[0]?.sinceDate).toBe('2026-08-28')
    expect(decisions[0]?.sinceDays).toBe(6)
  })

  it('Should read who is still allocated from the live allocations, not from the event text', () => {
    const decisions = findPendingDecisions(
      buildInput({
        projects: [paused],
        tasks: [buildTask({ id: 'ac-roteiro', projectId: 'campo' })],
        people: [buildPerson({ id: 'marcos', name: 'Marcos Teles' })],
        allocations: [
          buildAllocation({
            taskId: 'ac-roteiro',
            personId: 'marcos',
            startDate: '2026-09-03',
            endDate: '2026-10-02',
            percentage: 30,
          }),
        ],
      }),
    )

    expect(decisions[0]?.allocatedPeople).toEqual([
      { person: expect.objectContaining({ name: 'Marcos Teles' }), percentage: 30 },
    ])
  })

  it('Should leave out an allocation already ended', () => {
    const decisions = findPendingDecisions(
      buildInput({
        projects: [paused],
        tasks: [buildTask({ id: 'ac-piloto', projectId: 'campo' })],
        people: [buildPerson({ id: 'marcos' })],
        allocations: [
          buildAllocation({
            taskId: 'ac-piloto',
            personId: 'marcos',
            startDate: '2026-07-01',
            endDate: '2026-10-02',
            endedAt: '2026-08-28T11:20:00Z',
            endedReason: 'realocação',
          }),
        ],
      }),
    )

    expect(decisions[0]?.allocatedPeople).toEqual([])
  })
})

describe('Ordem dos cards', () => {
  it('Should put the blocked before the paused, and the oldest first', () => {
    const decisions = findPendingDecisions(
      buildInput({
        projects: [
          buildProject({ id: 'campo', status: 'paused', pausedAt: '2026-08-28T16:00:00Z' }),
          buildProject({ id: 'parceiro', status: 'blocked' }),
          buildProject({ id: 'gateway', status: 'active' }),
        ],
        events: [
          buildProjectEvent({ projectId: 'parceiro', type: 'block', eventDate: '2026-08-11' }),
        ],
      }),
    )

    expect(decisions.map((decision) => decision.project.id)).toEqual(['parceiro', 'campo'])
  })

  it('Should leave out an archived project', () => {
    const decisions = findPendingDecisions(
      buildInput({
        projects: [
          buildProject({
            id: 'erp',
            status: 'paused',
            pausedAt: '2026-03-01T09:00:00Z',
            archivedAt: '2026-04-30T18:00:00Z',
          }),
        ],
      }),
    )

    expect(decisions).toEqual([])
  })
})
