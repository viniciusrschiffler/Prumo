import type Database from '@tauri-apps/plugin-sql'
import { executeBatch } from './executeBatch'
import type { SqlGateway } from './SqlGateway'

export function createTauriSqlGateway(database: Database): SqlGateway {
  return {
    select: (query, values) =>
      database.select(query, values === undefined ? undefined : [...values]),
    executeBatch: (statements) => executeBatch(database.path, statements),
  }
}
