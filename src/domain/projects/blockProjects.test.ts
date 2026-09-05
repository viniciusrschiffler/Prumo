import { describe, expect, it } from 'vitest'
import { buildAllocation } from '@/domain/testing/entityBuilders'
import {
  buildProjectBlock,
  listOpenAllocationIds,
  validateBlockProjects,
} from './blockProjects'

const DRAFT = { reason: 'Aguardando validação jurídica', expectedResumeAt: '2026-09-26' }
const TODAY = '2026-09-05'
const NOW = '2026-09-05T12:00:00Z'

describe('listOpenAllocationIds', () => {
  it('Should list the allocations that were never ended', () => {
    const ids = listOpenAllocationIds(
      ['task-1'],
      [
        buildAllocation({ id: 'aberta', taskId: 'task-1' }),
        buildAllocation({ id: 'encerrada', taskId: 'task-1', endedAt: '2026-08-11T10:05:00Z' }),
      ],
    )

    expect(ids).toEqual(['aberta'])
  })

  it('Should ignore the allocations of another project', () => {
    expect(
      listOpenAllocationIds(['task-1'], [buildAllocation({ id: 'outra', taskId: 'task-9' })]),
    ).toEqual([])
  })
})

describe('validateBlockProjects', () => {
  it('Should require a reason', () => {
    expect(validateBlockProjects({ reason: '  ', expectedResumeAt: null })).not.toBeNull()
  })

  it('Should accept a block with no expected resume date', () => {
    expect(validateBlockProjects({ reason: 'Sem ambiente', expectedResumeAt: null })).toBeNull()
  })
})

describe('buildProjectBlock', () => {
  it('Should record a block event carrying the typed reason', () => {
    const block = buildProjectBlock('parceiro', [], DRAFT, 'ev-1', TODAY, NOW)

    expect(block.event).toMatchObject({
      id: 'ev-1',
      projectId: 'parceiro',
      type: 'block',
      eventDate: TODAY,
      title: 'Aguardando validação jurídica',
      expectedResumeAt: '2026-09-26',
      riskOpen: false,
      createdAt: NOW,
    })
  })

  it('Should name in the event body how many allocations the block ends', () => {
    const block = buildProjectBlock('parceiro', ['a', 'b'], DRAFT, 'ev-1', TODAY, NOW)

    expect(block.event.bodyMarkdown).toBe('2 alocações encerradas no bloqueio.')
    expect(block.endedAllocationIds).toEqual(['a', 'b'])
  })

  it('Should write the singular when the block ends a single allocation', () => {
    expect(
      buildProjectBlock('parceiro', ['a'], DRAFT, 'ev-1', TODAY, NOW).event.bodyMarkdown,
    ).toBe('1 alocação encerrada no bloqueio.')
  })

  it('Should leave the body empty when there is no allocation to end', () => {
    expect(buildProjectBlock('parceiro', [], DRAFT, 'ev-1', TODAY, NOW).event.bodyMarkdown).toBeNull()
  })

  it('Should stamp the ending with the same instant as the event', () => {
    const block = buildProjectBlock('parceiro', ['a'], DRAFT, 'ev-1', TODAY, NOW)

    expect(block.endedAt).toBe(block.event.createdAt)
  })
})
