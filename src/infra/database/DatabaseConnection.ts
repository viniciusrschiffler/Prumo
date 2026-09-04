import Database from '@tauri-apps/plugin-sql'
import { PrumoError } from '@/domain/errors/PrumoError'
import { executeBatch } from './executeBatch'
import { MIGRATION_LIST } from './migrations/migrationList'
import { runMigrations, type SqlRunner } from './MigrationRunner'

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

  const migrationRunner: SqlRunner = {
    select: (query, values) => database.select(query, values),
    executeBatch: (statements) => executeBatch(database.path, statements),
  }

  const schemaVersion = await runMigrations(migrationRunner, MIGRATION_LIST)
  openConnection = database

  return schemaVersion
}

export function getDatabase(): Database {
  if (openConnection === null) {
    throw new PrumoError('DATABASE_NOT_OPEN', 'getDatabase chamado antes de openDatabase')
  }

  return openConnection
}
