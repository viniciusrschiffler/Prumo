import { beforeEach, describe, expect, it, vi } from 'vitest'

const writeTextFile = vi.fn<(path: string, contents: string) => Promise<void>>()
const mkdir = vi.fn<(path: string, options: unknown) => Promise<void>>()
const resolveDataFolderPath = vi.fn<() => Promise<string | null>>()

vi.mock('@tauri-apps/plugin-fs', () => ({
  mkdir: (path: string, options: unknown) => mkdir(path, options),
  writeTextFile: (path: string, contents: string) => writeTextFile(path, contents),
}))

vi.mock('@/infra/config/resolveDataFolderPath', () => ({
  resolveDataFolderPath: () => resolveDataFolderPath(),
}))

const { useSettingsStore } = await import('./useSettingsStore')
const { useDataFolderStore } = await import('./useDataFolderStore')

const DATA_FOLDER = '/Users/tech/Documentos/prumo'

beforeEach(() => {
  vi.clearAllMocks()
  mkdir.mockResolvedValue(undefined)
  writeTextFile.mockResolvedValue(undefined)
  resolveDataFolderPath.mockResolvedValue(DATA_FOLDER)
  useSettingsStore.setState({ dataFolderPath: null })
  useDataFolderStore.setState({ path: null })
})

describe('exportCsv', () => {
  // A exportação dos Painéis é pedida sem passar pela tela de Configurações, que é a única a
  // chamar o `load` que preenche a cópia local da pasta de dados.
  it('Should write the file even though the settings screen was never opened', async () => {
    useDataFolderStore.setState({ path: DATA_FOLDER })

    const filePath = await useSettingsStore.getState().exportCsv('paineis.csv', 'secao,item')

    expect(writeTextFile).toHaveBeenCalledWith(
      '/Users/tech/Documentos/prumo/export/paineis.csv',
      'secao,item',
    )
    expect(filePath).toBe('/Users/tech/Documentos/prumo/export/paineis.csv')
  })

  it('Should resolve the data folder when nobody has resolved it yet', async () => {
    const filePath = await useSettingsStore.getState().exportCsv('paineis.csv', 'secao,item')

    expect(resolveDataFolderPath).toHaveBeenCalled()
    expect(filePath).toBe('/Users/tech/Documentos/prumo/export/paineis.csv')
  })

  it('Should refuse with a public message when there is no data folder at all', async () => {
    resolveDataFolderPath.mockResolvedValue(null)

    await expect(
      useSettingsStore.getState().exportCsv('paineis.csv', 'secao,item'),
    ).rejects.toMatchObject({ code: 'EXPORT_FAILED' })
    expect(writeTextFile).not.toHaveBeenCalled()
  })

  it('Should create the export folder before writing into it', async () => {
    useDataFolderStore.setState({ path: DATA_FOLDER })

    await useSettingsStore.getState().exportCsv('paineis.csv', 'secao,item')

    expect(mkdir).toHaveBeenCalledWith('/Users/tech/Documentos/prumo/export', { recursive: true })
  })
})
