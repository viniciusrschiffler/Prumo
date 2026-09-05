import type { NewProject } from '@/domain/projects/newProject'
import type { EntityId } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'

// A tag é única por nome. O id viaja junto porque a criação acontece num lote só, sem
// leitura no meio: ele é gravado quando o nome é novo e descartado quando já existe.
export type NewProjectTag = {
  id: EntityId
  name: string
}

export type ProjectRepository = {
  listAll(): Promise<Project[]>
  create(newProject: NewProject, tags: readonly NewProjectTag[]): Promise<void>
}
