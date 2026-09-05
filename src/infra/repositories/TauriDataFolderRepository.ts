import { open } from '@tauri-apps/plugin-dialog'
import { readDir, stat } from '@tauri-apps/plugin-fs'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { PrumoError } from '@/domain/errors/PrumoError'
import type {
  DataFolderEntry,
  DataFolderRepository,
} from '@/domain/repositories/DataFolderRepository'

function joinPath(folderPath: string, name: string): string {
  const separator = folderPath.includes('\\') ? '\\' : '/'

  return folderPath.endsWith(separator)
    ? `${folderPath}${name}`
    : `${folderPath}${separator}${name}`
}

function compareEntries(first: DataFolderEntry, second: DataFolderEntry): number {
  if (first.kind !== second.kind) {
    return first.kind === 'directory' ? -1 : 1
  }

  return first.name.localeCompare(second.name, 'pt-BR')
}

async function countChildren(folderPath: string): Promise<number | null> {
  try {
    return (await readDir(folderPath)).length
  } catch {
    // Subpasta ilegível não deve derrubar a listagem inteira; a contagem sai vazia.
    return null
  }
}

async function describeEntry(
  folderPath: string,
  name: string,
  isDirectory: boolean,
): Promise<DataFolderEntry> {
  const fullPath = joinPath(folderPath, name)
  const metadata = await stat(fullPath)
  const modifiedAt = metadata.mtime === null ? null : metadata.mtime.toISOString()

  return {
    name,
    kind: isDirectory ? 'directory' : 'file',
    sizeBytes: isDirectory ? null : metadata.size,
    childCount: isDirectory ? await countChildren(fullPath) : null,
    modifiedAt,
  }
}

export class TauriDataFolderRepository implements DataFolderRepository {
  async listEntries(folderPath: string): Promise<DataFolderEntry[]> {
    try {
      const children = await readDir(folderPath)
      const entries = await Promise.all(
        children.map((child) => describeEntry(folderPath, child.name, child.isDirectory)),
      )

      return entries.toSorted(compareEntries)
    } catch (cause) {
      throw new PrumoError('DATA_FOLDER_UNREADABLE', `falha ao listar ${folderPath}`, { cause })
    }
  }

  async choose(currentPath: string | null): Promise<string | null> {
    const chosen = await open({
      directory: true,
      multiple: false,
      title: 'Escolher a pasta de dados do Prumo',
      defaultPath: currentPath ?? undefined,
    })

    return typeof chosen === 'string' ? chosen : null
  }

  async reveal(folderPath: string): Promise<void> {
    await revealItemInDir(folderPath)
  }
}
