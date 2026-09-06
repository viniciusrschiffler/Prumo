const TOKEN_SEPARATOR = /\s+/
const QUOTE = /"/g

// O texto digitado não pode ir cru para o MATCH: aspas soltas e operadores do FTS5 derrubam a
// consulta com erro de sintaxe. Cada palavra vai entre aspas, e a última ganha o prefixo para
// a busca responder enquanto o usuário ainda digita.
export function toFtsQuery(text: string): string | null {
  const tokens = text
    .trim()
    .split(TOKEN_SEPARATOR)
    .map((token) => token.replace(QUOTE, ''))
    .filter((token) => token !== '')

  if (tokens.length === 0) {
    return null
  }

  return tokens
    .map((token, index) => (index === tokens.length - 1 ? `"${token}"*` : `"${token}"`))
    .join(' ')
}
