import { describe, expect, it } from 'vitest'
import { buildProjectResume } from './resumeProjects'

describe('Retomar projeto', () => {
  it('Should register the resume as a decision, dated today', () => {
    const { projectId, event } = buildProjectResume({
      projectId: 'campo',
      pausedSince: '2026-08-28',
      eventId: 'ev-resume',
      today: '2026-09-03',
      now: '2026-09-03T11:00:00Z',
    })

    expect(projectId).toBe('campo')
    expect(event).toEqual({
      id: 'ev-resume',
      projectId: 'campo',
      type: 'decision',
      eventDate: '2026-09-03',
      title: 'Projeto retomado',
      bodyMarkdown: 'Pausado desde 28/08/2026, volta a andar hoje.',
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: null,
      createdAt: '2026-09-03T11:00:00Z',
    })
  })
})
