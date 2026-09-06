import { mkdir, readDir, readTextFile, stat, writeTextFile } from '@tauri-apps/plugin-fs'
import { PrumoError } from '@/domain/errors/PrumoError'
import { isMarkdownPath, joinNotePath, NOTES_ROOT } from '@/domain/notes/notePath'
import type { NoteEntry } from '@/domain/notes/noteTree'
import type { NoteFilesRepository } from '@/domain/repositories/NoteFilesRepository'

const HIDDEN_PREFIX = '.'

function toSystemPath(dataFolderPath: string, notePath: string): string {
  const separator = dataFolderPath.includes('\\') ? '\\' : '/'
  const relative = notePath.split('/').join(separator)
  const base = dataFolderPath.endsWith(separator)
    ? dataFolderPath.slice(0, -separator.length)
    : dataFolderPath

  return `${base}${separator}${relative}`
}

function folderOf(notePath: string): string {
  return notePath.split('/').slice(0, -1).join('/')
}

export class TauriNoteFilesRepository implements NoteFilesRepository {
  readonly #dataFolderPath: string

  constructor(dataFolderPath: string) {
    this.#dataFolderPath = dataFolderPath
  }

  async listEntries(): Promise<NoteEntry[]> {
    try {
      await mkdir(this.#toSystem(NOTES_ROOT), { recursive: true })

      return await this.#walk(NOTES_ROOT)
    } catch (cause) {
      throw new PrumoError(
        'NOTES_FOLDER_UNREADABLE',
        `falha ao listar ${this.#toSystem(NOTES_ROOT)}`,
        { cause },
      )
    }
  }

  async read(notePath: string): Promise<string> {
    try {
      return await readTextFile(this.#toSystem(notePath))
    } catch (cause) {
      throw new PrumoError('NOTE_READ_FAILED', `falha ao ler ${notePath}`, { cause })
    }
  }

  async write(notePath: string, content: string): Promise<void> {
    try {
      await mkdir(this.#toSystem(folderOf(notePath)), { recursive: true })
      await writeTextFile(this.#toSystem(notePath), content)
    } catch (cause) {
      throw new PrumoError('NOTE_WRITE_FAILED', `falha ao gravar ${notePath}`, { cause })
    }
  }

  #toSystem(notePath: string): string {
    return toSystemPath(this.#dataFolderPath, notePath)
  }

  // O `readDir` do plugin não desce sozinho, então a varredura é manual. O arquivo que não é
  // `.md` fica de fora da árvore: a tela edita markdown, e listar o resto prometeria abri-lo.
  async #walk(folderPath: string): Promise<NoteEntry[]> {
    const children = await readDir(this.#toSystem(folderPath))
    const entries: NoteEntry[] = []

    for (const child of children) {
      if (child.name.startsWith(HIDDEN_PREFIX)) {
        continue
      }

      const childPath = joinNotePath(folderPath, child.name)

      if (child.isDirectory) {
        entries.push({ path: childPath, kind: 'folder', sizeBytes: null, modifiedAt: null })
        entries.push(...(await this.#walk(childPath)))
        continue
      }

      if (!isMarkdownPath(childPath)) {
        continue
      }

      const metadata = await stat(this.#toSystem(childPath))

      entries.push({
        path: childPath,
        kind: 'file',
        sizeBytes: metadata.size,
        modifiedAt: metadata.mtime === null ? null : metadata.mtime.toISOString(),
      })
    }

    return entries
  }
}
