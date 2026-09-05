import { describe, expect, it } from 'vitest'
import {
  buildNewProjectEvent,
  canOpenRisk,
  REGISTRABLE_EVENT_TYPES,
  validateNewProjectEvent,
  type NewProjectEventDraft,
} from './newProjectEvent'

const NOW = '2026-09-05T14:00:00Z'

function buildDraft(overrides: Partial<NewProjectEventDraft> = {}): NewProjectEventDraft {
  return {
    projectId: 'gateway',
    type: 'decision',
    eventDate: '2026-09-05',
    title: 'Manter o provedor atual no piloto',
    bodyMarkdown: 'Custo de migração dobrava o prazo.',
    riskOpen: false,
    ...overrides,
  }
}

describe('REGISTRABLE_EVENT_TYPES', () => {
  it('Should not offer block nor unblock, which come from their own actions', () => {
    expect(REGISTRABLE_EVENT_TYPES).not.toContain('block')
    expect(REGISTRABLE_EVENT_TYPES).not.toContain('unblock')
  })
})

describe('validateNewProjectEvent', () => {
  it('Should accept a complete draft', () => {
    expect(validateNewProjectEvent(buildDraft())).toEqual({})
  })

  it('Should refuse a title of blanks only', () => {
    expect(validateNewProjectEvent(buildDraft({ title: ' ' })).title).toBeDefined()
  })

  it('Should refuse an event with no date', () => {
    expect(validateNewProjectEvent(buildDraft({ eventDate: null })).eventDate).toBeDefined()
  })

  it('Should accept an event with no body', () => {
    expect(validateNewProjectEvent(buildDraft({ bodyMarkdown: '' }))).toEqual({})
  })
})

describe('canOpenRisk', () => {
  it('Should let only a risk stay open', () => {
    expect(canOpenRisk('risk')).toBe(true)
    expect(canOpenRisk('decision')).toBe(false)
  })
})

describe('buildNewProjectEvent', () => {
  it('Should write the event with the trimmed title and body', () => {
    const event = buildNewProjectEvent(
      buildDraft({ title: '  Decisão  ', bodyMarkdown: '  Corpo  ' }),
      'ev-1',
      NOW,
    )

    expect(event).toEqual({
      id: 'ev-1',
      projectId: 'gateway',
      type: 'decision',
      eventDate: '2026-09-05',
      title: 'Decisão',
      bodyMarkdown: 'Corpo',
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: null,
      createdAt: NOW,
    })
  })

  it('Should keep an empty body as nothing at all', () => {
    const event = buildNewProjectEvent(buildDraft({ bodyMarkdown: '   ' }), 'ev-1', NOW)

    expect(event.bodyMarkdown).toBeNull()
  })

  it('Should open the risk of a risk marked as open', () => {
    const event = buildNewProjectEvent(
      buildDraft({ type: 'risk', riskOpen: true }),
      'ev-1',
      NOW,
    )

    expect(event.riskOpen).toBe(true)
  })

  it('Should not let a decision carry an open risk', () => {
    const event = buildNewProjectEvent(
      buildDraft({ type: 'decision', riskOpen: true }),
      'ev-1',
      NOW,
    )

    expect(event.riskOpen).toBe(false)
  })

  it('Should fall back to the day it was written when the draft has no date', () => {
    const event = buildNewProjectEvent(buildDraft({ eventDate: null }), 'ev-1', NOW)

    expect(event.eventDate).toBe('2026-09-05')
  })
})
