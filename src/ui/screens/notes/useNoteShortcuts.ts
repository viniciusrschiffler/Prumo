import { useCallback, useMemo, type RefObject } from 'react'
import { useNotesStore } from '@/app/stores/useNotesStore'
import { applyBold, applyLink, type TextEdit, type TextSelection } from '@/domain/notes/noteEdits'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import { toggleViewMode, type NoteViewMode } from './noteViewMode'

type TextTransform = (text: string, selection: TextSelection) => TextEdit

type NoteShortcutsInput = {
  editorRef: RefObject<HTMLTextAreaElement>
  onNewNote: () => void
  onModeChange: (toNext: (mode: NoteViewMode) => NoteViewMode) => void
}

export function useNoteShortcuts({
  editorRef,
  onNewNote,
  onModeChange,
}: NoteShortcutsInput): void {
  const editContent = useNotesStore((state) => state.editContent)

  // O ⌘B e o ⌘L trabalham sobre a seleção do textarea, então precisam do elemento vivo: o
  // texto guardado no store não sabe onde está o cursor.
  const transformSelection = useCallback(
    (transform: TextTransform) => {
      const editor = editorRef.current

      if (editor === null) {
        return
      }

      const edit = transform(editor.value, {
        start: editor.selectionStart,
        end: editor.selectionEnd,
      })

      editContent(edit.text)
      window.requestAnimationFrame(() => {
        editor.focus()
        editor.setSelectionRange(edit.selection.start, edit.selection.end)
      })
    },
    [editorRef, editContent],
  )

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        id: 'notes-new-note',
        keys: 'mod+n',
        scope: 'screen',
        description: 'Nova nota',
        allowInTextField: true,
        run: onNewNote,
      },
      {
        id: 'notes-bold',
        keys: 'mod+b',
        scope: 'screen',
        description: 'Negrito na seleção',
        allowInTextField: true,
        run: () => transformSelection(applyBold),
      },
      {
        id: 'notes-link',
        keys: 'mod+l',
        scope: 'screen',
        description: 'Link na seleção',
        allowInTextField: true,
        run: () => transformSelection(applyLink),
      },
      {
        id: 'notes-toggle-preview',
        keys: 'mod+p',
        scope: 'screen',
        description: 'Alternar editor e preview',
        allowInTextField: true,
        run: () => onModeChange(toggleViewMode),
      },
    ],
    [transformSelection, onNewNote, onModeChange],
  )

  useShortcuts(shortcuts)
}
