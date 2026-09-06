import type { Note } from '@/domain/schemas/noteSchema'

const WHITESPACE = /\s+/

export type NoteKind = 'event' | 'project' | 'personal'

export function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(WHITESPACE).length
}

export function countLines(text: string): number {
  return text === '' ? 0 : text.split('\n').length
}

// O selo do preview não é campo: nota ligada a evento é do tipo daquele evento, nota ligada
// só a projeto é nota de projeto, e o resto é nota pessoal.
export function deriveNoteKind(note: Note | null): NoteKind {
  if (note === null || note.projectId === null) {
    return 'personal'
  }

  return note.projectEventId === null ? 'project' : 'event'
}
