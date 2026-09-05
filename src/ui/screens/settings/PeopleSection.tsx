import { useState } from 'react'
import { todayIsoDate } from '@/app/clock'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { weekPeriod } from '@/domain/dates/isoDateMath'
import {
  countActiveAllocationsByPerson,
  countAllocationsByPerson,
} from '@/domain/derived/countActiveAllocationsByPerson'
import { countActivePeople, sumTeamWeeklyCapacity } from '@/domain/derived/sumTeamWeeklyCapacity'
import {
  calculateWeeklyCapacity,
  isOverallocated,
} from '@/domain/derived/calculateWeeklyCapacity'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { Person } from '@/domain/schemas/personSchema'
import { Button } from '@/ui/primitives/Button'
import { classNames } from '@/ui/primitives/classNames'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { IconButton } from '@/ui/primitives/IconButton'
import { Input } from '@/ui/primitives/Input'
import { PersonAvatar } from '@/ui/primitives/PersonAvatar'
import { SectionCard } from '@/ui/primitives/SectionCard'
import { PersonFormModal } from './PersonFormModal'

const COLUMNS = 'grid grid-cols-[1fr_130px_140px_110px_90px] items-center gap-2.5 px-3.5'

function describeAllocations(count: number): string {
  if (count === 0) {
    return 'nenhuma'
  }

  return count === 1 ? '1 alocação' : `${count} alocações`
}

type CapacityFieldProps = {
  person: Person
  onCommit: (hours: number) => void
}

function CapacityField({ person, onCommit }: CapacityFieldProps) {
  const [text, setText] = useState(String(person.weeklyCapacityHours))
  const parsed = Number(text.replace(',', '.'))
  const isValid = Number.isFinite(parsed) && parsed >= 0 && parsed <= 168

  function commit() {
    if (!isValid || parsed === person.weeklyCapacityHours) {
      setText(String(person.weeklyCapacityHours))

      return
    }

    onCommit(parsed)
  }

  return (
    <span className="inline-flex items-center justify-end gap-[5px]">
      <Input
        numeric
        invalid={!isValid}
        aria-label={`Capacidade semanal de ${person.name}`}
        className="h-[26px] w-13 px-[7px] text-right"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }

          if (event.key === 'Escape') {
            setText(String(person.weeklyCapacityHours))
          }
        }}
      />
      <span className="font-mono text-meta text-text3">h/sem</span>
    </span>
  )
}

