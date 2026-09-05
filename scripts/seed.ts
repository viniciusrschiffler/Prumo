import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { splitSqlStatements } from '../src/infra/database/splitSqlStatements.ts'
import { buildNotes, buildSeedData } from './seed/seedData.ts'
import { createDateShifter, todayIsoDate } from './seed/seedDates.ts'

const APP_IDENTIFIER = 'com.prumo.app'
const DATABASE_FILE_NAME = 'prumo.db'
const NOTES_FOLDER_NAME = 'notas'
const SEED_MARKER_KEY = 'seeded_at'
const MIGRATIONS_DIRECTORY = fileURLToPath(
  new URL('../src/infra/database/migrations', import.meta.url),
)

function resolveDataFolder(): string {
  const roaming = process.env.APPDATA

  if (roaming !== undefined) {
    return join(roaming, APP_IDENTIFIER)
  }

  const home = process.env.HOME ?? process.cwd()

  return join(home, '.config', APP_IDENTIFIER)
}

function readExistingMarker(databasePath: string): string | null {
  if (!existsSync(databasePath)) {
    return null
  }

  const existing = new DatabaseSync(databasePath, { readOnly: true })

  try {
    const rows = existing
      .prepare('SELECT value FROM setting WHERE key = ?')
      .all(SEED_MARKER_KEY) as { value: string }[]

    return rows[0]?.value ?? null
  } catch {
    return null
  } finally {
    existing.close()
  }
}

function assertSafeToOverwrite(databasePath: string, force: boolean): void {
  if (!existsSync(databasePath) || force) {
    return
  }

  if (readExistingMarker(databasePath) !== null) {
    return
  }

  console.error(
    `O banco em ${databasePath} não foi criado por este seed e seria apagado.\n` +
      'Se for mesmo descartável, rode novamente com --force.',
  )
  process.exit(1)
}

function applyMigrations(database: DatabaseSync): number {
  const files = readdirSync(MIGRATIONS_DIRECTORY)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIRECTORY, file), 'utf8')

    for (const statement of splitSqlStatements(sql)) {
      database.exec(statement)
    }
  }

  const version = files.length

  database.exec(`PRAGMA user_version = ${version}`)

  return version
}

function insertSeedRows(database: DatabaseSync, shiftedToday: string): number {
  const shifter = createDateShifter(shiftedToday)
  const seeds = buildSeedData(shifter)
  let insertedRows = 0

  for (const seed of seeds) {
    const placeholders = seed.columns.map(() => '?').join(', ')
    const statement = database.prepare(
      `INSERT INTO ${seed.table} (${seed.columns.join(', ')}) VALUES (${placeholders})`,
    )

    for (const row of seed.rows) {
      statement.run(...(row as never[]))
      insertedRows += 1
    }
  }

  return insertedRows
}

function writeNotes(database: DatabaseSync, dataFolder: string, updatedAt: string): number {
  const notes = buildNotes()
  const noteStatement = database.prepare(
    'INSERT INTO note (path, project_id, project_event_id, updated_at) VALUES (?, ?, ?, ?)',
  )
  const searchStatement = database.prepare(
    'INSERT INTO note_search (path, content) VALUES (?, ?)',
  )

  mkdirSync(join(dataFolder, NOTES_FOLDER_NAME), { recursive: true })

  for (const note of notes) {
    writeFileSync(join(dataFolder, note.path), note.content, 'utf8')
    noteStatement.run(note.path, note.projectId, note.projectEventId, updatedAt)
    searchStatement.run(note.path, note.content)
  }

  return notes.length
}

function seed(): void {
  const force = process.argv.includes('--force')
  const dataFolder = resolveDataFolder()
  const databasePath = join(dataFolder, DATABASE_FILE_NAME)

  assertSafeToOverwrite(databasePath, force)

  mkdirSync(dataFolder, { recursive: true })

  for (const suffix of ['', '-wal', '-shm']) {
    rmSync(`${databasePath}${suffix}`, { force: true })
  }

  const database = new DatabaseSync(databasePath)

  database.exec('PRAGMA foreign_keys = ON')
  database.exec('PRAGMA journal_mode = WAL')

  const schemaVersion = applyMigrations(database)
  const today = todayIsoDate()
  const shifter = createDateShifter(today)

  database.exec('BEGIN')

  try {
    const insertedRows = insertSeedRows(database, today)
    const noteCount = writeNotes(database, dataFolder, `${today}T09:00:00Z`)

    database
      .prepare('INSERT INTO setting (key, value) VALUES (?, ?)')
      .run(SEED_MARKER_KEY, new Date().toISOString())

    database.exec('COMMIT')

    console.log(`Banco recriado em ${databasePath}`)
    console.log(`  schema v${schemaVersion} · ${insertedRows} linhas · ${noteCount} notas em ${NOTES_FOLDER_NAME}/`)
    console.log(`  hoje = ${today} · deslocamento de ${shifter.offsetDays} dia(s) sobre as datas do design`)
  } catch (cause) {
    database.exec('ROLLBACK')
    throw cause
  } finally {
    database.close()
  }
}

seed()
