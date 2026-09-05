import { appConfigDir } from '@tauri-apps/api/path'
import { IS_RUNNING_IN_TAURI } from '@/infra/tauriRuntime'
import { readDataFolderPointer } from './dataFolderPointer'

export async function resolveDataFolderPath(): Promise<string | null> {
  if (!IS_RUNNING_IN_TAURI) {
    return null
  }

  try {
    return (await readDataFolderPointer()) ?? (await appConfigDir())
  } catch (cause) {
    console.error('Não foi possível resolver a pasta de dados do Prumo.', cause)

    return null
  }
}

export async function resolveDefaultDataFolderPath(): Promise<string | null> {
  if (!IS_RUNNING_IN_TAURI) {
    return null
  }

  try {
    return await appConfigDir()
  } catch (cause) {
    console.error('Não foi possível resolver a pasta de configuração do Prumo.', cause)

    return null
  }
}
