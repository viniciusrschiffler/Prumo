const LINE_COMMENT_START = '--'
const BLOCK_COMMENT_START = '/*'
const BLOCK_COMMENT_END = '*/'
const QUOTE_CHARACTERS = new Set(["'", '"', '`'])
const TRIGGER_START_PATTERN = /^\s*CREATE\s+(?:TEMP\s+|TEMPORARY\s+)?TRIGGER\b/i
const TRIGGER_BODY_END_PATTERN = /\bEND\s*$/i

function readQuotedLiteral(sql: string, start: number): number {
  const quote = sql.charAt(start)
  let index = start + 1

  while (index < sql.length) {
    if (sql.charAt(index) !== quote) {
      index += 1
      continue
    }

    if (sql.charAt(index + 1) === quote) {
      index += 2
      continue
    }

    return index + 1
  }

  throw new Error(`Literal iniciado com ${quote} na posição ${start} não foi fechado.`)
}

function isStatementComplete(statement: string): boolean {
  if (!TRIGGER_START_PATTERN.test(statement)) {
    return true
  }

  return TRIGGER_BODY_END_PATTERN.test(statement)
}

export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let index = 0

  while (index < sql.length) {
    const remaining = sql.slice(index, index + 2)

    if (remaining === LINE_COMMENT_START) {
      const lineEnd = sql.indexOf('\n', index)
      index = lineEnd === -1 ? sql.length : lineEnd + 1
      continue
    }

    if (remaining === BLOCK_COMMENT_START) {
      const commentEnd = sql.indexOf(BLOCK_COMMENT_END, index + 2)
      index = commentEnd === -1 ? sql.length : commentEnd + BLOCK_COMMENT_END.length
      continue
    }

    const character = sql.charAt(index)

    if (QUOTE_CHARACTERS.has(character)) {
      const literalEnd = readQuotedLiteral(sql, index)
      current += sql.slice(index, literalEnd)
      index = literalEnd
      continue
    }

    if (character === ';' && isStatementComplete(current)) {
      const statement = current.trim()

      if (statement.length > 0) {
        statements.push(statement)
      }

      current = ''
      index += 1
      continue
    }

    current += character
    index += 1
  }

  const trailing = current.trim()

  if (trailing.length > 0) {
    statements.push(trailing)
  }

  return statements
}
