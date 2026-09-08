import { useState } from 'react'
import { formatIsoDate, parseDisplayDate } from '@/domain/format/displayDate'
import type { EntityId, IsoDate, Priority } from '@/domain/schemas/primitives'
import { PRIORITIES } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'
import {
  previewTodoGroup,
  validateNewTodo,
  type NewTodoDraft,
} from '@/domain/todos/newTodo'
import type { TodoGroupingContext, TodoGroupMode } from '@/domain/todos/todoGrouping'
import { DUE_GROUP_LABELS, PRIORITY_LABELS } from '@/ui/labels/entityLabels'
import { DateField } from '@/ui/primitives/DateField'
import { classNames } from '@/ui/primitives/classNames'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'
import { Select } from '@/ui/primitives/Select'
import { TagInput } from '@/ui/primitives/TagInput'
import { Textarea } from '@/ui/primitives/Textarea'

const WITHOUT_PROJECT_VALUE = ''

function formatDueField(dueDate: IsoDate | null): string {
  return dueDate === null ? '' : formatIsoDate(dueDate)
}

const PRIORITY_BUTTON_CLASSES: Record<Priority, string> = {
  P0: 'border-danger bg-danger-soft text-danger',
  P1: 'border-warn bg-warn-soft text-warn',
  P2: 'border-text2 bg-neutral-soft text-text2',
  P3: 'border-text2 bg-neutral-soft text-text2',
}

export type TodoFormMode = 'create' | 'edit'

const TITLE: Record<TodoFormMode, string> = {
  create: 'Novo item',
  edit: 'Editar item',
}

const SUBMIT_LABEL: Record<TodoFormMode, string> = {
  create: 'Criar item',
  edit: 'Salvar alterações',
}

type TodoFormModalProps = {
  mode: TodoFormMode
  projects: readonly Project[]
  groupMode: TodoGroupMode
  context: TodoGroupingContext
  initialDraft: NewTodoDraft
  onClose: () => void
  onSubmit: (draft: NewTodoDraft) => void
}

function describePreview(
  draft: NewTodoDraft,
  groupMode: TodoGroupMode,
  context: TodoGroupingContext,
  projects: readonly Project[],
): string {
  const preview = previewTodoGroup(draft, groupMode, context, projects)

  if (preview.kind === 'due') {
    return DUE_GROUP_LABELS[preview.bucket]
  }

  return preview.kind === 'project'
    ? preview.project?.name ?? 'Sem projeto'
    : `${preview.priority} · ${PRIORITY_LABELS[preview.priority]}`
}

export function TodoFormModal({
  mode,
  projects,
  groupMode,
  context,
  initialDraft,
  onClose,
  onSubmit,
}: TodoFormModalProps) {
  const [title, setTitle] = useState(initialDraft.title)
  const [description, setDescription] = useState(initialDraft.description)
  const [projectId, setProjectId] = useState<EntityId | null>(initialDraft.projectId)
  const [dueText, setDueText] = useState(formatDueField(initialDraft.dueDate))
  const [priority, setPriority] = useState<Priority>(initialDraft.priority)
  const [tagNames, setTagNames] = useState<readonly string[]>(initialDraft.tagNames)

  const draft: NewTodoDraft = {
    title,
    description,
    projectId,
    dueDate: parseDisplayDate(dueText),
    priority,
    tagNames,
  }

  const hasBrokenDue = dueText.trim() !== '' && draft.dueDate === null
  const errors = validateNewTodo(draft)
  const isValid = Object.keys(errors).length === 0 && !hasBrokenDue
  const linkedProject = projects.find((project) => project.id === projectId) ?? null
  const previewLabel = describePreview(draft, groupMode, context, projects)

  return (
    <Modal
      open
      size="medium"
      tone="accent"
      title={TITLE[mode]}
      hint="A seção é definida pela data limite — sem data cai em “Sem data”."
      submitLabel={SUBMIT_LABEL[mode]}
      submitDisabled={!isValid}
      onClose={onClose}
      onSubmit={() => onSubmit(draft)}
    >
      <FieldGroup label="Nome" htmlFor="todo-form-title">
        <Input
          id="todo-form-title"
          autoFocus
          fieldSize="medium"
          value={title}
          placeholder="O que precisa ser feito"
          onChange={(event) => setTitle(event.target.value)}
        />
      </FieldGroup>

      <FieldGroup label="Descrição" htmlFor="todo-form-description">
        <Textarea
          id="todo-form-description"
          rows={3}
          textSize="support"
          value={description}
          placeholder="Contexto, links, próximos passos — aceita markdown"
          onChange={(event) => setDescription(event.target.value)}
        />
      </FieldGroup>

      <div className="grid grid-cols-[1.4fr_1fr] gap-2.5">
        <FieldGroup label="Projeto vinculado" htmlFor="todo-form-project">
          <Select
            id="todo-form-project"
            fieldSize="medium"
            textSize="support"
            value={projectId ?? WITHOUT_PROJECT_VALUE}
            onChange={(event) =>
              setProjectId(event.target.value === WITHOUT_PROJECT_VALUE ? null : event.target.value)
            }
          >
            <option value={WITHOUT_PROJECT_VALUE}>Sem projeto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </FieldGroup>

        <FieldGroup
          label="Data limite"
          htmlFor="todo-form-due"
          error={hasBrokenDue ? 'Data inválida.' : undefined}
        >
          <DateField
            id="todo-form-due"
            fieldSize="medium"
            value={dueText}
            invalid={hasBrokenDue}
            onChange={setDueText}
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Tags" htmlFor="todo-form-tags">
        <TagInput
          id="todo-form-tags"
          tags={tagNames}
          onChange={setTagNames}
          label="Tags do item"
        />
      </FieldGroup>

      <FieldGroup label="Prioridade">
        <div role="radiogroup" aria-label="Prioridade" className="flex gap-1.5">
          {PRIORITIES.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === priority}
              onClick={() => setPriority(option)}
              className={classNames(
                'h-7 flex-1 rounded-button border text-label font-semibold tracking-normal',
                option === priority
                  ? PRIORITY_BUTTON_CLASSES[option]
                  : 'border-border bg-transparent text-text2',
                FOCUS_RING,
              )}
            >
              {option} {PRIORITY_LABELS[option]}
            </button>
          ))}
        </div>
      </FieldGroup>

      <div className="flex items-center gap-[9px] rounded-card border border-border bg-sunken px-[11px] py-[9px]">
        <span
          aria-hidden="true"
          className="inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border border-border-strong text-micro font-bold text-text2"
        >
          i
        </span>
        <span className="text-support text-text2">
          Vai para <span className="font-semibold text-text">{previewLabel}</span> no agrupamento
          atual
          {linkedProject !== null && ` · vinculado a ${linkedProject.name}`}
        </span>
      </div>
    </Modal>
  )
}
