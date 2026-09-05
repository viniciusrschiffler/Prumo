import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'

export type ProjectEventRepository = {
  listAll(): Promise<ProjectEvent[]>
}
