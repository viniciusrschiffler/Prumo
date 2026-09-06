import { useMemo, useRef, useState } from 'react'
import { useNotesStore } from '@/app/stores/useNotesStore'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import { noteFolderOf, NOTES_ROOT } from '@/domain/notes/notePath'
import { ALL_NOTES_FILTER } from '@/domain/notes/noteRow'
import { useSidebarContext } from '@/ui/layout/useSidebarContext'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { LinkNoteModal } from './LinkNoteModal'
import { NewFolderModal } from './NewFolderModal'
import { NewNoteModal } from './NewNoteModal'
import { NoteDocumentPane } from './NoteDocumentPane'
import { NOTE_FILTER_LABELS } from './noteLabels'
import { NoteTreePanel } from './NoteTreePanel'
import type { NoteViewMode } from './noteViewMode'
import { useNoteAutosave } from './useNoteAutosave'
import { useNotesScreenData } from './useNotesScreenData'
import { useNoteShortcuts } from './useNoteShortcuts'

type OpenModal = 'note' | 'folder' | 'link' | null

const EMPTY_DESCRIPTION =
  'As notas são arquivos .md na sua pasta de dados. Crie a primeira com ⌘N ou escolha uma na árvore.'

export function NotesScreen() {
  const [projectFilterId, setProjectFilterId] = useState(ALL_NOTES_FILTER)
  const [searchText, setSearchText] = useState('')
  const [mode, setMode] = useState<NoteViewMode>('split')
  const [openModal, setOpenModal] = useState<OpenModal>(null)

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const notify = useToastStore((state) => state.notify)

  const {
    status,
    errorMessage,
    snapshot,
    projectOptions,
    linkableProjects,
    phaseColorOf,
    visibleTree,
    selectedNode,
    selectedRow,
    retry,
  } = useNotesScreenData(projectFilterId)

  const openNode = useNotesStore((state) => state.openNode)
  const createNote = useNotesStore((state) => state.createNote)
  const createFolder = useNotesStore((state) => state.createFolder)
  const setLinks = useNotesStore((state) => state.setLinks)
  const search = useNotesStore((state) => state.search)

  useNoteAutosave()
  useNoteShortcuts({
    editorRef,
    onNewNote: () => setOpenModal('note'),
    onModeChange: (toNext) => setMode(toNext),
  })

  const sidebarItems = useMemo<SidebarContextItem[]>(
    () =>
      projectOptions.map((option) => ({
        id: option.id,
        label: option.project?.name ?? NOTE_FILTER_LABELS[option.id] ?? option.id,
        meta: String(option.count),
        color: option.phase?.color,
      })),
    [projectOptions],
  )

  useSidebarContext(sidebarItems, projectFilterId, setProjectFilterId)

  const folders = useMemo(
    () => visibleTree.filter((node) => node.kind === 'folder'),
    [visibleTree],
  )

  const selectedFolderPath =
    selectedNode === null
      ? NOTES_ROOT
      : selectedNode.kind === 'folder'
        ? selectedNode.path
        : noteFolderOf(selectedNode.path)

  async function run(action: () => Promise<unknown>, failure: string) {
    try {
      await action()
    } catch (cause) {
      console.error(failure, cause)
      notify(toPublicMessage(cause), 'danger')
    }
  }

  function handleSearch(text: string) {
    setSearchText(text)
    void search(text)
  }

  if (status === 'error') {
    return (
      <div className="grid h-full content-start gap-3.5 p-5">
        <Alert
          level="danger"
          title="Não foi possível abrir as notas"
          action={
            <Button variant="danger" size="small" onClick={() => void retry()}>
              Tentar de novo
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      </div>
    )
  }

  if (status !== 'ready') {
    return <p className="p-5 text-support text-text3">Carregando as notas…</p>
  }

  return (
    <section className="grid h-full grid-cols-[252px_1fr] overflow-hidden">
      <NoteTreePanel
        nodes={visibleTree}
        phaseColorOf={phaseColorOf}
        selectedPath={selectedNode?.path ?? null}
        searchText={searchText}
        isFiltered={projectFilterId !== ALL_NOTES_FILTER || searchText.trim() !== ''}
        onSelect={(node) => void openNode(node)}
        onSearch={handleSearch}
        onNewFolder={() => setOpenModal('folder')}
      />

      {selectedNode === null ? (
        <div className="grid content-center justify-items-center p-10">
          <EmptyState
            size="large"
            title="Nenhuma nota aberta"
            description={EMPTY_DESCRIPTION}
            action={
              <Button variant="primary" keys="mod+n" onClick={() => setOpenModal('note')}>
                Nova nota
              </Button>
            }
          />
        </div>
      ) : (
        <NoteDocumentPane
          node={selectedNode}
          row={selectedRow}
          mode={mode}
          editorRef={editorRef}
          onModeChange={setMode}
          onLink={() => setOpenModal('link')}
          onNewNote={() => setOpenModal('note')}
        />
      )}

      {openModal === 'note' && (
        <NewNoteModal
          folders={folders}
          defaultFolderPath={selectedFolderPath}
          onClose={() => setOpenModal(null)}
          onSubmit={(draft) => {
            setOpenModal(null)
            void run(() => createNote(draft), 'Não foi possível criar a nota.')
          }}
        />
      )}

      {openModal === 'folder' && (
        <NewFolderModal
          parentPath={selectedFolderPath}
          onClose={() => setOpenModal(null)}
          onSubmit={(name) => {
            setOpenModal(null)
            void run(
              () => createFolder(selectedFolderPath, name),
              'Não foi possível criar a pasta.',
            )
          }}
        />
      )}

      {openModal === 'link' && selectedRow !== null && (
        <LinkNoteModal
          row={selectedRow}
          projects={linkableProjects}
          events={snapshot.events}
          onClose={() => setOpenModal(null)}
          onSubmit={(projectId, eventId) => {
            setOpenModal(null)
            void run(() => setLinks(projectId, eventId), 'Não foi possível vincular a nota.')
          }}
        />
      )}
    </section>
  )
}
