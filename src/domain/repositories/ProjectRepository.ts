import type { Project } from '@/domain/schemas/projectSchema'

export type ProjectRepository = {
  listAll(): Promise<Project[]>
}
