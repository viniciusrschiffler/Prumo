import type { TaskAssignee } from '@/domain/projects/newTask'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import { AddButton } from '@/ui/primitives/AddButton'
import { IconButton } from '@/ui/primitives/IconButton'
import { PersonAvatar } from '@/ui/primitives/PersonAvatar'
import { Select } from '@/ui/primitives/Select'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'

const PERCENTAGE_STEP = 10
const MIN_PERCENTAGE = 0
const MAX_PERCENTAGE = 100
const DEFAULT_PERCENTAGE = 50

const STEPPER_BUTTON_CLASSES =
  'h-6 w-[22px] border-0 bg-panel font-mono text-support font-semibold text-text2 hover:bg-sunken hover:text-text'

type TaskAssigneeListProps = {
  people: readonly Person[]
  assignees: readonly TaskAssignee[]
  error?: string
  onChange: (assignees: readonly TaskAssignee[]) => void
}

export function TaskAssigneeList({
  people,
  assignees,
  error,
  onChange,
}: TaskAssigneeListProps) {
  const activePeople = people.filter((person) => person.active)
  const takenIds = new Set(assignees.map((assignee) => assignee.personId))
  const nextPerson = activePeople.find((person) => !takenIds.has(person.id))
  const total = assignees.reduce((sum, assignee) => sum + assignee.percentage, 0)

  function changePercentage(personId: EntityId, delta: number) {
    onChange(
      assignees.map((assignee) =>
        assignee.personId === personId
          ? {
              ...assignee,
              percentage: Math.max(
                MIN_PERCENTAGE,
                Math.min(MAX_PERCENTAGE, assignee.percentage + delta),
              ),
            }
          : assignee,
      ),
    )
  }

  function replacePerson(index: number, personId: EntityId) {
    onChange(
      assignees.map((assignee, position) =>
        position === index ? { ...assignee, personId } : assignee,
      ),
    )
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-column uppercase text-text3">Atribuição</span>
        <span className="font-mono text-micro text-text3">∑ {total}% da tarefa</span>
        {error !== undefined && <span className="ml-auto text-meta text-danger">{error}</span>}
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-bg">
        {assignees.map((assignee, index) => {
          const person = people.find((candidate) => candidate.id === assignee.personId)

          return (
            <div
              key={assignee.personId}
              className="grid grid-cols-[minmax(0,1fr)_92px_22px] items-center gap-2 border-b border-border px-2.5 py-2"
            >
              <div className="flex min-w-0 items-center gap-[7px]">
                <PersonAvatar
                  initials={person?.initials ?? '—'}
                  name={person?.name}
                  size="small"
                  className="rounded-full"
                />
                <Select
                  aria-label="Pessoa atribuída"
                  fieldSize="small"
                  textSize="support"
                  value={assignee.personId}
                  onChange={(event) => replacePerson(index, event.target.value)}
                  className="min-w-0 flex-1"
                >
                  {activePeople
                    .filter(
                      (candidate) =>
                        candidate.id === assignee.personId || !takenIds.has(candidate.id),
                    )
                    .map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name}
                        {candidate.role === null ? '' : ` · ${candidate.role}`}
                      </option>
                    ))}
                </Select>
              </div>

              <div className="flex items-center justify-self-end overflow-hidden rounded-[5px] border border-border-strong">
                <button
                  type="button"
                  aria-label={`Diminuir a alocação de ${person?.name ?? 'pessoa'}`}
                  onClick={() => changePercentage(assignee.personId, -PERCENTAGE_STEP)}
                  className={classNames(STEPPER_BUTTON_CLASSES, FOCUS_RING)}
                >
                  −
                </button>
                <span className="w-11 text-center font-mono text-label font-normal tabular-nums tracking-normal text-text">
                  {assignee.percentage}%
                </span>
                <button
                  type="button"
                  aria-label={`Aumentar a alocação de ${person?.name ?? 'pessoa'}`}
                  onClick={() => changePercentage(assignee.personId, PERCENTAGE_STEP)}
                  className={classNames(STEPPER_BUTTON_CLASSES, FOCUS_RING)}
                >
                  +
                </button>
              </div>

              <IconButton
                label={`Remover ${person?.name ?? 'pessoa'} da tarefa`}
                size="small"
                onClick={() =>
                  onChange(assignees.filter((candidate) => candidate.personId !== assignee.personId))
                }
                className="hover:bg-danger-soft hover:text-danger"
              >
                ✕
              </IconButton>
            </div>
          )
        })}

        <div className="flex items-center gap-1.5 px-2.5 py-[7px]">
          <AddButton
            disabled={nextPerson === undefined}
            onClick={() =>
              nextPerson !== undefined &&
              onChange([
                ...assignees,
                { personId: nextPerson.id, percentage: DEFAULT_PERCENTAGE },
              ])
            }
          >
            + Adicionar pessoa
          </AddButton>
          <span className="ml-auto font-mono text-micro text-text3">
            {assignees.length === 1 ? '1 pessoa' : `${assignees.length} pessoas`}
          </span>
        </div>
      </div>
    </div>
  )
}
