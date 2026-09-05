import type { ProjectTag, Tag } from '@/domain/schemas/tagSchema'

export type TagRepository = {
  listAll(): Promise<Tag[]>
  listProjectTags(): Promise<ProjectTag[]>
}
