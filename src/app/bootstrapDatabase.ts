import { toPublicMessage } from '@/domain/errors/PrumoError'
import { buildDatabaseUrl, openDatabase } from '@/infra/database/DatabaseConnection'
import { useDatabaseStore } from './stores/useDatabaseStore'

export async function bootstrapDatabase(dataFolderPath: string | null): Promise<void> {
  const { markOpening, markReady, markFailed } = useDatabaseStore.getState()

  markOpening()

  try {
    const schemaVersion = await openDatabase(buildDatabaseUrl(dataFolderPath))
    markReady(schemaVersion)
  } catch (cause) {
    console.error('Falha ao inicializar o banco do Prumo.', cause)
    markFailed(toPublicMessage(cause))
  }
}
