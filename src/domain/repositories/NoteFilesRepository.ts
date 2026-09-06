import type { NoteEntry } from '@/domain/notes/noteTree'

export type NoteFilesRepository = {
  listEntries(): Promise<NoteEntry[]>
  read(notePath: string): Promise<string>
  write(notePath: string, content: string): Promise<void>
  createFolder(folderPath: string): Promise<void>
}
