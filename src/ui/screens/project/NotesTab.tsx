import { formatModifiedAt } from '@/domain/format/formatModifiedAt'
import type { ProjectNoteCard } from '@/domain/projects/projectNotes'
import { Badge } from '@/ui/primitives/Badge'
import { classNames } from '@/ui/primitives/classNames'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { PROJECT_EVENT_LABELS, PROJECT_EVENT_TONES } from '@/ui/labels/entityLabels'

type NotesTabProps = {
  cards: readonly ProjectNoteCard[]
  onOpenNote: (path: string) => void
}

export function NotesTab({ cards, onOpenNote }: NotesTabProps) {
  const now = new Date()

  if (cards.length === 0) {
    return (
      <EmptyState
        title="Nenhuma nota vinculada"
        description="Notas criadas na tela de Notas e ligadas a este projeto aparecem aqui."
      />
    )
  }

  return (
    <div className="grid gap-2">
      {cards.map((card) => (
        <button
          key={card.path}
          type="button"
          title={`Abrir ${card.path} na tela de Notas`}
          onClick={() => onOpenNote(card.path)}
          className={classNames(
            'grid gap-1 rounded-card border border-border bg-panel px-3.5 py-2.5 text-left hover:border-border-strong hover:bg-sunken',
            FOCUS_RING,
          )}
        >
          <span className="flex items-center gap-2">
            <span className="truncate text-body font-medium text-text">{card.title}</span>
            {card.event !== null && (
              <Badge tone={PROJECT_EVENT_TONES[card.event.type]} variant="soft" size="small">
                {PROJECT_EVENT_LABELS[card.event.type]}
              </Badge>
            )}
          </span>

          {card.event !== null && (
            <span className="truncate text-support text-text2">{card.event.title}</span>
          )}

          <span className="flex items-center gap-2 font-mono text-micro text-text3">
            <span className="truncate">{card.folderPath}/</span>
            <span className="ml-auto flex-none">
              editado {formatModifiedAt(card.updatedAt, now)}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
