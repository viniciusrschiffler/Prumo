import type { Project } from '@/domain/schemas/projectSchema'
import { normalizeProjectDraft, type NewProjectDraft } from './newProject'

export type ProjectUpdate = {
  project: Project
  tagNames: readonly string[]
}

export type ProjectEditContext = {
  project: Project
  tagNames: readonly string[]
}

export function toProjectDraft(context: ProjectEditContext): NewProjectDraft {
  const { project } = context

  return {
    name: project.name,
    ownerPersonId: project.ownerPersonId,
    priority: project.priority,
    tagNames: context.tagNames,
    plannedStart: project.plannedStart,
    plannedEnd: project.plannedEnd,
    description: project.description,
  }
}

// A edição mexe no que o formulário pergunta, e só. Status, arquivamento e pausa têm ações
// próprias, com evento no histórico: deixá-los cair num formulário apagaria esse rastro.
export function buildProjectUpdate(project: Project, draft: NewProjectDraft): ProjectUpdate {
  const normalized = normalizeProjectDraft(draft)

  return {
    project: {
      ...project,
      name: normalized.name,
      description: normalized.description,
      priority: draft.priority,
      ownerPersonId: draft.ownerPersonId,
      plannedStart: draft.plannedStart,
      plannedEnd: draft.plannedEnd,
    },
    tagNames: normalized.tagNames,
  }
}
