import { useState } from 'react'
import { parseDisplayDate } from '@/domain/format/displayDate'
import { validateBlockProjects, type BlockProjectsDraft } from '@/domain/projects/blockProjects'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'
import { StaticField } from '@/ui/primitives/StaticField'
import { Textarea } from '@/ui/primitives/Textarea'

type BlockProjectsModalProps = {
  projectNames: readonly string[]
  openAllocationCount: number
  onClose: () => void
  onSubmit: (draft: BlockProjectsDraft) => void
}

function buildTitle(projectNames: readonly string[]): string {
  if (projectNames.length === 1) {
    return `Bloquear “${projectNames[0]}”`
  }

  return `Bloquear ${projectNames.length} projetos`
}

function describeAllocations(count: number): string {
  if (count === 0) {
    return 'nenhuma para encerrar'
  }

  return count === 1 ? '1 será encerrada' : `${count} serão encerradas`
}

export function BlockProjectsModal({
  projectNames,
  openAllocationCount,
  onClose,
  onSubmit,
}: BlockProjectsModalProps) {
  const [reason, setReason] = useState('')
  const [resumeText, setResumeText] = useState('')

  const expectedResumeAt = parseDisplayDate(resumeText)
  const hasBrokenResume = resumeText.trim() !== '' && expectedResumeAt === null
  const reasonError = validateBlockProjects({ reason, expectedResumeAt })

  return (
    <Modal
      open
      tone="danger"
      title={buildTitle(projectNames)}
      hint="Registra evento de bloqueio no histórico."
      submitLabel="Bloquear"
      submitVariant="danger"
      submitDisabled={reasonError !== null || hasBrokenResume}
      onClose={onClose}
      onSubmit={() => onSubmit({ reason, expectedResumeAt })}
    >
      <FieldGroup label="Motivo do bloqueio" htmlFor="block-reason">
        <Textarea
          id="block-reason"
          rows={2}
          value={reason}
          placeholder="Ex. Aguardando validação jurídica do contrato do parceiro."
          invalid={reason !== '' && reasonError !== null}
          onChange={(event) => setReason(event.target.value)}
        />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-2.5">
        <FieldGroup
          label="Retomada prevista"
          htmlFor="block-resume"
          error={hasBrokenResume ? 'Data inválida.' : undefined}
        >
          <Input
            id="block-resume"
            numeric
            value={resumeText}
            placeholder="dd/mm/aaaa"
            invalid={hasBrokenResume}
            onChange={(event) => setResumeText(event.target.value)}
          />
        </FieldGroup>

        <FieldGroup label="Alocações ativas">
          <StaticField>{describeAllocations(openAllocationCount)}</StaticField>
        </FieldGroup>
      </div>
    </Modal>
  )
}
