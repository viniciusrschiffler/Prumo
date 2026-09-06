import type { Note } from '@/domain/schemas/noteSchema'
import type { EntityId, IsoDateTime } from '@/domain/schemas/primitives'

export type NoteLink = {
  path: string
  projectId: EntityId | null
  projectEventId: EntityId | null
  updatedAt: IsoDateTime
}

export type NoteContent = {
  path: string
  content: string
  updatedAt: IsoDateTime
}

export type NoteRepository = {
  listAll(): Promise<Note[]>
  // A `note_search` não tem gatilho, ao contrário da busca de eventos: quem a mantém em dia é
  // esta gravação, no mesmo lote da linha da nota.
  saveContent(content: NoteContent): Promise<void>
  setLinks(link: NoteLink): Promise<void>
  remove(path: string): Promise<void>
  searchPaths(ftsQuery: string): Promise<string[]>
}
