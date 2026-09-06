import { describe, expect, it } from 'vitest'
import { buildAllocation, buildProjectEvent, buildTask } from '@/domain/testing/entityBuilders'
import { BLOCKED_ALLOCATION_REASON } from './blockProjects'
import {
  buildProjectUnblock,
  validateUnblockProject,
  type UnblockProjectInput,
} from './unblockProjects'

const TODAY = '2026-07-30'
const NOW = '2026-07-30T09:15:00Z'

const blockEvent = buildProjectEvent({
  id: 'ev-block',
  projectId: 'gateway',
  type: 'block',
  eventDate: '2026-07-22',
  createdAt: '2026-07-22T16:40:00Z',
})

function endedByBlock(overrides = {}) {
  return buildAllocation({
    taskId: 'gw-tes',
    endedAt: '2026-07-22T16:40:00Z',
    endedReason: BLOCKED_ALLOCATION_REASON,
    ...overrides,
  })
}

function buildInput(overrides: Partial<UnblockProjectInput> = {}): UnblockProjectInput {
  return {
    projectId: 'gateway',
    blockEvent,
    tasks: [buildTask({ id: 'gw-tes', projectId: 'gateway', plannedEnd: '2026-09-26' })],
    allocations: [],
    draft: { reason: 'Ambiente liberado pela infra' },
    eventId: 'ev-unblock',
    allocationIds: ['al-nova-1', 'al-nova-2'],
    today: TODAY,
    now: NOW,
    ...overrides,
  }
}

describe('Validação', () => {
  it('Should ask for a reason', () => {
    expect(validateUnblockProject({ reason: '  ' })).toBe('Diga o que destravou o projeto.')
    expect(validateUnblockProject({ reason: 'Ambiente liberado' })).toBeNull()
  })
})

describe('Evento de desbloqueio', () => {
  it('Should carry the reason as title and the day as event date', () => {
    const { event } = buildProjectUnblock(buildInput())

    expect(event).toMatchObject({
      type: 'unblock',
      eventDate: TODAY,
      title: 'Ambiente liberado pela infra',
      expectedResumeAt: null,
      riskOpen: false,
    })
  })

  it('Should say how many allocations came back, as the seed history does', () => {
    const { event } = buildProjectUnblock(
      buildInput({
        allocations: [
          endedByBlock({ id: 'al-1', personId: 'ana' }),
          endedByBlock({ id: 'al-2', personId: 'rafael' }),
        ],
      }),
    )

    expect(event.bodyMarkdown).toBe('2 alocações recriadas no desbloqueio.')
  })

  it('Should leave the body empty when nothing came back', () => {
    expect(buildProjectUnblock(buildInput()).event.bodyMarkdown).toBeNull()
  })
})

describe('Alocações recriadas', () => {
  it('Should reopen from the unblock day to the current end of the task', () => {
    const { resumedAllocations } = buildProjectUnblock(
      buildInput({
        allocations: [endedByBlock({ id: 'al-1', personId: 'ana', percentage: 50 })],
      }),
    )

    expect(resumedAllocations).toEqual([
      {
        id: 'al-nova-1',
        taskId: 'gw-tes',
        personId: 'ana',
        startDate: TODAY,
        endDate: '2026-09-26',
        percentage: 50,
        endedAt: null,
        endedReason: null,
      },
    ])
  })

  it('Should never delete nor touch the allocation the block ended', () => {
    const ended = endedByBlock({ id: 'al-1', personId: 'ana' })
    const { resumedAllocations } = buildProjectUnblock(buildInput({ allocations: [ended] }))

    expect(resumedAllocations[0]?.id).not.toBe(ended.id)
    expect(ended.endedAt).toBe('2026-07-22T16:40:00Z')
  })

  it('Should leave out an allocation ended for another reason', () => {
    const { resumedAllocations } = buildProjectUnblock(
      buildInput({
        allocations: [
          endedByBlock({ id: 'al-1', endedReason: 'realocação para Observabilidade' }),
        ],
      }),
    )

    expect(resumedAllocations).toEqual([])
  })

  it('Should leave out an allocation ended before this block', () => {
    const { resumedAllocations } = buildProjectUnblock(
      buildInput({
        allocations: [endedByBlock({ id: 'al-1', endedAt: '2026-05-02T10:00:00Z' })],
      }),
    )

    expect(resumedAllocations).toEqual([])
  })

  it('Should not reopen when the task already ended, since there is nothing to come back to', () => {
    const { resumedAllocations } = buildProjectUnblock(
      buildInput({
        tasks: [buildTask({ id: 'gw-tes', projectId: 'gateway', plannedEnd: '2026-06-26' })],
        allocations: [endedByBlock({ id: 'al-1' })],
      }),
    )

    expect(resumedAllocations).toEqual([])
  })
})
