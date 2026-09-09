import { DatabaseSync } from 'node:sqlite'
import { beforeEach, describe, expect, it } from 'vitest'
import { runMigrations } from '@/infra/database/MigrationRunner'
import type { BatchStatement, SqlGateway } from '@/infra/database/SqlGateway'
import { splitSqlStatements } from '@/infra/database/splitSqlStatements'
import { MIGRATION_LIST } from './migrationList'

const REBUILD_MIGRATION_VERSION = 3

let database: DatabaseSync
let gateway: SqlGateway

// O lote precisa rodar em transação, como o execute_batch faz em produção: é dentro dela que
// PRAGMA foreign_keys é ignorado, que é justamente a restrição que a migração 003 contorna.
function createGateway(instance: DatabaseSync): SqlGateway {
  return {
    select: async <TRows>(query: string, values?: readonly unknown[]) =>
      instance.prepare(query).all(...((values ?? []) as never[])) as TRows,
    executeBatch: async (statements: readonly BatchStatement[]) => {
      instance.exec('BEGIN')

      try {
        for (const statement of statements) {
          instance.prepare(statement.query).run(...((statement.values ?? []) as never[]))
        }

        instance.exec('COMMIT')

        return statements.length
      } catch (cause) {
        instance.exec('ROLLBACK')
        throw cause
      }
    },
  }
}

function applyUpTo(version: number): void {
  for (const migration of MIGRATION_LIST.filter((entry) => entry.version <= version)) {
    for (const statement of splitSqlStatements(migration.sql)) {
      database.exec(statement)
    }
  }

  database.exec(`PRAGMA user_version = ${version}`)
}

function insertHistory(): void {
  database.exec(`
    INSERT INTO project (id, name, status, priority, created_at)
    VALUES ('gateway', 'Migração do gateway', 'active', 'P1', '2026-02-20T09:00:00Z');

    INSERT INTO task (id, project_id, phase_id, title, status)
    VALUES ('gw-cut', 'gateway', 'production', 'Cutover em produção', 'todo');

    INSERT INTO project_event (id, project_id, type, event_date, title, body_md, created_at)
    VALUES ('ev-scope', 'gateway', 'scope_change', '2026-08-12', 'Conciliação entra no escopo',
            'Financeiro precisa de conciliação automática.', '2026-08-12T10:30:00Z');

    INSERT INTO project_event_task (project_event_id, task_id) VALUES ('ev-scope', 'gw-cut');

    INSERT INTO note (path, project_id, project_event_id, updated_at)
    VALUES ('notas/escopo.md', 'gateway', 'ev-scope', '2026-08-12T10:30:00Z');
  `)
}

beforeEach(() => {
  database = new DatabaseSync(':memory:')
  database.exec('PRAGMA foreign_keys = ON')
  gateway = createGateway(database)
})

