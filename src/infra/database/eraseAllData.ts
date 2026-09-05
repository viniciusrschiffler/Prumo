import seedDefaultPhases from './migrations/002_seed_default_phases.sql?raw'
import { TABLES_IN_DEPENDENCY_ORDER } from './dataTables'
import type { BatchStatement, SqlGateway } from './SqlGateway'
import { splitSqlStatements } from './splitSqlStatements'

// O índice de busca das notas não é apagado por gatilho, ao contrário do de eventos, que
// é content-backed e some junto com a linha de project_event.
const STANDALONE_SEARCH_TABLES = ['note_search']

export async function eraseAllData(gateway: SqlGateway): Promise<number> {
  const deletions: BatchStatement[] = [
    ...TABLES_IN_DEPENDENCY_ORDER.toReversed().map((table) => ({
      query: `DELETE FROM ${table}`,
    })),
    ...STANDALONE_SEARCH_TABLES.map((table) => ({ query: `DELETE FROM ${table}` })),
  ]

  const reseed = splitSqlStatements(seedDefaultPhases).map((query) => ({ query }))

  return gateway.executeBatch([...deletions, ...reseed])
}
