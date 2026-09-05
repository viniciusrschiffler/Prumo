import { useState, type ReactNode } from 'react'
import { buildPlannedWindow } from '@/domain/derived/buildPlannedWindow'
import { formatIsoDate, parseDisplayDate } from '@/domain/format/displayDate'
import { validateNewProject, type NewProjectDraft } from '@/domain/projects/newProject'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'
import { Select } from '@/ui/primitives/Select'
import { TagInput } from '@/ui/primitives/TagInput'
import { Textarea } from '@/ui/primitives/Textarea'

const NO_OWNER = ''

type NewProjectModalProps = {
  people: readonly Person[]
  onClose: () => void
  onSubmit: (draft: NewProjectDraft) => void
}

function PreviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="font-mono text-micro text-text3">{label}</span>
      <span className="font-mono text-label font-normal tabular-nums tracking-normal text-text2">
        {children}
      </span>
    </>
  )
}

export function NewProjectModal({ people, onClose, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [ownerPersonId, setOwnerPersonId] = useState<EntityId | typeof NO_OWNER>(NO_OWNER)
  const [tagNames, setTagNames] = useState<readonly string[]>([])
  const [startText, setStartText] = useState('')
  const [endText, setEndText] = useState('')
  const [description, setDescription] = useState('')

  const draft: NewProjectDraft = {
    name,
    ownerPersonId: ownerPersonId === NO_OWNER ? null : ownerPersonId,
    tagNames,
    plannedStart: parseDisplayDate(startText),
    plannedEnd: parseDisplayDate(endText),
    description,
  }

  const errors = validateNewProject(draft)
  const hasBrokenStart = startText.trim() !== '' && draft.plannedStart === null
  const hasBrokenEnd = endText.trim() !== '' && draft.plannedEnd === null
  const isValid = Object.keys(errors).length === 0 && !hasBrokenStart && !hasBrokenEnd
  const window = buildPlannedWindow(draft.plannedStart, draft.plannedEnd)

  return (
    <Modal
      open
      size="wide"
      title="Novo projeto"
      note="fases e esforço vêm das tarefas cadastradas depois"
      hint={
        <>
          Status inicial: <span className="font-medium text-text2">Descoberta</span>
        </>
      }
      submitLabel="Criar projeto"
      submitDisabled={!isValid}
      onClose={onClose}
      onSubmit={() => onSubmit(draft)}
    >
      <div className="grid grid-cols-[1fr_190px] gap-2.5">
        <FieldGroup label="Nome do projeto" htmlFor="new-project-name" error={errors.name}>
          <Input
            id="new-project-name"
            value={name}
            placeholder="Ex. Portal do cliente"
            invalid={errors.name !== undefined}
            onChange={(event) => setName(event.target.value)}
            className="h-8"
          />
        </FieldGroup>

        <FieldGroup label="Responsável" htmlFor="new-project-owner">
          <Select
            id="new-project-owner"
            value={ownerPersonId}
            onChange={(event) => setOwnerPersonId(event.target.value)}
            className="h-8 text-support"
          >
            <option value={NO_OWNER}>Sem responsável</option>
            {people
              .filter((person) => person.active)
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
          </Select>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-[1fr_150px_150px] gap-2.5">
        <FieldGroup label="Tags" htmlFor="new-project-tags">
          <TagInput
            id="new-project-tags"
            tags={tagNames}
            onChange={setTagNames}
            label="Tags do projeto"
          />
        </FieldGroup>

        <FieldGroup
          label="Início previsto"
          htmlFor="new-project-start"
          error={hasBrokenStart ? 'Data inválida.' : undefined}
        >
          <Input
            id="new-project-start"
            numeric
            value={startText}
            placeholder="dd/mm/aaaa"
            invalid={hasBrokenStart}
            onChange={(event) => setStartText(event.target.value)}
            className="h-8"
          />
        </FieldGroup>

        <FieldGroup
          label="Fim previsto"
          htmlFor="new-project-end"
          error={hasBrokenEnd ? 'Data inválida.' : errors.plannedEnd}
        >
          <Input
            id="new-project-end"
            numeric
            value={endText}
            placeholder="dd/mm/aaaa"
            invalid={hasBrokenEnd || errors.plannedEnd !== undefined}
            onChange={(event) => setEndText(event.target.value)}
            className="h-8"
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Descrição · opcional" htmlFor="new-project-description">
        <Textarea
          id="new-project-description"
          rows={3}
          value={description}
          placeholder="Objetivo do projeto em uma ou duas linhas."
          onChange={(event) => setDescription(event.target.value)}
          className="resize-y text-support"
        />
      </FieldGroup>

      <div className="grid grid-cols-[120px_1fr] gap-x-2.5 gap-y-2 border-t border-border pt-3">
        <PreviewRow label="janela prevista">
          {window === null ? (
            <span className="text-text3">preencha o início e o fim para ver a janela</span>
          ) : (
            <>
              {formatIsoDate(window.period.start)} → {formatIsoDate(window.period.end)}{' '}
              <span className="text-text3">· {window.weeks} semanas</span>
            </>
          )}
        </PreviewRow>

        <PreviewRow label="fases">
          derivadas{' '}
          <span className="text-text3">· surgem conforme as tarefas forem cadastradas</span>
        </PreviewRow>

        <PreviewRow label="esforço ∑">
          0h{' '}
          <span className="text-text3">· sem tarefas ainda · baseline v1 criada ao salvar</span>
        </PreviewRow>
      </div>
    </Modal>
  )
}
