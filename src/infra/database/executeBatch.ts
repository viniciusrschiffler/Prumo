import { invoke } from '@tauri-apps/api/core'
import { PrumoError } from '@/domain/errors/PrumoError'
import type { BatchStatement } from './SqlGateway'

const EXECUTE_BATCH_COMMAND = 'execute_batch'

export async function executeBatch(
  databasePath: string,
  statements: readonly BatchStatement[],
): Promise<number> {
  if (statements.length === 0) {
    return 0
  }

  try {
    return await invoke<number>(EXECUTE_BATCH_COMMAND, {
      db: databasePath,
      statements: statements.map((statement) => ({
        query: statement.query,
        values: statement.values ?? [],
      })),
    })
  } catch (cause) {
    throw new PrumoError(
      'TRANSACTION_FAILED',
      `falha ao executar lote de ${statements.length} instruções`,
      { cause },
    )
  }
}
