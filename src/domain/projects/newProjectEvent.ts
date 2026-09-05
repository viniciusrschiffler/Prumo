import type { EntityId, IsoDate, IsoDateTime } from '@/domain/schemas/primitives'
import type { ProjectEvent, ProjectEventType } from '@/domain/schemas/projectEventSchema'

// O bloqueio e o desbloqueio nascem das ações de bloquear e desbloquear, que encerram e
// recriam alocação. Oferecê-los aqui gravaria o evento sem mexer nas alocações.
export const REGISTRABLE_EVENT_TYPES: readonly ProjectEventType[] = [
  'decision',
  'scope_change',
  'reallocation',
  'risk',
  'note',
]

export type NewProjectEventDraft = {
  projectId: EntityId
  type: ProjectEventType
  eventDate: IsoDate | null
  title: string
  bodyMarkdown: string
  riskOpen: boolean
}

export type NewProjectEventErrors = {
  title?: string
  eventDate?: string
}

export function validateNewProjectEvent(draft: NewProjectEventDraft): NewProjectEventErrors {
  const errors: NewProjectEventErrors = {}

  if (draft.title.trim() === '') {
    errors.title = 'Dê um título ao evento.'
  }

  if (draft.eventDate === null) {
    errors.eventDate = 'Informe a data do evento.'
  }

  return errors
}

export function canOpenRisk(type: ProjectEventType): boolean {
  return type === 'risk'
}

export function buildNewProjectEvent(
  draft: NewProjectEventDraft,
  eventId: EntityId,
  now: IsoDateTime,
): ProjectEvent {
  const body = draft.bodyMarkdown.trim()

  return {
    id: eventId,
    projectId: draft.projectId,
    type: draft.type,
    eventDate: draft.eventDate ?? now.slice(0, 10),
    title: draft.title.trim(),
    bodyMarkdown: body === '' ? null : body,
    revertsEventId: null,
    riskOpen: canOpenRisk(draft.type) && draft.riskOpen,
    expectedResumeAt: null,
    createdAt: now,
  }
}
