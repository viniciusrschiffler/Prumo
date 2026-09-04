import { describe, expect, it } from 'vitest'
import { splitSqlStatements } from './splitSqlStatements'

describe('splitSqlStatements', () => {
  it('Should separate simple statements and drop the empty tail', () => {
    const statements = splitSqlStatements('CREATE TABLE a (id TEXT); CREATE TABLE b (id TEXT);')

    expect(statements).toEqual(['CREATE TABLE a (id TEXT)', 'CREATE TABLE b (id TEXT)'])
  })

  it('Should keep a trigger body whole despite its inner semicolons', () => {
    const sql = `
      CREATE TRIGGER search_after_update AFTER UPDATE ON project_event BEGIN
        INSERT INTO project_event_search VALUES ('delete', old.rowid);
        INSERT INTO project_event_search VALUES (new.rowid, new.title);
      END;
      CREATE INDEX idx_a ON project_event (project_id);
    `

    const statements = splitSqlStatements(sql)

    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('END')
    expect(statements[0]?.match(/INSERT INTO/g)).toHaveLength(2)
    expect(statements[1]).toBe('CREATE INDEX idx_a ON project_event (project_id)')
  })

  it('Should not split on a semicolon inside a string literal', () => {
    const statements = splitSqlStatements("INSERT INTO setting VALUES ('a', 'x; y'); SELECT 1;")

    expect(statements).toEqual(["INSERT INTO setting VALUES ('a', 'x; y')", 'SELECT 1'])
  })

  it('Should preserve an escaped quote inside a string literal', () => {
    const statements = splitSqlStatements("INSERT INTO tag VALUES ('d''água');")

    expect(statements).toEqual(["INSERT INTO tag VALUES ('d''água')"])
  })

  it('Should drop line and block comments', () => {
    const sql = `
      -- cria a tabela; com ponto e vírgula no comentário
      CREATE TABLE a (id TEXT);
      /* bloco; também com ponto e vírgula */
      CREATE TABLE b (id TEXT);
    `

    const statements = splitSqlStatements(sql)

    expect(statements).toEqual(['CREATE TABLE a (id TEXT)', 'CREATE TABLE b (id TEXT)'])
  })

  it('Should accept a final statement without a trailing semicolon', () => {
    expect(splitSqlStatements('SELECT 1')).toEqual(['SELECT 1'])
  })

  it('Should reject an unterminated string literal', () => {
    expect(() => splitSqlStatements("INSERT INTO tag VALUES ('aberta")).toThrow(/não foi fechado/)
  })
})
