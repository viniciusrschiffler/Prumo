import { useState } from 'react'
import { formatIsoDate } from '@/domain/format/displayDate'
import type { NoteRow } from '@/domain/notes/noteRow'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Project } from '@/domain/schemas/projectSchema'
import { PROJECT_EVENT_LABELS, PROJECT_EVENT_TONES } from '@/ui/labels/entityLabels'
import { Badge } from '@/ui/primitives/Badge'
import { classNames } from '@/ui/primitives/classNames'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { Modal } from '@/ui/primitives/Modal'
import { PhaseStripe } from '@/ui/primitives/PhaseStripe'

const OPTION_CLASSES =
  'flex items-center gap-2 rounded-button border px-2.5 py-2 text-left text-support'

export type LinkableProject = {
  project: Project
  phase: Phase | null
}

type OptionProps = {
  isSelected: boolean
  onSelect: () => void
  children: React.ReactNode
}

function LinkOption({ isSelected, onSelect, children }: OptionProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={classNames(
        OPTION_CLASSES,
        isSelected
          ? 'border-accent bg-accent-soft text-text'
          : 'border-border bg-panel text-text2 hover:bg-sunken hover:text-text',
        FOCUS_RING,
      )}
    >
      {children}
    </button>
  )
}

type LinkNoteModalProps = {
  row: NoteRow
  projects: readonly LinkableProject[]
  events: readonly ProjectEvent[]
  onClose: () => void
  onSubmit: (projectId: EntityId | null, eventId: EntityId | null) => void
}

export function LinkNoteModal({
  row,
  projects,
  events,
  onClose,
  onSubmit,
}: LinkNoteModalProps) {
  const [projectId, setProjectId] = useState<EntityId | null>(row.project?.id ?? null)
  const [eventId, setEventId] = useState<EntityId | null>(row.event?.id ?? null)

  const projectEvents = events.filter((event) => event.projectId === projectId)

  function pickProject(nextProjectId: EntityId | null) {
    setProjectId(nextProjectId)
    // O evento pertence ao projeto: trocar de projeto sem soltar o evento deixaria a nota
    // ligada a um evento que não é mais do projeto dela.
    setEventId(null)
  }

  return (
    <Modal
      open
      title="Vincular projeto"
      tone="accent"
      note={row.entry.path}
      size="medium"
      submitLabel="Vincular"
      onSubmit={() => onSubmit(projectId, eventId)}
      onClose={onClose}
    >
      <FieldGroup label="Projeto">
        <div className="grid gap-1.5">
          <LinkOption isSelected={projectId === null} onSelect={() => pickProject(null)}>
            <PhaseStripe color={null} />
            Sem projeto
          </LinkOption>
          {projects.map((entry) => (
            <LinkOption
              key={entry.project.id}
              isSelected={entry.project.id === projectId}
              onSelect={() => pickProject(entry.project.id)}
            >
              <PhaseStripe color={entry.phase?.color ?? null} />
              {entry.project.name}
            </LinkOption>
          ))}
        </div>
      </FieldGroup>

      {projectId !== null && (
        <FieldGroup
          label="Evento do histórico"
          hint="Opcional. Liga a nota à decisão, ao bloqueio ou à mudança que ela documenta."
        >
          <div className="grid max-h-[220px] gap-1.5 overflow-auto">
            <LinkOption isSelected={eventId === null} onSelect={() => setEventId(null)}>
              Nenhum evento
            </LinkOption>
            {projectEvents.map((event) => (
              <LinkOption
                key={event.id}
                isSelected={event.id === eventId}
                onSelect={() => setEventId(event.id)}
              >
                <Badge tone={PROJECT_EVENT_TONES[event.type]} size="small">
                  {PROJECT_EVENT_LABELS[event.type]}
                </Badge>
                <span className="truncate">{event.title}</span>
                <span className="ml-auto flex-none font-mono text-micro tabular-nums text-text3">
                  {formatIsoDate(event.eventDate)}
                </span>
              </LinkOption>
            ))}
          </div>
        </FieldGroup>
      )}
    </Modal>
  )
}
