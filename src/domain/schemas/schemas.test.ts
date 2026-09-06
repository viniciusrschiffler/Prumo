import { describe, expect, it } from 'vitest'
import { allocationSchema } from './allocationSchema'
import { phaseColorSchema } from './phaseSchema'
import { isoDateSchema, isoDateTimeSchema } from './primitives'
import { projectSchema } from './projectSchema'
import { todoSchema } from './todoSchema'

const BASE_PROJECT = {
  id: 'p1',
  name: 'Migração do gateway',
  description: null,
  status: 'active',
  priority: 'P1',
  ownerPersonId: null,
  plannedStart: '2026-03-12',
  plannedEnd: '2026-09-29',
  createdAt: '2026-03-01T12:00:00Z',
  archivedAt: null,
  pausedAt: null,
}

const BASE_ALLOCATION = {
  id: 'a1',
  taskId: 't1',
  personId: 'pe1',
  startDate: '2026-03-12',
  endDate: '2026-04-12',
  percentage: 50,
  endedAt: null,
  endedReason: null,
}

const BASE_TODO = {
  id: 'td1',
  title: 'Revisar contrato',
  description: null,
  dueDate: null,
  priority: 'P2',
  status: 'open',
  projectId: null,
  taskId: null,
  completedAt: null,
  recurrenceId: null,
}

describe('primitivos de data', () => {
  it('Should accept a calendar date and reject an instant on the date schema', () => {
    expect(isoDateSchema.safeParse('2026-03-12').success).toBe(true)
    expect(isoDateSchema.safeParse('2026-03-12T00:00:00Z').success).toBe(false)
  })

  it('Should accept UTC and reject a local offset on the datetime schema', () => {
    expect(isoDateTimeSchema.safeParse('2026-03-12T14:22:00Z').success).toBe(true)
    expect(isoDateTimeSchema.safeParse('2026-03-12T14:22:00-03:00').success).toBe(false)
  })
})

describe('projectSchema', () => {
  it('Should reject a planned end earlier than the planned start', () => {
    const result = projectSchema.safeParse({
      ...BASE_PROJECT,
      plannedStart: '2026-09-29',
      plannedEnd: '2026-03-12',
    })

    expect(result.success).toBe(false)
  })

  it('Should accept an open period with either end missing', () => {
    expect(projectSchema.safeParse({ ...BASE_PROJECT, plannedEnd: null }).success).toBe(true)
  })

  it('Should reject a status outside the catalog', () => {
    expect(projectSchema.safeParse({ ...BASE_PROJECT, status: 'atrasado' }).success).toBe(false)
  })
})

describe('allocationSchema', () => {
  it('Should reject an ended reason without an ended date', () => {
    const result = allocationSchema.safeParse({
      ...BASE_ALLOCATION,
      endedReason: 'projeto bloqueado',
    })

    expect(result.success).toBe(false)
  })

  it('Should accept an allocation closed with date and reason', () => {
    const result = allocationSchema.safeParse({
      ...BASE_ALLOCATION,
      endedAt: '2026-04-01T09:00:00Z',
      endedReason: 'projeto bloqueado',
    })

    expect(result.success).toBe(true)
  })

  it('Should reject a percentage above one hundred', () => {
    expect(allocationSchema.safeParse({ ...BASE_ALLOCATION, percentage: 150 }).success).toBe(false)
  })
})

describe('todoSchema', () => {
  it('Should reject a completion date on a todo that is not done', () => {
    const result = todoSchema.safeParse({
      ...BASE_TODO,
      completedAt: '2026-03-12T14:22:00Z',
    })

    expect(result.success).toBe(false)
  })
})

describe('phaseColorSchema', () => {
  it('Should accept the oklch colors seeded from the design tokens', () => {
    expect(phaseColorSchema.safeParse('oklch(0.545 0.16 292)').success).toBe(true)
    expect(phaseColorSchema.safeParse('oklch(0.545 0.16 292 / 0.5)').success).toBe(true)
  })

  it('Should reject a value that would escape the custom property', () => {
    expect(phaseColorSchema.safeParse('red; } body { display: none } .x {').success).toBe(false)
    expect(phaseColorSchema.safeParse('#ff0000').success).toBe(false)
  })
})
