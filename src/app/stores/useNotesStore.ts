import { create } from 'zustand'
import { useDataFolderStore } from '@/app/stores/useDataFolderStore'
import { useNavigationCountsStore } from '@/app/stores/useNavigationCountsStore'
import { PrumoError, toPublicMessage } from '@/domain/errors/PrumoError'
import { buildUniqueNotePath, toNoteSlug } from '@/domain/notes/notePath'
import type { NotesSnapshot } from '@/domain/notes/noteRow'
import type { NoteEntryKind } from '@/domain/notes/noteTree'
import { toFtsQuery } from '@/domain/notes/noteSearchQuery'
import type { EntityId, IsoDateTime } from '@/domain/schemas/primitives'
import { getSqlGateway } from '@/infra/database/DatabaseConnection'
import { SqliteNoteRepository } from '@/infra/repositories/SqliteNoteRepository'
import { SqlitePhaseRepository } from '@/infra/repositories/SqlitePhaseRepository'
import { SqliteProjectEventRepository } from '@/infra/repositories/SqliteProjectEventRepository'
import { SqliteProjectRepository } from '@/infra/repositories/SqliteProjectRepository'
import { SqliteTaskRepository } from '@/infra/repositories/SqliteTaskRepository'
import { TauriNoteFilesRepository } from '@/infra/repositories/TauriNoteFilesRepository'

export type NotesStatus = 'idle' | 'loading' | 'ready' | 'error'

export type NoteSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export type NoteTarget = {
  path: string
  kind: NoteEntryKind
}

export type NewNoteDraft = {
  title: string
  folderPath: string
}

const EMPTY_SNAPSHOT: NotesSnapshot = {
  entries: [],
  notes: [],
  projects: [],
  tasks: [],
  phases: [],
  events: [],
}

type NotesState = {
  status: NotesStatus
  errorMessage: string | null
  snapshot: NotesSnapshot
  openPath: string | null
  content: string
  saveStatus: NoteSaveStatus
  savedAt: IsoDateTime | null
  matchedPaths: ReadonlySet<string> | null
  load: () => Promise<void>
  refresh: () => Promise<void>
  openNode: (target: NoteTarget | null) => Promise<void>
  editContent: (content: string) => void
  saveNote: () => Promise<void>
  createNote: (draft: NewNoteDraft) => Promise<string | null>
  createFolder: (parentPath: string, name: string) => Promise<void>
  setLinks: (projectId: EntityId | null, eventId: EntityId | null) => Promise<void>
  search: (text: string) => Promise<void>
}

function createFilesRepository(): TauriNoteFilesRepository {
  const dataFolderPath = useDataFolderStore.getState().path

  if (dataFolderPath === null) {
    throw new PrumoError('NOTES_FOLDER_UNREADABLE', 'pasta de dados ainda não resolvida')
  }

  return new TauriNoteFilesRepository(dataFolderPath)
}

async function readSnapshot(): Promise<NotesSnapshot> {
  const gateway = getSqlGateway()

  const [entries, notes, projects, tasks, phases, events] = await Promise.all([
    createFilesRepository().listEntries(),
    new SqliteNoteRepository(gateway).listAll(),
    new SqliteProjectRepository(gateway).listAll(),
    new SqliteTaskRepository(gateway).listAll(),
    new SqlitePhaseRepository(gateway).listAll(),
    new SqliteProjectEventRepository(gateway).listAll(),
  ])

  return { entries, notes, projects, tasks, phases, events }
}

function byteLengthOf(content: string): number {
  return new TextEncoder().encode(content).length
}

