import type { EntityId, IsoDate } from '@/domain/schemas/primitives'

export type ResumePostponement = {
  blockEventId: EntityId
  expectedResumeAt: IsoDate
}

export type PostponeResumeDraft = {
  blockEventId: EntityId
  expectedResumeAt: IsoDate | null
}

export function validatePostponeResume(
  draft: PostponeResumeDraft,
  today: IsoDate,
): string | null {
  if (draft.expectedResumeAt === null) {
    return 'Informe a nova data de retomada.'
  }

  return draft.expectedResumeAt < today ? 'A nova retomada não pode ser no passado.' : null
}

export function buildResumePostponement(draft: PostponeResumeDraft): ResumePostponement | null {
  if (draft.expectedResumeAt === null) {
    return null
  }

  return { blockEventId: draft.blockEventId, expectedResumeAt: draft.expectedResumeAt }
}