describe('Migração 003, que reconstrói project_event', () => {
  beforeEach(async () => {
    applyUpTo(REBUILD_MIGRATION_VERSION - 1)
    insertHistory()

    await runMigrations(gateway, MIGRATION_LIST)
  })

  it('Should reach the version the list declares', () => {
    expect(database.prepare('PRAGMA user_version').get()).toEqual({
      user_version: MIGRATION_LIST.length,
    })
  })

  it('Should accept the replan type the drag on the Timeline writes', () => {
    database.exec(`
      INSERT INTO project_event (id, project_id, type, event_date, title, created_at)
      VALUES ('ev-replan', 'gateway', 'replan', '2026-09-05', 'Replanejamento: Cutover',
              '2026-09-05T12:00:00Z')
    `)

    expect(
      database.prepare("SELECT type FROM project_event WHERE id = 'ev-replan'").get(),
    ).toEqual({ type: 'replan' })
  })

  it('Should still refuse a type outside the catalogue', () => {
    expect(() =>
      database.exec(`
        INSERT INTO project_event (id, project_id, type, event_date, title, created_at)
        VALUES ('ev-torto', 'gateway', 'inventado', '2026-09-05', 'Torto', '2026-09-05T12:00:00Z')
      `),
    ).toThrow()
  })

  it('Should keep every row of the tables that reference the rebuilt one', () => {
    expect(database.prepare('SELECT * FROM project_event_task').all()).toEqual([
      { project_event_id: 'ev-scope', task_id: 'gw-cut' },
    ])
    expect(
      database.prepare("SELECT project_event_id FROM note WHERE path = 'notas/escopo.md'").get(),
    ).toEqual({ project_event_id: 'ev-scope' })
  })

  it('Should leave no dangling foreign key behind', () => {
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  })

  it('Should keep cascading from the rebuilt table to its children', () => {
    database.exec("DELETE FROM project_event WHERE id = 'ev-scope'")

    expect(database.prepare('SELECT * FROM project_event_task').all()).toEqual([])
  })

  it('Should keep the full text index pointing at the right row', () => {
    const found = database
      .prepare(
        `SELECT project_event.id
         FROM project_event_search
         JOIN project_event ON project_event.rowid = project_event_search.rowid
         WHERE project_event_search MATCH 'conciliação'`,
      )
      .all()

    expect(found).toEqual([{ id: 'ev-scope' }])
  })

  it('Should open the paused_at column that the Timeline hatches from', () => {
    database.exec("UPDATE project SET paused_at = '2026-08-28T16:00:00Z' WHERE id = 'gateway'")

    expect(database.prepare("SELECT paused_at FROM project WHERE id = 'gateway'").get()).toEqual({
      paused_at: '2026-08-28T16:00:00Z',
    })
  })
})

const TODO_MIGRATION_VERSION = 4

function insertTodoHistory(): void {
  database.exec(`
    INSERT INTO tag (id, name) VALUES ('tag-1', 'pagamentos');

    INSERT INTO todo (id, title, due_date, priority, status)
    VALUES ('td-escopo', 'Fechar escopo', '2026-09-03', 'P1', 'open');

    INSERT INTO todo_tag (todo_id, tag_id) VALUES ('td-escopo', 'tag-1');
  `)
}

describe('Migração 004, que reconstrói todo', () => {
  beforeEach(async () => {
    applyUpTo(TODO_MIGRATION_VERSION - 1)
    insertTodoHistory()

    await runMigrations(gateway, MIGRATION_LIST)
  })

  it('Should accept the two statuses the Kanban added', () => {
    database.exec("UPDATE todo SET status = 'in_progress' WHERE id = 'td-escopo'")
    expect(database.prepare("SELECT status FROM todo WHERE id = 'td-escopo'").get()).toEqual({
      status: 'in_progress',
    })

    database.exec("UPDATE todo SET status = 'blocked' WHERE id = 'td-escopo'")
    expect(database.prepare("SELECT status FROM todo WHERE id = 'td-escopo'").get()).toEqual({
      status: 'blocked',
    })
  })

  it('Should still refuse a status outside the catalogue', () => {
    expect(() =>
      database.exec("UPDATE todo SET status = 'inventado' WHERE id = 'td-escopo'"),
    ).toThrow()
  })

  // Dropar `todo` com a chave estrangeira ligada dispararia o CASCADE de todo_tag, e o vínculo
  // com a tag sumiria sem aviso.
  it('Should keep the tag links the rebuilt table cascades from', () => {
    expect(database.prepare('SELECT * FROM todo_tag').all()).toEqual([
      { todo_id: 'td-escopo', tag_id: 'tag-1' },
    ])

    database.exec("DELETE FROM todo WHERE id = 'td-escopo'")

    expect(database.prepare('SELECT * FROM todo_tag').all()).toEqual([])
  })

  it('Should still refuse a completion time outside the done status', () => {
    expect(() =>
      database.exec(
        "UPDATE todo SET completed_at = '2026-09-03T12:00:00Z' WHERE id = 'td-escopo'",
      ),
    ).toThrow()
  })

  it('Should leave no dangling foreign key behind', () => {
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  })
})
