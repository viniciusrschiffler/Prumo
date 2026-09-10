import type { RefObject } from 'react'
import { useNotesStore } from '@/app/stores/useNotesStore'
import { countLines, countWords } from '@/domain/notes/noteDocument'
import type { NoteRow } from '@/domain/notes/noteRow'
import type { NoteTreeNode } from '@/domain/notes/noteTree'
import { NoteDocumentHeader } from './NoteDocumentHeader'
import { NoteEditorPane } from './NoteEditorPane'
import { formatEditorStats, pluralize } from './noteLabels'
import { NotePreviewPane } from './NotePreviewPane'
import { NoteStatusBar } from './NoteStatusBar'
import type { NoteViewMode } from './noteViewMode'

const PANE_CLASSES: Record<NoteViewMode, string> = {
  editor: 'grid-cols-1',
  split: 'grid-cols-2',
  preview: 'grid-cols-1',
}

type NoteDocumentPaneProps = {
  node: NoteTreeNode
  row: NoteRow | null
  mode: NoteViewMode
  editorRef: RefObject<HTMLTextAreaElement>
  onModeChange: (mode: NoteViewMode) => void
  onLink: () => void
  onNewNote: () => void
  onDelete: () => void
}

export function NoteDocumentPane({
  node,
  row,
  mode,
  editorRef,
  onModeChange,
  onLink,
  onNewNote,
  onDelete,
}: NoteDocumentPaneProps) {
  const content = useNotesStore((state) => state.content)
  const saveStatus = useNotesStore((state) => state.saveStatus)
  const savedAt = useNotesStore((state) => state.savedAt)
  const editContent = useNotesStore((state) => state.editContent)
  const saveNote = useNotesStore((state) => state.saveNote)

  const isFile = node.kind === 'file'

  return (
    <div className="flex flex-col overflow-hidden">
      <NoteDocumentHeader
        node={node}
        row={row}
        mode={mode}
        now={new Date()}
        onModeChange={onModeChange}
        onLink={onLink}
        onNewNote={onNewNote}
        onDelete={onDelete}
      />

      <div className={`grid flex-1 overflow-hidden ${PANE_CLASSES[mode]}`}>
        {mode !== 'preview' && (
          <NoteEditorPane
            ref={editorRef}
            content={content}
            isEditable={isFile}
            onChange={editContent}
            onBlur={() => void saveNote()}
          />
        )}
        {mode !== 'editor' && (
          <NotePreviewPane
            node={node}
            row={row}
            content={content}
            className={mode === 'split' ? 'border-l border-border' : undefined}
          />
        )}
      </div>

      <NoteStatusBar
        stats={
          isFile
            ? formatEditorStats(countWords(content), countLines(content))
            : `${pluralize(node.fileCount, 'arquivo', 'arquivos')} nesta pasta`
        }
        saveStatus={saveStatus}
        savedAt={savedAt}
      />
    </div>
  )
}
