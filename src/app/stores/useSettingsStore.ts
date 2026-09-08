import { create } from 'zustand'
import { bootstrapDatabase } from '@/app/bootstrapDatabase'
import { PrumoError, toPublicMessage } from '@/domain/errors/PrumoError'
import {
  parseIntegrityProblems,
  serializeIntegrityProblems,
  type IntegrityReport,
} from '@/domain/integrity/integrityReport'
import type { DataFolderEntry } from '@/domain/repositories/DataFolderRepository'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import { SETTING_KEYS } from '@/domain/schemas/settingSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import {
  APP_SETTING_DEFAULTS,
  parseAppSettings,
  serializeAppSetting,
  type AppSettingField,
  type AppSettings,
  type ThemePreference,
} from '@/domain/settings/appSettings'
import { writeDataFolderPointer } from '@/infra/config/dataFolderPointer'
import { closeDatabase, getSqlGateway } from '@/infra/database/DatabaseConnection'
import { eraseAllData } from '@/infra/database/eraseAllData'
import { exportAllTables, type ExportResult } from '@/infra/database/exportAllTables'
import { runIntegrityCheck } from '@/infra/database/runIntegrityCheck'
import { writeExportFile } from '@/infra/files/writeExportFile'
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
  refreshData: () => Promise<void>
  refreshFolder: () => Promise<void>
  savePerson: (person: Person) => Promise<void>
  removePerson: (id: EntityId) => Promise<void>
  savePhase: (phase: Phase) => Promise<void>
  removePhase: (id: EntityId) => Promise<void>
  reorderPhases: (orderedIds: readonly EntityId[]) => Promise<void>
  integrityReport: IntegrityReport | null
  checkIntegrity: () => Promise<IntegrityReport>
  exportAll: () => Promise<ExportResult>
  exportCsv: (fileName: string, contents: string) => Promise<string>
  eraseAll: () => Promise<void>
  chooseFolder: () => Promise<boolean>
  revealFolder: () => Promise<void>
  writeSetting: <TField extends AppSettingField>(
    field: TField,
    value: AppSettings[TField],
  ) => Promise<void>
}

function readIntegrityReport(raw: Readonly<Record<string, string>>): IntegrityReport | null {
  const checkedAt = raw[SETTING_KEYS.lastIntegrityCheckAt]

  if (checkedAt === undefined) {
    return null
  }

  return {
    checkedAt,
    problems: parseIntegrityProblems(raw[SETTING_KEYS.lastIntegrityCheckResult] ?? ''),
  }
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

  return {
    ...parseAppSettings(rawSettings),
    integrityReport: readIntegrityReport(rawSettings),
    people,
    phases,
    tasks,
    allocations,
  }
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

// Quem resolve a pasta de dados no boot é o `useDataFolderStore`. A cópia daqui só nasce no
// `load`, e só a tela de Configurações o chama — exportar dos Painéis não passa por ela.
async function resolveExportFolder(cached: string | null): Promise<string> {
  const folderPath =
    cached ??
    useDataFolderStore.getState().path ??
    (await useDataFolderStore.getState().resolve())

  if (folderPath === null) {
    throw new PrumoError('EXPORT_FAILED', 'exportação pedida sem pasta de dados definida')
  }

  return folderPath
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
  integrityReport: null,

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
        integrityReport: database.integrityReport,
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

  refreshData: async () => {
    const [database, folder] = await Promise.all([
      readDatabaseSlice(),
      readFolderSlice(get().dataFolderPath),
    ])

    set(() => ({
      settings: database.settings,
      invalidSettingKeys: database.invalidKeys,
      integrityReport: database.integrityReport,
      people: database.people,
      phases: database.phases,
      tasks: database.tasks,
      allocations: database.allocations,
      ...folder,
    }))
  },

  refreshFolder: async () => {
    set(await readFolderSlice(get().dataFolderPath))
  },

  savePerson: async (person) => {
    await new SqlitePersonRepository(getSqlGateway()).save(person)
    await get().refreshData()
  },

  removePerson: async (id) => {
    await new SqlitePersonRepository(getSqlGateway()).remove(id)
    await get().refreshData()
  },

  savePhase: async (phase) => {
    await new SqlitePhaseRepository(getSqlGateway()).save(phase)
    await get().refreshData()
  },

  removePhase: async (id) => {
    await new SqlitePhaseRepository(getSqlGateway()).remove(id)
    await get().refreshData()
  },

  reorderPhases: async (orderedIds) => {
    await new SqlitePhaseRepository(getSqlGateway()).reorder(orderedIds)
    await get().refreshData()
  },

  checkIntegrity: async () => {
    const gateway = getSqlGateway()
    const report = await runIntegrityCheck(gateway, get().dataFolderPath)

    await new SqliteSettingRepository(gateway).writeMany([
      { key: SETTING_KEYS.lastIntegrityCheckAt, value: report.checkedAt },
      {
        key: SETTING_KEYS.lastIntegrityCheckResult,
        value: serializeIntegrityProblems(report.problems),
      },
    ])

    set(() => ({ integrityReport: report }))
    await get().refreshFolder()

    return report
  },

  exportAll: async () => {
    const folderPath = await resolveExportFolder(get().dataFolderPath)
    const result = await exportAllTables(getSqlGateway(), folderPath)

    await get().refreshFolder()

    return result
  },

  // O card de arquivos não fica em tela quando o CSV sai dos Painéis, e um `refreshFolder`
  // daqui listaria a pasta que a cópia local ainda não conhece, esvaziando o card.
  exportCsv: async (fileName, contents) =>
    writeExportFile(await resolveExportFolder(get().dataFolderPath), fileName, contents),

  eraseAll: async () => {
    await eraseAllData(getSqlGateway())
    set(() => ({ integrityReport: null }))
    await get().load()
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

    if (field === 'themePreference') {
      useThemeStore.getState().setPreference(value as ThemePreference)
    }

    await new SqliteSettingRepository(getSqlGateway()).write(key, text)
    await get().refreshFolder()
  },
}))
