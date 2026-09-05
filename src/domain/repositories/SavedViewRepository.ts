import type { SavedView, Screen } from '@/domain/schemas/savedViewSchema'

export type SavedViewRepository = {
  listByScreen(screen: Screen): Promise<SavedView[]>
}
