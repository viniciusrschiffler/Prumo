import type { ProjectEvent, ProjectEventTask } from '@/domain/schemas/projectEventSchema'

export type ProjectEventRepository = {
  listAll(): Promise<ProjectEvent[]>
  listEventTasks(): Promise<ProjectEventTask[]>
  create(event: ProjectEvent): Promise<void>
}
