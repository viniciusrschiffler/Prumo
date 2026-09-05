import { BaseDirectory, exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

// O caminho da pasta de dados não pode morar no setting: é ele que localiza o banco onde a
// tabela setting vive. Fica num arquivo de uma linha na pasta de configuração do app.
const POINTER_FILE_NAME = 'data-folder.txt'

export async function readDataFolderPointer(): Promise<string | null> {
  if (!(await exists(POINTER_FILE_NAME, { baseDir: BaseDirectory.AppConfig }))) {
    return null
  }

  const stored = (await readTextFile(POINTER_FILE_NAME, { baseDir: BaseDirectory.AppConfig })).trim()

  return stored === '' ? null : stored
}

export async function writeDataFolderPointer(folderPath: string): Promise<void> {
  await writeTextFile(POINTER_FILE_NAME, folderPath, { baseDir: BaseDirectory.AppConfig })
}
