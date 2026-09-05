import { exists } from '@tauri-apps/plugin-fs'
import type { IntegrityReport } from '@/domain/integrity/integrityReport'
import type { SqlGateway } from './SqlGateway'

const INTEGRITY_CHECK = 'PRAGMA integrity_check'
const FOREIGN_KEY_CHECK = 'PRAGMA foreign_key_check'
const SELECT_NOTE_PATHS = 'SELECT path FROM note'

type IntegrityRow = { integrity_check: string }
type ForeignKeyRow = { table: string; rowid: number | null; parent: string }
type NoteRow = { path: string }

function joinPath(folderPath: string, name: string): string {
  const separator = folderPath.includes('\\') ? '\\' : '/'

  return folderPath.endsWith(separator) ? `${folderPath}${name}` : `${folderPath}${separator}${name}`
}

async function findMissingNotes(
  gateway: SqlGateway,
  folderPath: string | null,
): Promise<string[]> {
  if (folderPath === null) {
    return []
  }

  const rows = await gateway.select<NoteRow[]>(SELECT_NOTE_PATHS)
  const missing: string[] = []

  for (const row of rows) {
    if (!(await exists(joinPath(folderPath, row.path)))) {
      missing.push(`a nota ${row.path} está no banco mas não está no disco`)
    }
  }

  return missing
}

export async function runIntegrityCheck(
  gateway: SqlGateway,
  folderPath: string | null,
): Promise<IntegrityReport> {
  const problems: string[] = []

  const integrityRows = await gateway.select<IntegrityRow[]>(INTEGRITY_CHECK)

  for (const row of integrityRows) {
    if (row.integrity_check !== 'ok') {
      problems.push(`o banco relatou "${row.integrity_check}"`)
    }
  }

  const foreignKeyRows = await gateway.select<ForeignKeyRow[]>(FOREIGN_KEY_CHECK)

  for (const row of foreignKeyRows) {
    problems.push(`${row.table} aponta para ${row.parent} que não existe`)
  }

  problems.push(...(await findMissingNotes(gateway, folderPath)))

  return { checkedAt: new Date().toISOString(), problems }
}
