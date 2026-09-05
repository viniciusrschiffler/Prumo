import { EmptyState } from '@/ui/primitives/EmptyState'

type NotesTabProps = {
  noteCount: number
}

export function NotesTab({ noteCount }: NotesTabProps) {
  if (noteCount === 0) {
    return (
      <EmptyState
        title="Nenhuma nota vinculada"
        description="Notas criadas na tela de Notas e ligadas a este projeto aparecem aqui."
      />
    )
  }

  return (
    <EmptyState
      title={noteCount === 1 ? '1 nota vinculada' : `${noteCount} notas vinculadas`}
      description={
        <>
          Abrem no editor markdown em <span className="font-mono text-meta">Notas</span> — a árvore
          filtra por este projeto.
        </>
      }
    />
  )
}
