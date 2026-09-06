import { formatIsoDate } from '@/domain/format/displayDate'
import type { EntityId, IsoDate, IsoDateTime } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'

export type ProjectResume = {
  projectId: EntityId
  event: ProjectEvent
}

export type ResumeProjectInput = {
  projectId: EntityId
  pausedSince: IsoDate
  eventId: EntityId
  today: IsoDate
  now: IsoDateTime
}

const RESUME_EVENT_TITLE = 'Projeto retomado'

// Pausar foi uma decisão e retomar é a decisão contrária, então o evento é do mesmo tipo. O
// design não pede o registro, mas um app cujo produto é o histórico não pode trocar de status
// sem deixar rastro.
export function buildProjectResume(input: ResumeProjectInput): ProjectResume {
  return {
    projectId: input.projectId,
    event: {
      id: input.eventId,
      projectId: input.projectId,
      type: 'decision',
      eventDate: input.today,
      title: RESUME_EVENT_TITLE,
      bodyMarkdown: `Pausado desde ${formatIsoDate(input.pausedSince)}, volta a andar hoje.`,
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: null,
      createdAt: input.now,
    },
  }
}
