import { mkdir, writeTextFile } from '@tauri-apps/plugin-fs'
import { PrumoError } from '@/domain/errors/PrumoError'
import { TABLES_IN_DEPENDENCY_ORDER } from './dataTables'
import type { SqlGateway } from './SqlGateway'

const EXPORT_FOLDER_NAME = 'export'

function joinPath(folderPath: string, name: string): string {
  const separator = folderPath.includes('\\') ? '\\' : '/'

  return folderPath.endsWith(separator) ? `${folderPath}${name}` : `${folderPath}${separator}${name}`
}

function buildFileName(now: Date): string {
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-')

  return `prumo-${stamp}.json`
}

export type ExportResult = {
  filePath: string
  rowCount: number
}

export async function exportAllTables(
  gateway: SqlGateway,
  folderPath: string,
): Promise<ExportResult> {
  const tables: Record<string, unknown[]> = {}
  let rowCount = 0

  for (const table of TABLES_IN_DEPENDENCY_ORDER) {
    const rows = await gateway.select<unknown[]>(`SELECT * FROM ${table}`)

    tables[table] = rows
    rowCount += rows.length
  }

  const dump = {
    exportedAt: new Date().toISOString(),
    application: 'Prumo',
    tables,
  }

  const exportFolder = joinPath(folderPath, EXPORT_FOLDER_NAME)
  const filePath = joinPath(exportFolder, buildFileName(new Date()))

  try {
    await mkdir(exportFolder, { recursive: true })
    await writeTextFile(filePath, JSON.stringify(dump, null, 2))
  } catch (cause) {
    throw new PrumoError('EXPORT_FAILED', `falha ao gravar ${filePath}`, { cause })
  }

  return { filePath, rowCount }
}
