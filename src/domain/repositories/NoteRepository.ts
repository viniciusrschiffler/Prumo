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
  // Apagar pasta tira várias notas de uma vez, e as linhas somem no mesmo lote do índice:
  // meia exclusão deixaria a busca apontando para arquivo que não existe mais.
  removeAll(paths: readonly string[]): Promise<void>
  searchPaths(ftsQuery: string): Promise<string[]>
}