export const useNotesStore = create<NotesState>((set, get) => ({
  status: 'idle',
  errorMessage: null,
  snapshot: EMPTY_SNAPSHOT,
  openPath: null,
  content: '',
  saveStatus: 'idle',
  savedAt: null,
  matchedPaths: null,

  load: async () => {
    set(() => ({ status: 'loading', errorMessage: null }))

    try {
      const snapshot = await readSnapshot()

      set(() => ({ status: 'ready', errorMessage: null, snapshot }))
    } catch (cause) {
      console.error('Não foi possível carregar a tela de Notas.', cause)
      set(() => ({ status: 'error', errorMessage: toPublicMessage(cause) }))
    }
  },

  refresh: async () => {
    const snapshot = await readSnapshot()

    set(() => ({ snapshot }))
  },

  // Trocar de arquivo com edição pendente gravaria o texto errado no arquivo errado, então a
  // gravação atrasada é cobrada antes de o próximo entrar. Pasta não tem conteúdo para ler:
  // ela só muda o que a tela mostra.
  openNode: async (target) => {
    if (get().saveStatus === 'dirty') {
      await get().saveNote()
    }

    if (target === null || target.kind === 'folder') {
      set(() => ({
        openPath: target?.path ?? null,
        content: '',
        saveStatus: 'idle',
        savedAt: null,
      }))
      return
    }

    try {
      const content = await createFilesRepository().read(target.path)

      set(() => ({ openPath: target.path, content, saveStatus: 'idle', savedAt: null }))
    } catch (cause) {
      console.error('Não foi possível abrir a nota.', cause)
      set(() => ({ openPath: target.path, content: '', saveStatus: 'error' }))
    }
  },

  editContent: (content) => {
    set(() => ({ content, saveStatus: 'dirty' }))
  },

  // O arquivo vai primeiro e a linha do banco depois: o disco é a fonte de verdade da nota, e
  // um índice desatualizado é o que o "Verificar arquivos" das Configurações já sabe acusar.
  saveNote: async () => {
    const { openPath, content } = get()

    if (openPath === null) {
      return
    }

    const savedAt = new Date().toISOString()

    set(() => ({ saveStatus: 'saving' }))

    try {
      await createFilesRepository().write(openPath, content)
      await new SqliteNoteRepository(getSqlGateway()).saveContent({
        path: openPath,
        content,
        updatedAt: savedAt,
      })

      set((state) => ({
        saveStatus: 'saved',
        savedAt,
        snapshot: {
          ...state.snapshot,
          entries: state.snapshot.entries.map((entry) =>
            entry.path === openPath
              ? { ...entry, sizeBytes: byteLengthOf(content), modifiedAt: savedAt }
              : entry,
          ),
          notes: state.snapshot.notes.map((note) =>
            note.path === openPath ? { ...note, updatedAt: savedAt } : note,
          ),
        },
      }))
    } catch (cause) {
      console.error('Não foi possível gravar a nota.', cause)
      set(() => ({ saveStatus: 'error', errorMessage: toPublicMessage(cause) }))
    }
  },

  createNote: async (draft) => {
    const takenPaths = new Set(get().snapshot.entries.map((entry) => entry.path))
    const path = buildUniqueNotePath(draft.folderPath, toNoteSlug(draft.title), takenPaths)
    const now = new Date().toISOString()

    await createFilesRepository().write(path, `# ${draft.title}\n\n`)
    await new SqliteNoteRepository(getSqlGateway()).saveContent({
      path,
      content: `# ${draft.title}\n\n`,
      updatedAt: now,
    })

    await get().refresh()
    await useNavigationCountsStore.getState().refresh()
    await get().openNode({ path, kind: 'file' })

    return path
  },

  createFolder: async (parentPath, name) => {
    await createFilesRepository().createFolder(`${parentPath}/${toNoteSlug(name)}`)
    await get().refresh()
  },

  setLinks: async (projectId, eventId) => {
    const { openPath } = get()

    if (openPath === null) {
      return
    }

    await new SqliteNoteRepository(getSqlGateway()).setLinks({
      path: openPath,
      projectId,
      projectEventId: eventId,
      updatedAt: new Date().toISOString(),
    })

    await get().refresh()
  },

  search: async (text) => {
    const ftsQuery = toFtsQuery(text)

    if (ftsQuery === null) {
      set(() => ({ matchedPaths: null }))
      return
    }

    try {
      const paths = await new SqliteNoteRepository(getSqlGateway()).searchPaths(ftsQuery)

      set(() => ({ matchedPaths: new Set(paths) }))
    } catch (cause) {
      // Busca que não responde não pode esvaziar a árvore: sem resposta, ela volta inteira.
      console.error('Não foi possível buscar no conteúdo das notas.', cause)
      set(() => ({ matchedPaths: null }))
    }
  },
}))
