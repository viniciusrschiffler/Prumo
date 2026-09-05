import { useState } from 'react'
import { PHASE_COLOR_PALETTE, type Phase } from '@/domain/schemas/phaseSchema'
import { ColorSwatchPicker } from '@/ui/primitives/ColorSwatchPicker'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'

const DEFAULT_COLOR = PHASE_COLOR_PALETTE[0]

// Montado só enquanto aberto e com key pela fase, pelo mesmo motivo do modal de pessoa.
type PhaseFormModalProps = {
  phase: Phase | null
  nextSortOrder: number
  onClose: () => void
  onSubmit: (phase: Phase) => void
}

export function PhaseFormModal({
  phase,
  nextSortOrder,
  onClose,
  onSubmit,
}: PhaseFormModalProps) {
  const [name, setName] = useState(phase?.name ?? '')
  const [color, setColor] = useState<string>(phase?.color ?? DEFAULT_COLOR)

  const trimmedName = name.trim()
  const isValid = trimmedName !== ''

  function handleSubmit() {
    if (!isValid) {
      return
    }

    onSubmit({
      id: phase?.id ?? crypto.randomUUID(),
      name: trimmedName,
      sortOrder: phase?.sortOrder ?? nextSortOrder,
      color,
      active: phase?.active ?? true,
    })
  }

  return (
    <Modal
      open
      title={phase === null ? 'Nova fase' : `Editar “${phase.name}”`}
      hint="A cor vale em todas as telas do Prumo."
      submitLabel={phase === null ? 'Criar fase' : 'Salvar'}
      submitDisabled={!isValid}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <FieldGroup label="Nome" htmlFor="phase-name">
        <Input
          id="phase-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FieldGroup>

      <FieldGroup label="Cor">
        <div className="flex items-center gap-3">
          <ColorSwatchPicker
            colors={PHASE_COLOR_PALETTE}
            value={color}
            onChange={setColor}
            label="Cor da fase"
          />
          <span
            style={phaseColorStyle(color)}
            className="phase-tinted inline-flex items-center rounded-badge bg-[var(--phase-tone-soft)] px-1.5 py-px text-micro font-semibold text-[var(--phase-tone)]"
          >
            {trimmedName === '' ? 'exemplo' : trimmedName}
          </span>
        </div>
      </FieldGroup>
    </Modal>
  )
}
