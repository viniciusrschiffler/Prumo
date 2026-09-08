import { mkdir, writeTextFile } from '@tauri-apps/plugin-fs'
import { PrumoError } from '@/domain/errors/PrumoError'

const EXPORT_FOLDER_NAME = 'export'

export function joinPath(folderPath: string, name: string): string {
  const separator = folderPath.includes('\\') ? '\\' : '/'

  return folderPath.endsWith(separator) ? `${folderPath}${name}` : `${folderPath}${separator}${name}`
}

export async function writeExportFile(
  folderPath: string,
  fileName: string,
  contents: string,
): Promise<string> {
  const exportFolder = joinPath(folderPath, EXPORT_FOLDER_NAME)
  const filePath = joinPath(exportFolder, fileName)

  try {
    await mkdir(exportFolder, { recursive: true })
    await writeTextFile(filePath, contents)
  } catch (cause) {
    throw new PrumoError('EXPORT_FAILED', `falha ao gravar ${filePath}`, { cause })
  }

  return filePath
}
