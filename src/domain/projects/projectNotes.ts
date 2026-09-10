import { noteBaseName, noteFolderOf } from '@/domain/notes/notePath'
import type { Note } from '@/domain/schemas/noteSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'

export type ProjectNoteCard = {
  path: string
  title: string
  folderPath: string
  updatedAt: Note['updatedAt']
  event: ProjectEvent | null
}

// O título do cartão é o nome do arquivo, não o primeiro `#` do documento: a aba lista o que
// a tabela `note` liga ao projeto, e ler cada `.md` do disco para montar uma aba do projeto
// custaria uma varredura da pasta a cada troca de aba.
export function listProjectNoteCards(
  notes: readonly Note[],
  events: readonly ProjectEvent[],
  projectId: EntityId,
): ProjectNoteCard[] {
  const eventsById = new Map(events.map((event) => [event.id, event]))

  return notes
    .filter((note) => note.projectId === projectId)
    .map((note) => ({
      path: note.path,
      title: noteBaseName(note.path),
      folderPath: noteFolderOf(note.path),
      updatedAt: note.updatedAt,
      event: note.projectEventId === null ? null : eventsById.get(note.projectEventId) ?? null,
    }))
    .toSorted((first, second) => second.updatedAt.localeCompare(first.updatedAt))
}
