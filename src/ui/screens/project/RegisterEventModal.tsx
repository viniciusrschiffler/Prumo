import { useState } from 'react'
import {
  canOpenRisk,
  REGISTRABLE_EVENT_TYPES,
  validateNewProjectEvent,
  type NewProjectEventDraft,
} from '@/domain/projects/newProjectEvent'
import { formatIsoDate, parseDisplayDate } from '@/domain/format/displayDate'
import type { EntityId } from '@/domain/schemas/primitives'
import type { ProjectEventType } from '@/domain/schemas/projectEventSchema'
import { PROJECT_EVENT_LABELS } from '@/ui/labels/entityLabels'
import { DateField } from '@/ui/primitives/DateField'
import { Checkbox } from '@/ui/primitives/Checkbox'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'
import { SegmentedControl } from '@/ui/primitives/SegmentedControl'
import { Textarea } from '@/ui/primitives/Textarea'

const TYPE_OPTIONS = REGISTRABLE_EVENT_TYPES.map((type) => ({
  value: type,
  label: PROJECT_EVENT_LABELS[type],
}))

type RegisterEventModalProps = {
  projectId: EntityId
  projectName: string
  today: string
  onClose: () => void
  onSubmit: (draft: NewProjectEventDraft) => void
}

export function RegisterEventModal({
  projectId,
  projectName,
  today,
  onClose,
  onSubmit,
}: RegisterEventModalProps) {
  const [type, setType] = useState<ProjectEventType>('decision')
  const [dateText, setDateText] = useState(formatIsoDate(today))
  const [title, setTitle] = useState('')
  const [bodyMarkdown, setBodyMarkdown] = useState('')
  const [riskOpen, setRiskOpen] = useState(true)

  const draft: NewProjectEventDraft = {
    projectId,
    type,
    eventDate: parseDisplayDate(dateText),
    title,
    bodyMarkdown,
    riskOpen,
  }

  const errors = validateNewProjectEvent(draft)
  const isValid = Object.keys(errors).length === 0

  return (
    <Modal
      open
      title="Registrar evento"
      note={projectName}
      hint="Entra no histórico do projeto."
      submitLabel="Registrar"
      submitDisabled={!isValid}
      onClose={onClose}
      onSubmit={() => onSubmit(draft)}
    >
      <FieldGroup label="Tipo">
        <SegmentedControl
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
          label="Tipo do evento"
        />
      </FieldGroup>

      <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-2.5">
        <FieldGroup label="Título" htmlFor="event-title" error={title === '' ? undefined : errors.title}>
          <Input
            id="event-title"
            value={title}
            placeholder="Ex. Manter o provedor atual no piloto"
            onChange={(event) => setTitle(event.target.value)}
          />
        </FieldGroup>

        <FieldGroup
          label="Data"
          htmlFor="event-date"
          error={errors.eventDate === undefined ? undefined : 'Data inválida.'}
        >
          <DateField
            id="event-date"
            value={dateText}
            invalid={errors.eventDate !== undefined}
            onChange={setDateText}
          />
        </FieldGroup>
      </div>

      <FieldGroup
        label={
          <>
            Detalhe <span className="text-meta normal-case tracking-normal">opcional</span>
          </>
        }
        htmlFor="event-body"
      >
        <Textarea
          id="event-body"
          rows={3}
          value={bodyMarkdown}
          placeholder="Contexto e impacto, em uma ou duas linhas."
          textSize="support"
          onChange={(event) => setBodyMarkdown(event.target.value)}
          className="resize-y"
        />
      </FieldGroup>

      {canOpenRisk(type) && (
        <Checkbox
          checked={riskOpen}
          description="Enquanto estiver aberto, o projeto aparece marcado como em risco nas listas."
          onChange={(event) => setRiskOpen(event.target.checked)}
        >
          Manter o risco aberto
        </Checkbox>
      )}
    </Modal>
  )
}

