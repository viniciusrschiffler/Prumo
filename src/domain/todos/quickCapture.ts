import type { EntityId, IsoDate, Priority } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'
import {
  findProjectByToken,
  parseDateToken,
  parsePriorityToken,
  PRIORITY_PREFIX,
  PROJECT_PREFIX,
  TAG_PREFIX,
} from './captureTokens'

export type QuickCaptureContext = {
  today: IsoDate
  projects: readonly Project[]
}

export type QuickCapture = {
  title: string
  tagNames: readonly string[]
  projectId: EntityId | null
  priority: Priority | null
  dueDate: IsoDate | null
}

type CaptureDraft = {
  titleWords: readonly string[]
  tagNames: readonly string[]
  projectId: EntityId | null
  priority: Priority | null
  dueDate: IsoDate | null
}

const WHITESPACE_PATTERN = /\s+/

const EMPTY_DRAFT: CaptureDraft = {
  titleWords: [],
  tagNames: [],
  projectId: null,
  priority: null,
  dueDate: null,
}

function withoutPrefix(token: string): string {
  return token.slice(1)
}

function keepAsTitle(draft: CaptureDraft, token: string): CaptureDraft {
  return { ...draft, titleWords: [...draft.titleWords, token] }
}

function applyToken(
  draft: CaptureDraft,
  token: string,
  context: QuickCaptureContext,
): CaptureDraft {
  if (token.startsWith(TAG_PREFIX) && withoutPrefix(token) !== '') {
    return { ...draft, tagNames: [...draft.tagNames, withoutPrefix(token)] }
  }

  if (token.startsWith(PROJECT_PREFIX) && draft.projectId === null) {
    const project = findProjectByToken(withoutPrefix(token), context.projects)

    if (project !== null) {
      return { ...draft, projectId: project.id }
    }
  }

  if (token.startsWith(PRIORITY_PREFIX) && draft.priority === null) {
    const priority = parsePriorityToken(withoutPrefix(token))

    if (priority !== null) {
      return { ...draft, priority }
    }
  }

  if (draft.dueDate === null) {
    const dueDate = parseDateToken(token, context.today)

    if (dueDate !== null) {
      return { ...draft, dueDate }
    }
  }

  return keepAsTitle(draft, token)
}

// Marcador que não casa com nada volta para o título em vez de sumir: o usuário precisa ver
// que "@gatewai" não virou vínculo nenhum.
export function parseQuickCapture(text: string, context: QuickCaptureContext): QuickCapture {
  const tokens = text.trim().split(WHITESPACE_PATTERN).filter((token) => token !== '')
  const draft = tokens.reduce(
    (current, token) => applyToken(current, token, context),
    EMPTY_DRAFT,
  )

  return {
    title: draft.titleWords.join(' '),
    tagNames: draft.tagNames,
    projectId: draft.projectId,
    priority: draft.priority,
    dueDate: draft.dueDate,
  }
}
