import type { Note } from '@/domain/schemas/noteSchema'

export type NoteRepository = {
  listAll(): Promise<Note[]>
}
