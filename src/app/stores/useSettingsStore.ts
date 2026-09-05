import { create } from 'zustand'
import { bootstrapDatabase } from '@/app/bootstrapDatabase'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { DataFolderEntry } from '@/domain/repositories/DataFolderRepository'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import {
  APP_SETTING_DEFAULTS,
  parseAppSettings,
  serializeAppSetting,
  type AppSettingField,
  type AppSettings,
} from '@/domain/settings/appSettings'
import { writeDataFolderPointer } from '@/infra/config/dataFolderPointer'
import { closeDatabase, getSqlGateway } from '@/infra/database/DatabaseConnection'
import { SqliteAllocationRepository } from '@/infra/repositories/SqliteAllocationRepository'
import { SqlitePersonRepository } from '@/infra/repositories/SqlitePersonRepository'
import { SqlitePhaseRepository } from '@/infra/repositories/SqlitePhaseRepository'
import { SqliteSettingRepository } from '@/infra/repositories/SqliteSettingRepository'
import { SqliteTaskRepository } from '@/infra/repositories/SqliteTaskRepository'
import { TauriDataFolderRepository } from '@/infra/repositories/TauriDataFolderRepository'
import { useDataFolderStore } from './useDataFolderStore'
import { useThemeStore } from './useThemeStore'

export type SettingsStatus = 'idle' | 'loading' | 'ready' | 'error'

const dataFolderRepository = new TauriDataFolderRepository()

type FolderSlice = {
  folderEntries: readonly DataFolderEntry[]
  folderErrorMessage: string | null
}

type SettingsState = FolderSlice & {
  status: SettingsStatus
  errorMessage: string | null
  settings: AppSettings
  invalidSettingKeys: readonly string[]
  people: readonly Person[]
  phases: readonly Phase[]
  tasks: readonly Task[]
  allocations: readonly Allocation[]
  dataFolderPath: string | null
  load: () => Promise<void>
  refreshFolder: () => Promise<void>
  chooseFolder: () => Promise<boolean>
  revealFolder: () => Promise<void>
  writeSetting: <TField extends AppSettingField>(
    field: TField,
    value: AppSettings[TField],
  ) => Promise<void>
}

async function readDatabaseSlice() {
  const gateway = getSqlGateway()

  const [rawSettings, people, phases, tasks, allocations] = await Promise.all([
    new SqliteSettingRepository(gateway).readAll(),
    new SqlitePersonRepository(gateway).listAll(),
    new SqlitePhaseRepository(gateway).listAll(),
    new SqliteTaskRepository(gateway).listAll(),
    new SqliteAllocationRepository(gateway).listAll(),
  ])

  return { ...parseAppSettings(rawSettings), people, phases, tasks, allocations }
}

// A pasta falha por motivo próprio — permissão, caminho removido — e não pode derrubar a
// tela inteira junto: o erro dela fica no card dela.
async function readFolderSlice(folderPath: string | null): Promise<FolderSlice> {
  if (folderPath === null) {
    return { folderEntries: [], folderErrorMessage: null }
  }

  try {
    return {
      folderEntries: await dataFolderRepository.listEntries(folderPath),
      folderErrorMessage: null,
    }
  } catch (cause) {
    console.error('Não foi possível listar a pasta de dados.', cause)

    return { folderEntries: [], folderErrorMessage: toPublicMessage(cause) }
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  status: 'idle',
  errorMessage: null,
  settings: APP_SETTING_DEFAULTS,
  invalidSettingKeys: [],
  people: [],
  phases: [],
  tasks: [],
  allocations: [],
  dataFolderPath: null,
  folderEntries: [],
  folderErrorMessage: null,

  load: async () => {
    set(() => ({ status: 'loading', errorMessage: null }))

    try {
      const dataFolderPath = await useDataFolderStore.getState().resolve()
      const [database, folder] = await Promise.all([
        readDatabaseSlice(),
        readFolderSlice(dataFolderPath),
      ])

      useThemeStore.getState().setPreference(database.settings.themePreference)

      set(() => ({
        status: 'ready',
        errorMessage: null,
        settings: database.settings,
        invalidSettingKeys: database.invalidKeys,
        people: database.people,
        phases: database.phases,
        tasks: database.tasks,
        allocations: database.allocations,
        dataFolderPath,
        ...folder,
      }))
    } catch (cause) {
      console.error('Não foi possível carregar a tela de Configurações.', cause)
      set(() => ({ status: 'error', errorMessage: toPublicMessage(cause) }))
    }
  },

  refreshFolder: async () => {
    set(await readFolderSlice(get().dataFolderPath))
  },

  chooseFolder: async () => {
    const chosen = await dataFolderRepository.choose(get().dataFolderPath)

    if (chosen === null) {
      return false
    }

    await writeDataFolderPointer(chosen)
    useDataFolderStore.getState().setPath(chosen)
    await closeDatabase()
    await bootstrapDatabase(chosen)
    await get().load()

    return true
  },

  revealFolder: async () => {
    const folderPath = get().dataFolderPath

    if (folderPath === null) {
      return
    }

    await dataFolderRepository.reveal(folderPath)
  },

  writeSetting: async (field, value) => {
    const { key, value: text } = serializeAppSetting(field, value)

    set((state) => ({ settings: { ...state.settings, [field]: value } }))
    await new SqliteSettingRepository(getSqlGateway()).write(key, text)
    await get().refreshFolder()
  },
}))
