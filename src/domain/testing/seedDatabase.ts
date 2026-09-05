import { DatabaseSync } from 'node:sqlite'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildNotes, buildSeedData } from '../../../scripts/seed/seedData.ts'
import { createDateShifter, DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import { splitSqlStatements } from '@/infra/database/splitSqlStatements'

const MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('../../infra/database/migrations', import.meta.url),
)

// Sem deslocamento: as datas ficam iguais às do design, então os números são comparáveis.
export function openSeedDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:')

  database.exec('PRAGMA foreign_keys = ON')

  const migrations = readdirSync(MIGRATIONS_DIRECTORY)
    .filter((name) => name.endsWith('.sql'))
    .sort()

  for (const file of migrations) {
    for (const statement of splitSqlStatements(
      readFileSync(join(MIGRATIONS_DIRECTORY, file), 'utf8'),
    )) {
      database.exec(statement)
    }
  }

  for (const seed of buildSeedData(createDateShifter(DESIGN_TODAY))) {
    const placeholders = seed.columns.map(() => '?').join(', ')
    const statement = database.prepare(
      `INSERT INTO ${seed.table} (${seed.columns.join(', ')}) VALUES (${placeholders})`,
    )

    for (const row of seed.rows) {
      statement.run(...(row as never[]))
    }
  }

  // A nota vive num arquivo markdown fora do banco; aqui só a linha que a indexa importa.
  const noteStatement = database.prepare(
    'INSERT INTO note (path, project_id, project_event_id, updated_at) VALUES (?, ?, ?, ?)',
  )

  for (const note of buildNotes()) {
    noteStatement.run(note.path, note.projectId, note.projectEventId, `${DESIGN_TODAY}T09:00:00Z`)
  }

  return database
}
