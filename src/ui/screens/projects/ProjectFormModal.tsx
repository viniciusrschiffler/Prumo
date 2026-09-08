import { useState, type ReactNode } from 'react'
import { buildPlannedWindow } from '@/domain/derived/buildPlannedWindow'
import { formatIsoDate, parseDisplayDate } from '@/domain/format/displayDate'
import { validateNewProject, type NewProjectDraft } from '@/domain/projects/newProject'
import type { Person } from '@/domain/schemas/personSchema'
import {
  PRIORITIES,
  type EntityId,
  type IsoDate,
  type Priority,
} from '@/domain/schemas/primitives'
import { DateField } from '@/ui/primitives/DateField'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'
import { Select } from '@/ui/primitives/Select'
import { TagInput } from '@/ui/primitives/TagInput'
import { Textarea } from '@/ui/primitives/Textarea'

const NO_OWNER = ''

export type ProjectFormMode = 'create' | 'edit'

const TITLE: Record<ProjectFormMode, string> = {
  create: 'Novo projeto',
  edit: 'Editar projeto',
}

const SUBMIT_LABEL: Record<ProjectFormMode, string> = {
  create: 'Criar projeto',
  edit: 'Salvar alterações',
}

type ProjectFormModalProps = {
  mode: ProjectFormMode
  people: readonly Person[]
  initialDraft: NewProjectDraft
  onClose: () => void
  onSubmit: (draft: NewProjectDraft) => void
}

function toDateField(date: IsoDate | null): string {
  return date === null ? '' : formatIsoDate(date)
}

function PreviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="font-mono text-micro text-text3">{label}</span>
      <span className="min-w-0 font-mono text-label font-normal tabular-nums tracking-normal text-text2">
        {children}
      </span>
    </>
  )
}

// Criar e editar preenchem os mesmos campos, então são o mesmo formulário. O que muda é o
// rótulo, e a dica do status inicial, que só existe em quem ainda vai nascer em descoberta.
export function ProjectFormModal({
  mode,
  people,
  initialDraft,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  const [name, setName] = useState(initialDraft.name)
  const [ownerPersonId, setOwnerPersonId] = useState<EntityId | typeof NO_OWNER>(
    initialDraft.ownerPersonId ?? NO_OWNER,
  )
  const [priority, setPriority] = useState<Priority>(initialDraft.priority)
  const [tagNames, setTagNames] = useState<readonly string[]>(initialDraft.tagNames)
  const [startText, setStartText] = useState(toDateField(initialDraft.plannedStart))
  const [endText, setEndText] = useState(toDateField(initialDraft.plannedEnd))
  const [description, setDescription] = useState(initialDraft.description ?? '')

  const draft: NewProjectDraft = {
    name,
    ownerPersonId: ownerPersonId === NO_OWNER ? null : ownerPersonId,
    priority,
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
      title={TITLE[mode]}
      note="fases e esforço vêm das tarefas cadastradas depois"
      hint={
        mode === 'create' ? (
          <>
            Status inicial: <span className="font-medium text-text2">Descoberta</span>
          </>
        ) : undefined
      }
      submitLabel={SUBMIT_LABEL[mode]}
      submitDisabled={!isValid}
      onClose={onClose}
      onSubmit={() => onSubmit(draft)}
    >
      <div className="grid min-w-0 grid-cols-[1fr_190px_88px] gap-2.5">
        <FieldGroup variant="column" label="Nome do projeto" htmlFor="project-form-name">
          <Input
            id="project-form-name"
            fieldSize="large"
            value={name}
            placeholder="Ex. Portal do cliente"
            onChange={(event) => setName(event.target.value)}
          />
        </FieldGroup>

        <FieldGroup variant="column" label="Responsável" htmlFor="project-form-owner">
          <Select
            id="project-form-owner"
            fieldSize="large"
            textSize="support"
            value={ownerPersonId}
            onChange={(event) => setOwnerPersonId(event.target.value)}
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

        <FieldGroup variant="column" label="Prioridade" htmlFor="project-form-priority">
          <Select
            id="project-form-priority"
            fieldSize="large"
            textSize="support"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            className="font-mono tabular-nums"
          >
            {PRIORITIES.map((candidate) => (
              <option key={candidate} value={candidate}>
                {candidate}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>

      <div className="grid min-w-0 grid-cols-[1fr_150px_150px] gap-2.5">
        <FieldGroup variant="column" label="Tags" htmlFor="project-form-tags">
          <TagInput
            id="project-form-tags"
            tags={tagNames}
            onChange={setTagNames}
            label="Tags do projeto"
          />
        </FieldGroup>

        <FieldGroup
          variant="column"
          label="Início previsto"
          htmlFor="project-form-start"
          error={hasBrokenStart ? 'Data inválida.' : undefined}
        >
          <DateField
            id="project-form-start"
            fieldSize="large"
            value={startText}
            invalid={hasBrokenStart}
            onChange={setStartText}
          />
        </FieldGroup>

        <FieldGroup
          variant="column"
          label="Fim previsto"
          htmlFor="project-form-end"
          error={hasBrokenEnd ? 'Data inválida.' : errors.plannedEnd}
        >
          <DateField
            id="project-form-end"
            fieldSize="large"
            value={endText}
            invalid={hasBrokenEnd || errors.plannedEnd !== undefined}
            onChange={setEndText}
          />
        </FieldGroup>
      </div>

      <FieldGroup
        variant="column"
        htmlFor="project-form-description"
        label={
          <>
            Descrição{' '}
            <span className="text-meta normal-case tracking-normal">opcional</span>
          </>
        }
      >
        <Textarea
          id="project-form-description"
          rows={3}
          value={description}
          placeholder="Objetivo do projeto em uma ou duas linhas."
          textSize="support"
          onChange={(event) => setDescription(event.target.value)}
          className="resize-y"
        />
      </FieldGroup>

      <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] gap-x-2.5 gap-y-2 border-t border-border pt-3">
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

        {mode === 'create' && (
          <>
            <PreviewRow label="fases">
              derivadas{' '}
              <span className="text-text3">· surgem conforme as tarefas forem cadastradas</span>
            </PreviewRow>

            <PreviewRow label="esforço ∑">
              0h{' '}
              <span className="text-text3">
                · sem tarefas ainda · baseline v1 criada ao salvar
              </span>
            </PreviewRow>
          </>
        )}
      </div>
    </Modal>
  )
}
