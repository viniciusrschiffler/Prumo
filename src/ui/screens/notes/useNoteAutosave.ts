import { useEffect, useRef } from 'react'
import { useNotesStore } from '@/app/stores/useNotesStore'

// O design não desenha botão de salvar nem cita ⌘S no rodapé — desenha um indicador de estado.
// A gravação é automática, com o intervalo curto o bastante para o "salvo em disco" chegar
// dentro da mesma pausa de digitação.
const AUTOSAVE_DELAY_MS = 800

export function useNoteAutosave(): void {
  const saveStatus = useNotesStore((state) => state.saveStatus)
  const content = useNotesStore((state) => state.content)
  const openPath = useNotesStore((state) => state.openPath)
  const saveNote = useNotesStore((state) => state.saveNote)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (saveStatus !== 'dirty') {
      return
    }

    timer.current = window.setTimeout(() => void saveNote(), AUTOSAVE_DELAY_MS)

    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [saveStatus, content, openPath, saveNote])

  // Fechar a janela com edição pendente perderia o texto; o `beforeunload` é a última chance
  // de mandá-lo ao disco, e a gravação é local e rápida o bastante para caber nela.
  useEffect(() => {
    function flush() {
      if (useNotesStore.getState().saveStatus === 'dirty') {
        void useNotesStore.getState().saveNote()
      }
    }

    window.addEventListener('beforeunload', flush)

    return () => {
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [])
}
