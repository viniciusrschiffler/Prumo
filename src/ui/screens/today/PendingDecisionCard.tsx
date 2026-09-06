import { formatIsoDate } from '@/domain/format/displayDate'
import type { EntityId } from '@/domain/schemas/primitives'
import type { PendingDecision } from '@/domain/today/pendingDecisions'
import { PROJECT_STATUS_LABELS } from '@/ui/labels/entityLabels'
import { AccentCard } from '@/ui/primitives/AccentCard'
import { Badge } from '@/ui/primitives/Badge'
import { Button } from '@/ui/primitives/Button'
import { ProgressBar } from '@/ui/primitives/ProgressBar'
import {
  describeAllocatedPeople,
  describeDecisionReason,
  describeOverdueResume,
} from './todayLabels'

type PendingDecisionCardProps = {
  decision: PendingDecision
  onUnblock: (projectId: EntityId) => void
  onRegisterEvent: (projectId: EntityId) => void
  onPostpone: (decision: PendingDecision) => void
  onResume: (projectId: EntityId) => void
  onReallocate: (projectId: EntityId) => void
}

export function PendingDecisionCard({
  decision,
  onUnblock,
  onRegisterEvent,
  onPostpone,
  onResume,
  onReallocate,
}: PendingDecisionCardProps) {
  const isBlocked = decision.kind === 'blocked'
  const firstAllocated = decision.allocatedPeople[0] ?? null

  return (
    <AccentCard tone={isBlocked ? 'danger' : 'warn'} spacing="relaxed">
      <div className="flex items-center gap-2">
        <span className="text-body font-semibold">{decision.project.name}</span>
        <Badge tone={isBlocked ? 'danger' : 'warn'} size="small" uppercase>
          {PROJECT_STATUS_LABELS[decision.project.status]}
        </Badge>
        <span className="ml-auto font-mono text-label font-normal tabular-nums tracking-normal text-text3">
          {decision.sinceDays}d
        </span>
      </div>

      <p className="text-pretty text-support text-text2">
        {describeDecisionReason(decision)}
        {decision.expectedResumeAt !== null && (
          <>
            {' Retomada prevista '}
            <span className="font-mono tabular-nums text-text">
              {formatIsoDate(decision.expectedResumeAt)}
            </span>
            {describeOverdueResume(decision.overdueResumeDays)}
          </>
        )}
        {describeAllocatedPeople(decision.allocatedPeople)}
      </p>

      {isBlocked && <ProgressBar hatched track="danger" size="thick" />}

      <div className="flex gap-1.5">
        {isBlocked ? (
          <>
            <Button variant="primary" size="medium" onClick={() => onUnblock(decision.project.id)}>
              Desbloquear
            </Button>
            <Button size="medium" onClick={() => onRegisterEvent(decision.project.id)}>
              Registrar decisão
            </Button>
            <Button
              variant="outline"
              size="medium"
              className="ml-auto"
              onClick={() => onPostpone(decision)}
            >
              Adiar
            </Button>
          </>
        ) : (
          <>
            <Button size="medium" onClick={() => onResume(decision.project.id)}>
              Retomar
            </Button>
            {firstAllocated !== null && (
              <Button size="medium" onClick={() => onReallocate(decision.project.id)}>
                Realocar {firstAllocated.person.name.split(' ')[0]}
              </Button>
            )}
          </>
        )}
      </div>
    </AccentCard>
  )
}
