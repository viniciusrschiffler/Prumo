import { useState } from 'react'
import {
  validateUnblockProject,
  type UnblockProjectDraft,
} from '@/domain/projects/unblockProjects'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Modal } from '@/ui/primitives/Modal'
import { StaticField } from '@/ui/primitives/StaticField'
import { Textarea } from '@/ui/primitives/Textarea'

type UnblockProjectModalProps = {
  projectName: string
  endedAllocationCount: number
  onClose: () => void
  onSubmit: (draft: UnblockProjectDraft) => void
}

function describeAllocations(count: number): string {
  if (count === 0) {
    return 'nenhuma para recriar'
  }

  return count === 1 ? '1 será recriada' : `${count} serão recriadas`
}

export function UnblockProjectModal({
  projectName,
  endedAllocationCount,
  onClose,
  onSubmit,
}: UnblockProjectModalProps) {
  const [reason, setReason] = useState('')

  const reasonError = validateUnblockProject({ reason })

  return (
    <Modal
      open
      tone="ok"
      title={`Desbloquear “${projectName}”`}
      hint="Registra evento de desbloqueio no histórico."
      submitLabel="Desbloquear"
      submitDisabled={reasonError !== null}
      onClose={onClose}
      onSubmit={() => onSubmit({ reason })}
    >
      <FieldGroup label="O que destravou" htmlFor="unblock-reason">
        <Textarea
          id="unblock-reason"
          rows={2}
          value={reason}
          placeholder="Ex. Jurídico devolveu o contrato assinado."
          invalid={reason !== '' && reasonError !== null}
          onChange={(event) => setReason(event.target.value)}
        />
      </FieldGroup>

      <FieldGroup label="Alocações encerradas no bloqueio">
        <StaticField>{describeAllocations(endedAllocationCount)}</StaticField>
      </FieldGroup>
    </Modal>
  )
}