export function PeopleSection() {
  const people = useSettingsStore((state) => state.people)
  const allocations = useSettingsStore((state) => state.allocations)
  const weekStart = useSettingsStore((state) => state.settings.weekStart)
  const savePerson = useSettingsStore((state) => state.savePerson)
  const removePerson = useSettingsStore((state) => state.removePerson)
  const notify = useToastStore((state) => state.notify)

  const [editing, setEditing] = useState<Person | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)

  const activeCount = countActivePeople(people)
  const teamCapacity = sumTeamWeeklyCapacity(people)
  const activeAllocations = countActiveAllocationsByPerson(allocations)
  const allocationHistory = countAllocationsByPerson(allocations)
  const week = weekPeriod(todayIsoDate(), weekStart)

  async function run(action: () => Promise<void>, success: string) {
    try {
      await action()
      notify(success)
    } catch (cause) {
      console.error('Não foi possível concluir a alteração em Pessoas.', cause)
      notify(toPublicMessage(cause), 'danger')
    }
  }

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(person: Person) {
    setEditing(person)
    setModalOpen(true)
  }

  return (
    <SectionCard
      id="pessoas"
      title="Pessoas"
      note={
        <span className="font-mono">
          {activeCount} ativas · {people.length - activeCount} inativas
        </span>
      }
      action={
        <Button variant="primary" size="small" onClick={openNew}>
          Nova pessoa
        </Button>
      }
    >
      <div role="table" aria-label="Pessoas">
        <div
          role="row"
          className={classNames(
            COLUMNS,
            'border-b border-border bg-sunken py-[7px] text-column uppercase text-text2',
          )}
        >
          <span role="columnheader">Nome</span>
          <span role="columnheader" className="text-right">
            Capacidade
          </span>
          <span role="columnheader">Alocações ativas</span>
          <span role="columnheader">Estado</span>
          <span role="columnheader" className="text-right">
            Ações
          </span>
        </div>

        {people.length === 0 ? (
          <div className="p-3.5">
            <EmptyState
              title="Nenhuma pessoa cadastrada"
              description="Cadastre a primeira pessoa para poder alocá-la nas tarefas dos projetos."
              action={
                <Button variant="primary" onClick={openNew}>
                  Nova pessoa
                </Button>
              }
            />
          </div>
        ) : (
          people.map((person) => {
            const activeCountForPerson = activeAllocations.get(person.id) ?? 0
            const hasHistory = (allocationHistory.get(person.id) ?? 0) > 0
            const overallocated =
              person.active &&
              isOverallocated(calculateWeeklyCapacity(person, allocations, week))

            return (
              <div
                key={person.id}
                role="row"
                className={classNames(COLUMNS, 'border-b border-border py-2 hover:bg-sunken')}
              >
                <span role="cell" className="inline-flex items-center gap-2">
                  <PersonAvatar
                    initials={person.initials}
                    name={person.role ?? person.name}
                    tone={overallocated ? 'danger' : 'default'}
                  />
                  <span
                    className={classNames(
                      'truncate text-body',
                      person.active ? 'text-text' : 'text-text3',
                    )}
                  >
                    {person.name}
                  </span>
                </span>

                <span role="cell">
                  <CapacityField
                    person={person}
                    onCommit={(hours) =>
                      void run(
                        () => savePerson({ ...person, weeklyCapacityHours: hours }),
                        `Capacidade de ${person.name} gravada.`,
                      )
                    }
                  />
                </span>

                <span
                  role="cell"
                  className={classNames(
                    'font-mono text-meta tabular-nums',
                    overallocated
                      ? 'text-danger'
                      : activeCountForPerson === 0
                        ? 'text-text3'
                        : 'text-text2',
                  )}
                >
                  {describeAllocations(activeCountForPerson)}
                </span>

                <span role="cell">
                  <button
                    type="button"
                    aria-pressed={person.active}
                    title={
                      person.active
                        ? 'Marcar como inativa — o histórico é preservado'
                        : 'Reativar a pessoa'
                    }
                    onClick={() =>
                      void run(
                        () => savePerson({ ...person, active: !person.active }),
                        person.active
                          ? `${person.name} ficou inativa.`
                          : `${person.name} voltou a ficar ativa.`,
                      )
                    }
                    className={classNames(
                      'inline-flex h-6 items-center justify-self-start rounded-button border px-2 text-micro font-semibold uppercase tracking-[0.02em]',
                      person.active
                        ? 'border-transparent bg-ok-soft text-ok'
                        : 'border-border-strong bg-neutral-soft text-text3',
                      FOCUS_RING,
                    )}
                  >
                    {person.active ? 'Ativo' : 'Inativo'}
                  </button>
                </span>

                <span role="cell" className="flex justify-end gap-1">
                  <IconButton
                    label={`Editar ${person.name}`}
                    className="h-6 w-6 rounded-[5px] border-border"
                    onClick={() => openEdit(person)}
                  >
                    ✎
                  </IconButton>
                  <IconButton
                    label={
                      hasHistory
                        ? `${person.name} tem alocações registradas — marque como inativa`
                        : `Excluir ${person.name}`
                    }
                    disabled={hasHistory}
                    className={classNames(
                      'h-6 w-6 rounded-[5px] border-border',
                      hasHistory
                        ? 'text-text3'
                        : 'text-danger hover:border-danger hover:text-danger',
                    )}
                    onClick={() =>
                      void run(() => removePerson(person.id), `${person.name} foi excluída.`)
                    }
                  >
                    ✕
                  </IconButton>
                </span>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-[9px]">
        <span className="text-meta text-text3">
          Pessoa inativa não aparece em novas alocações, mas o histórico é preservado.
        </span>
        <span className="ml-auto font-mono text-meta tabular-nums text-text2">
          Capacidade do time: {teamCapacity}h/semana
        </span>
      </div>

      {isModalOpen && (
        <PersonFormModal
          key={editing?.id ?? 'nova'}
          person={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={(saved) => {
            setModalOpen(false)
            void run(
              () => savePerson(saved),
              editing === null ? `${saved.name} foi criada.` : `${saved.name} foi salva.`,
            )
          }}
        />
      )}
    </SectionCard>
  )
}
