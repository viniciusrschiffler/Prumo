import { writeExportFile } from '@/infra/files/writeExportFile'
import { TABLES_IN_DEPENDENCY_ORDER } from './dataTables'
import type { SqlGateway } from './SqlGateway'

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

  const filePath = await writeExportFile(
    folderPath,
    buildFileName(new Date()),
    JSON.stringify(dump, null, 2),
  )

  return { filePath, rowCount }
}
