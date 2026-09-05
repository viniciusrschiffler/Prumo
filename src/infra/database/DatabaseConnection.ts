import Database from '@tauri-apps/plugin-sql'
import { PrumoError } from '@/domain/errors/PrumoError'
import { createTauriSqlGateway } from './createTauriSqlGateway'
import { MIGRATION_LIST } from './migrations/migrationList'
import { runMigrations } from './MigrationRunner'
import type { SqlGateway } from './SqlGateway'

const DATABASE_FILE_NAME = 'prumo.db'
const CONNECTION_PRAGMAS = ['PRAGMA journal_mode = WAL', 'PRAGMA foreign_keys = ON']

let openConnection: Database | null = null
let openInProgress: Promise<number> | null = null

export function buildDatabaseUrl(dataFolderPath: string | null): string {
  if (dataFolderPath === null) {
    return `sqlite:${DATABASE_FILE_NAME}`
  }

  return `sqlite:${dataFolderPath}/${DATABASE_FILE_NAME}`
}

export function openDatabase(databaseUrl: string): Promise<number> {
  openInProgress ??= connectAndMigrate(databaseUrl)

  return openInProgress
}

// Trocar a pasta de dados exige soltar a conexão atual: o pool aponta para o arquivo antigo
// e o openInProgress memoizado devolveria justamente ele.
export async function closeDatabase(): Promise<void> {
  const database = openConnection

  openConnection = null
  openInProgress = null

  if (database !== null) {
    await database.close()
  }
}

async function connectAndMigrate(databaseUrl: string): Promise<number> {
  let database: Database

  try {
    database = await Database.load(databaseUrl)
  } catch (cause) {
    throw new PrumoError('DATABASE_OPEN_FAILED', `falha ao abrir ${databaseUrl}`, { cause })
  }

  for (const pragma of CONNECTION_PRAGMAS) {
    await database.execute(pragma)
  }

  const migrationGateway = createTauriSqlGateway(database)

  const schemaVersion = await runMigrations(migrationGateway, MIGRATION_LIST)
  openConnection = database

  return schemaVersion
}

export function getSqlGateway(): SqlGateway {
  return createTauriSqlGateway(getDatabase())
}

export function getDatabase(): Database {
  if (openConnection === null) {
    throw new PrumoError('DATABASE_NOT_OPEN', 'getDatabase chamado antes de openDatabase')
  }

  return openConnection
}
