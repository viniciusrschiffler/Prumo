import { PrumoError } from '@/domain/errors/PrumoError'
import type { BatchStatement } from './executeBatch'
import type { Migration } from './migrations/migrationList'
import { splitSqlStatements } from './splitSqlStatements'

const USER_VERSION_QUERY = 'PRAGMA user_version'

export type SqlRunner = {
  select<TRow>(query: string, values?: unknown[]): Promise<TRow[]>
  executeBatch(statements: readonly BatchStatement[]): Promise<number>
}

type UserVersionRow = {
  user_version: number
}

function assertUsableVersion(version: number): void {
  if (!Number.isInteger(version) || version < 1) {
    throw new PrumoError(
      'MIGRATION_FAILED',
      `versão de migração inválida: ${version}; esperado inteiro maior que zero`,
    )
  }
}

async function readUserVersion(runner: SqlRunner): Promise<number> {
  const rows = await runner.select<UserVersionRow>(USER_VERSION_QUERY)
  const version = rows[0]?.user_version

  if (typeof version !== 'number') {
    throw new PrumoError('MIGRATION_FAILED', 'PRAGMA user_version não devolveu um número')
  }

  return version
}

async function applyMigration(runner: SqlRunner, migration: Migration): Promise<void> {
  const statements = splitSqlStatements(migration.sql).map((query) => ({ query }))

  try {
    await runner.executeBatch([
      ...statements,
      { query: `${USER_VERSION_QUERY} = ${migration.version}` },
    ])
  } catch (cause) {
    throw new PrumoError(
      'MIGRATION_FAILED',
      `falha ao aplicar a migração ${migration.version}_${migration.name}`,
      { cause },
    )
  }
}

export async function runMigrations(
  runner: SqlRunner,
  migrations: readonly Migration[],
): Promise<number> {
  for (const migration of migrations) {
    assertUsableVersion(migration.version)
  }

  const currentVersion = await readUserVersion(runner)
  const latestVersion = migrations.reduce((latest, migration) => {
    return Math.max(latest, migration.version)
  }, 0)

  if (currentVersion > latestVersion) {
    throw new PrumoError(
      'MIGRATION_VERSION_AHEAD',
      `banco na versão ${currentVersion}, aplicação conhece até a ${latestVersion}`,
    )
  }

  const pending = migrations
    .filter((migration) => migration.version > currentVersion)
    .toSorted((first, second) => first.version - second.version)

  for (const migration of pending) {
    await applyMigration(runner, migration)
  }

  return latestVersion
}
