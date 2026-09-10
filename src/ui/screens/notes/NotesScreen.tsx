import { useMemo, useRef, useState } from 'react'
import { useNotesStore } from '@/app/stores/useNotesStore'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { NoteDeletionPlan } from '@/domain/notes/noteDeletion'
import { ALL_NOTES_FILTER } from '@/domain/notes/noteRow'
import { listFolderPaths, resolveTargetFolder } from '@/domain/notes/noteTree'
import { useSidebarContext } from '@/ui/layout/useSidebarContext'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { DeleteNoteModal } from './DeleteNoteModal'
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

type OpenModal =
  | { kind: 'note'; folderPath: string }
  | { kind: 'folder'; parentPath: string }
  | { kind: 'delete'; plan: NoteDeletionPlan }
  | { kind: 'link' }
  | null

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
  const planDeletion = useNotesStore((state) => state.planDeletion)
  const deleteNode = useNotesStore((state) => state.deleteNode)
  const setLinks = useNotesStore((state) => state.setLinks)
  const search = useNotesStore((state) => state.search)

  const targetFolderPath = resolveTargetFolder(selectedNode)

  useNoteAutosave()
  useNoteShortcuts({
    editorRef,
    onNewNote: () => setOpenModal({ kind: 'note', folderPath: targetFolderPath }),
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

  const folderPaths = useMemo(() => listFolderPaths(visibleTree), [visibleTree])

  async function run(action: () => Promise<unknown>, failure: string, success?: string) {
    try {
      await action()

      if (success !== undefined) {
        notify(success)
      }
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
        targetFolderPath={targetFolderPath}
        searchText={searchText}
        isFiltered={projectFilterId !== ALL_NOTES_FILTER || searchText.trim() !== ''}
        onSelect={(node) => void openNode(node)}
        onSearch={handleSearch}
        onNewNote={(folderPath) => setOpenModal({ kind: 'note', folderPath })}
        onNewFolder={(parentPath) => setOpenModal({ kind: 'folder', parentPath })}
        onDelete={(node) =>
          setOpenModal({
            kind: 'delete',
            plan: planDeletion({ path: node.path, kind: node.kind }, node.name),
          })
        }
      />

      {selectedNode === null ? (
        <div className="grid content-center justify-items-center p-10">
          <EmptyState
            size="large"
            title="Nenhuma nota aberta"
            description={EMPTY_DESCRIPTION}
            action={
              <Button
                variant="primary"
                keys="mod+n"
                onClick={() => setOpenModal({ kind: 'note', folderPath: targetFolderPath })}
              >
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
          onLink={() => setOpenModal({ kind: 'link' })}
          onNewNote={() => setOpenModal({ kind: 'note', folderPath: targetFolderPath })}
        />
      )}

      {openModal?.kind === 'note' && (
        <NewNoteModal
          folderPaths={folderPaths}
          defaultFolderPath={openModal.folderPath}
          onClose={() => setOpenModal(null)}
          onSubmit={(draft) => {
            setOpenModal(null)
            void run(() => createNote(draft), 'Não foi possível criar a nota.')
          }}
        />
      )}

      {openModal?.kind === 'folder' && (
        <NewFolderModal
          folderPaths={folderPaths}
          defaultParentPath={openModal.parentPath}
          onClose={() => setOpenModal(null)}
          onSubmit={(parentPath, name) => {
            setOpenModal(null)
            void run(
              () => createFolder(parentPath, name),
              'Não foi possível criar a pasta.',
              `Pasta ${name} criada.`,
            )
          }}
        />
      )}

      {openModal?.kind === 'delete' && (
        <DeleteNoteModal
          plan={openModal.plan}
          onClose={() => setOpenModal(null)}
          onConfirm={() => {
            const { plan } = openModal

            setOpenModal(null)
            void run(
              () => deleteNode(plan),
              'Não foi possível excluir na pasta de notas.',
              `${plan.name} excluída.`,
            )
          }}
        />
      )}

      {openModal?.kind === 'link' && selectedRow !== null && (
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
