import { appConfigDir } from '@tauri-apps/api/path'
import { IS_RUNNING_IN_TAURI } from '@/infra/tauriRuntime'

export async function resolveDataFolderPath(): Promise<string | null> {
  if (!IS_RUNNING_IN_TAURI) {
    return null
  }

  try {
    return await appConfigDir()
  } catch (cause) {
    console.error('Não foi possível resolver a pasta de dados do Prumo.', cause)

    return null
  }
}
