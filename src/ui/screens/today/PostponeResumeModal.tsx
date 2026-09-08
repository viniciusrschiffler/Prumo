import { useState } from 'react'
import { formatIsoDate, parseDisplayDate } from '@/domain/format/displayDate'
import {
  validatePostponeResume,
  type PostponeResumeDraft,
} from '@/domain/projects/postponeResume'
import type { IsoDate } from '@/domain/schemas/primitives'
import type { PendingDecision } from '@/domain/today/pendingDecisions'
import { DateField } from '@/ui/primitives/DateField'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Modal } from '@/ui/primitives/Modal'

type PostponeResumeModalProps = {
  decision: PendingDecision
  today: IsoDate
  onClose: () => void
  onSubmit: (draft: PostponeResumeDraft) => void
}

export function PostponeResumeModal({
  decision,
  today,
  onClose,
  onSubmit,
}: PostponeResumeModalProps) {
  const [dateText, setDateText] = useState(formatIsoDate(decision.expectedResumeAt ?? today))

  const draft: PostponeResumeDraft = {
    blockEventId: decision.blockEvent?.id ?? '',
    expectedResumeAt: parseDisplayDate(dateText),
  }

  const error = validatePostponeResume(draft, today)

  return (
    <Modal
      open
      title="Adiar retomada"
      tone="danger"
      note={decision.project.name}
      submitLabel="Adiar"
      submitDisabled={error !== null}
      hint="A data vai para o evento de bloqueio vigente."
      onClose={onClose}
      onSubmit={() => onSubmit(draft)}
    >
      <FieldGroup
        label="Nova retomada prevista"
        htmlFor="postpone-resume-date"
        error={error ?? undefined}
      >
        <div className="w-[130px]">
          <DateField
            id="postpone-resume-date"
            value={dateText}
            invalid={error !== null}
            onChange={setDateText}
          />
        </div>
      </FieldGroup>
    </Modal>
  )
}
