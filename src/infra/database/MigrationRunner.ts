import { PrumoError } from '@/domain/errors/PrumoError'
import type { Migration } from './migrations/migrationList'
import { splitSqlStatements } from './splitSqlStatements'

const USER_VERSION_QUERY = 'PRAGMA user_version'

export type SqlRunner = {
  execute(query: string, values?: unknown[]): Promise<unknown>
  select<TRow>(query: string, values?: unknown[]): Promise<TRow[]>
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

// Sem transação de propósito: o pool do tauri-plugin-sql abre até 10 conexões e cada chamada pega
// uma delas, então BEGIN e ROLLBACK caem em conexões diferentes e não têm efeito — verificado.
async function applyMigration(runner: SqlRunner, migration: Migration): Promise<void> {
  const statements = splitSqlStatements(migration.sql)

  try {
    for (const statement of statements) {
      await runner.execute(statement)
    }

    await runner.execute(`${USER_VERSION_QUERY} = ${migration.version}`)
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
