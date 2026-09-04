import { DatabaseSync } from 'node:sqlite'
import { MIGRATION_LIST } from '@/infra/database/migrations/migrationList'
import type { BatchStatement, SqlGateway } from '@/infra/database/SqlGateway'
import { splitSqlStatements } from '@/infra/database/splitSqlStatements'

function toBindableValues(values: readonly unknown[] | undefined): never[] {
  return (values ?? []).map((value) => (typeof value === 'boolean' ? Number(value) : value)) as never[]
}

export function createInMemoryGateway(): SqlGateway {
  const database = new DatabaseSync(':memory:')

  database.exec('PRAGMA foreign_keys = ON')

  for (const migration of MIGRATION_LIST) {
    for (const statement of splitSqlStatements(migration.sql)) {
      database.exec(statement)
    }
  }

  async function select<TRows>(query: string, values?: readonly unknown[]): Promise<TRows> {
    return database.prepare(query).all(...toBindableValues(values)) as TRows
  }

  async function executeBatch(statements: readonly BatchStatement[]): Promise<number> {
    database.exec('BEGIN')

    try {
      let affectedRows = 0

      for (const statement of statements) {
        const result = database.prepare(statement.query).run(...toBindableValues(statement.values))
        affectedRows += Number(result.changes)
      }

      database.exec('COMMIT')

      return affectedRows
    } catch (cause) {
      database.exec('ROLLBACK')
      throw cause
    }
  }

  return { select, executeBatch }
}
