import { useState } from 'react'
import type { AllocationConflict } from '@/domain/projects/allocationConflicts'
import {
  previewAllocationConflicts,
  previewTaskImpact,
  validateNewTask,
  type NewTaskDraft,
  type TaskAssignee,
} from '@/domain/projects/newTask'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import { formatIsoDate, parseDisplayDate } from '@/domain/format/displayDate'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import { DateField } from '@/ui/primitives/DateField'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { TaskAssigneeList } from './TaskAssigneeList'
import { TaskImpactPreview } from './TaskImpactPreview'

function parseHours(text: string): number | null {
  const trimmed = text.trim()

  if (trimmed === '') {
    return null
  }

  const parsed = Number(trimmed.replace(',', '.'))

  return Number.isFinite(parsed) ? parsed : null
}

export type TaskFormMode = 'create' | 'edit'

const TITLE: Record<TaskFormMode, string> = {
  create: 'Nova tarefa',
  edit: 'Editar tarefa',
}

const SUBMIT_LABEL: Record<TaskFormMode, string> = {
  create: 'Criar tarefa',
  edit: 'Salvar alterações',
}

function toDateField(date: IsoDate | null): string {
  return date === null ? '' : formatIsoDate(date)
}

function toHoursField(hours: number | null): string {
  return hours === null ? '' : String(hours)
}

type TaskFormModalProps = {
  mode: TaskFormMode
  taskId: EntityId | null
  projectId: EntityId
  projectName: string
  baselineLabel: string
  phases: readonly Phase[]
  snapshot: ProjectsSnapshot
  initialDraft: NewTaskDraft
  onClose: () => void
  onSubmit: (draft: NewTaskDraft) => void
}

// Criar e editar preenchem os mesmos campos. Na edição a prévia mede o mundo sem a tarefa
// de antes: comparar a versão nova com ela mesma inventaria conflito e dobraria o esforço.
export function TaskFormModal({
  mode,
  taskId,
  projectId,
  projectName,
  baselineLabel,
  phases,
  snapshot,
  initialDraft,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const [title, setTitle] = useState(initialDraft.title)
  const [phaseId, setPhaseId] = useState<EntityId | null>(initialDraft.phaseId)
  const [startText, setStartText] = useState(toDateField(initialDraft.plannedStart))
  const [endText, setEndText] = useState(toDateField(initialDraft.plannedEnd))
  const [hoursText, setHoursText] = useState(toHoursField(initialDraft.estimatedHours))
  const [assignees, setAssignees] = useState<readonly TaskAssignee[]>(initialDraft.assignees)

  const draft: NewTaskDraft = {
    projectId,
    title,
    phaseId,
    plannedStart: parseDisplayDate(startText),
    plannedEnd: parseDisplayDate(endText),
    estimatedHours: parseHours(hoursText),
    assignees,
  }

  const errors = validateNewTask(draft)
  const hasBrokenStart = startText.trim() !== '' && draft.plannedStart === null
  const hasBrokenEnd = endText.trim() !== '' && draft.plannedEnd === null
  const hasBrokenHours = hoursText.trim() !== '' && draft.estimatedHours === null
  const isValid =
    Object.keys(errors).length === 0 && !hasBrokenStart && !hasBrokenEnd && !hasBrokenHours

  const otherTasks = snapshot.tasks.filter((task) => task.id !== taskId)
  const otherAllocations = snapshot.allocations.filter(
    (allocation) => allocation.taskId !== taskId,
  )
  const projectTasks = snapshot.tasks.filter((task) => task.projectId === projectId)
  const impact = previewTaskImpact(projectTasks, draft, taskId)
  const conflicts: readonly AllocationConflict[] = isValid
    ? previewAllocationConflicts({
        draft,
        tasks: otherTasks,
        allocations: otherAllocations,
        projects: snapshot.projects,
        people: snapshot.people,
      })
    : []

  return (
    <Modal
      open
      size="wide"
      title={TITLE[mode]}
      note={`${projectName} · ${baselineLabel}`}
      submitLabel={SUBMIT_LABEL[mode]}
      submitDisabled={!isValid}
      onClose={onClose}
      onSubmit={() => onSubmit(draft)}
    >
      <FieldGroup
        variant="column"
        label="Título"
        htmlFor="task-form-title"
        error={title === '' ? undefined : errors.title}
      >
        <Input
          id="task-form-title"
          fieldSize="large"
          value={title}
          placeholder="Ex. Testes de carga do gateway"
          onChange={(event) => setTitle(event.target.value)}
        />
      </FieldGroup>

      <FieldGroup variant="column" label="Fase" error={errors.phaseId}>
        <div role="radiogroup" aria-label="Fase da tarefa" className="flex flex-wrap gap-1.5">
          {phases.map((phase) => (
            <button
              key={phase.id}
              type="button"
              role="radio"
              aria-checked={phase.id === phaseId}
              onClick={() => setPhaseId(phase.id)}
              style={phaseColorStyle(phase.color)}
              className={classNames(
                'phase-tinted inline-flex h-7 items-center gap-1.5 rounded-button border px-2.5 text-support font-medium text-text',
                phase.id === phaseId
                  ? 'border-accent bg-accent-soft'
                  : 'border-border-strong bg-panel',
                FOCUS_RING,
              )}
            >
              <span className="h-3 w-[3px] flex-none rounded-[2px] bg-[var(--phase-tone)]" />
              {phase.name}
            </button>
          ))}
        </div>
      </FieldGroup>

      <div className="grid grid-cols-3 gap-2.5">
        <FieldGroup
          variant="column"
          label="Início"
          htmlFor="task-form-start"
          error={hasBrokenStart ? 'Data inválida.' : undefined}
        >
          <DateField
            id="task-form-start"
            fieldSize="large"
            value={startText}
            invalid={hasBrokenStart}
            onChange={setStartText}
          />
        </FieldGroup>

        <FieldGroup
          variant="column"
          label="Fim"
          htmlFor="task-form-end"
          error={hasBrokenEnd ? 'Data inválida.' : errors.plannedEnd}
        >
          <DateField
            id="task-form-end"
            fieldSize="large"
            value={endText}
            invalid={hasBrokenEnd || errors.plannedEnd !== undefined}
            onChange={setEndText}
          />
        </FieldGroup>

        <FieldGroup
          variant="column"
          label="Estimativa"
          htmlFor="task-form-hours"
          error={hasBrokenHours ? 'Informe um número de horas.' : errors.estimatedHours}
        >
          <div className="relative grid">
            <Input
              id="task-form-hours"
              numeric
              fieldSize="large"
              value={hoursText}
              placeholder="80"
              invalid={hasBrokenHours || errors.estimatedHours !== undefined}
              onChange={(event) => setHoursText(event.target.value)}
              className="pr-7"
            />
            <span className="pointer-events-none absolute right-2.5 top-0 flex h-8 items-center font-mono text-label font-normal tracking-normal text-text3">
              h
            </span>
          </div>
        </FieldGroup>
      </div>

      <TaskAssigneeList
        people={snapshot.people}
        assignees={assignees}
        error={errors.assignees}
        onChange={setAssignees}
      />

      <TaskImpactPreview
        impact={impact}
        conflicts={conflicts}
        window={
          draft.plannedStart === null || draft.plannedEnd === null
            ? null
            : `${formatIsoDate(draft.plannedStart)} → ${formatIsoDate(draft.plannedEnd)}`
        }
      />
    </Modal>
  )
}
