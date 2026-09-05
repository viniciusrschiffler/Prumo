import { useState } from 'react'
import { deriveInitials } from '@/domain/people/deriveInitials'
import type { Person } from '@/domain/schemas/personSchema'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'

const MAX_WEEKLY_HOURS = 168

type PersonDraft = {
  name: string
  initials: string
  role: string
  capacity: string
}

function toDraft(person: Person | null): PersonDraft {
  if (person === null) {
    return { name: '', initials: '', role: '', capacity: '40' }
  }

  return {
    name: person.name,
    initials: person.initials,
    role: person.role ?? '',
    capacity: String(person.weeklyCapacityHours),
  }
}

function readCapacity(text: string): number | null {
  const parsed = Number(text.replace(',', '.'))

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_WEEKLY_HOURS) {
    return null
  }

  return parsed
}

// Montado só enquanto aberto e com key pela pessoa: o rascunho nasce do registro e nenhum
// efeito precisa reescrevê-lo depois.
type PersonFormModalProps = {
  person: Person | null
  onClose: () => void
  onSubmit: (person: Person) => void
}

export function PersonFormModal({ person, onClose, onSubmit }: PersonFormModalProps) {
  const [draft, setDraft] = useState<PersonDraft>(() => toDraft(person))

  const trimmedName = draft.name.trim()
  const capacity = readCapacity(draft.capacity)
  const initials = draft.initials.trim() === '' ? deriveInitials(trimmedName) : draft.initials.trim()
  const isValid = trimmedName !== '' && initials !== '' && capacity !== null

  function handleSubmit() {
    if (!isValid || capacity === null) {
      return
    }

    onSubmit({
      id: person?.id ?? crypto.randomUUID(),
      name: trimmedName,
      initials: initials.slice(0, 4),
      role: draft.role.trim() === '' ? null : draft.role.trim(),
      weeklyCapacityHours: capacity,
      active: person?.active ?? true,
    })
  }

  return (
    <Modal
      open
      title={person === null ? 'Nova pessoa' : `Editar “${person.name}”`}
      hint="A capacidade é a base do cálculo de alocação."
      submitLabel={person === null ? 'Criar pessoa' : 'Salvar'}
      submitDisabled={!isValid}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <FieldGroup label="Nome" htmlFor="person-name">
        <Input
          id="person-name"
          value={draft.name}
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
        />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-2.5">
        <FieldGroup
          label="Iniciais"
          htmlFor="person-initials"
          hint={draft.initials.trim() === '' ? `em branco usa ${initials || '—'}` : undefined}
        >
          <Input
            id="person-initials"
            maxLength={4}
            value={draft.initials}
            placeholder={deriveInitials(trimmedName)}
            onChange={(event) =>
              setDraft((current) => ({ ...current, initials: event.target.value }))
            }
          />
        </FieldGroup>

        <FieldGroup
          label="Capacidade semanal"
          htmlFor="person-capacity"
          error={capacity === null ? `Informe de 0 a ${MAX_WEEKLY_HOURS} horas.` : undefined}
        >
          <Input
            id="person-capacity"
            numeric
            invalid={capacity === null}
            value={draft.capacity}
            onChange={(event) =>
              setDraft((current) => ({ ...current, capacity: event.target.value }))
            }
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Papel" htmlFor="person-role" hint="opcional">
        <Input
          id="person-role"
          value={draft.role}
          onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
        />
      </FieldGroup>
    </Modal>
  )
}
