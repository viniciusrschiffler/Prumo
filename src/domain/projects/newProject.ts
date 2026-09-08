import type { Baseline } from '@/domain/schemas/baselineSchema'
import type { EntityId, IsoDate, IsoDateTime, Priority } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'

// O modal do design não pergunta status: todo projeto nasce em descoberta e muda pelas
// ações da tabela. A prioridade o modal pergunta, e sugere a do meio.
const INITIAL_STATUS = 'discovery'

export const SUGGESTED_PRIORITY: Priority = 'P2'
const FIRST_BASELINE_VERSION = 1
const FIRST_BASELINE_REASON = 'plano inicial'

export type NewProjectDraft = {
  name: string
  ownerPersonId: EntityId | null
  priority: Priority
  tagNames: readonly string[]
  plannedStart: IsoDate | null
  plannedEnd: IsoDate | null
  description: string | null
}

export type NewProjectIds = {
  projectId: EntityId
  baselineId: EntityId
}

export type NewProject = {
  project: Project
  baseline: Baseline
  tagNames: readonly string[]
}

export type NewProjectErrors = {
  name?: string
  plannedEnd?: string
}

export function validateNewProject(draft: NewProjectDraft): NewProjectErrors {
  const errors: NewProjectErrors = {}

  if (draft.name.trim() === '') {
    errors.name = 'Dê um nome ao projeto.'
  }

  if (
    draft.plannedStart !== null &&
    draft.plannedEnd !== null &&
    draft.plannedEnd < draft.plannedStart
  ) {
    errors.plannedEnd = 'O fim previsto não pode ser anterior ao início previsto.'
  }

  return errors
}

function normalizeDescription(description: string | null): string | null {
  const trimmed = description?.trim() ?? ''

  return trimmed === '' ? null : trimmed
}

export type NormalizedProjectFields = {
  name: string
  description: string | null
  tagNames: readonly string[]
}

// Criar e editar aparam o mesmo texto e descartam a mesma tag repetida. O formulário é um
// só, e duas normalizações sairiam de sincronia no primeiro campo novo.
export function normalizeProjectDraft(draft: NewProjectDraft): NormalizedProjectFields {
  return {
    name: draft.name.trim(),
    description: normalizeDescription(draft.description),
    tagNames: [...new Set(draft.tagNames.map((tag) => tag.trim()).filter((tag) => tag !== ''))],
  }
}

export function emptyProjectDraft(): NewProjectDraft {
  return {
    name: '',
    ownerPersonId: null,
    priority: SUGGESTED_PRIORITY,
    tagNames: [],
    plannedStart: null,
    plannedEnd: null,
    description: null,
  }
}

// A baseline v1 nasce junto com o projeto, sem baseline_task nenhuma: ele ainda não tem
// tarefa para congelar. O desvio começa nulo e passa a existir quando a primeira entrar.
export function buildNewProject(
  draft: NewProjectDraft,
  ids: NewProjectIds,
  now: IsoDateTime,
): NewProject {
  const normalized = normalizeProjectDraft(draft)

  return {
    project: {
      id: ids.projectId,
      name: normalized.name,
      description: normalized.description,
      status: INITIAL_STATUS,
      priority: draft.priority,
      ownerPersonId: draft.ownerPersonId,
      plannedStart: draft.plannedStart,
      plannedEnd: draft.plannedEnd,
      createdAt: now,
      archivedAt: null,
      pausedAt: null,
    },
    baseline: {
      id: ids.baselineId,
      projectId: ids.projectId,
      version: FIRST_BASELINE_VERSION,
      createdAt: now,
      reason: FIRST_BASELINE_REASON,
    },
    tagNames: normalized.tagNames,
  }
}
