import type { EntityId } from '@/domain/schemas/primitives'
import type { ConsistencyAlert } from '@/domain/today/consistencyAlerts'
import type { PendingDecision } from '@/domain/today/pendingDecisions'
import type { WeekNumbers } from '@/domain/today/weekNumbers'
import { SectionHeading } from '@/ui/primitives/SectionHeading'
import { ConsistencyAlertList } from './ConsistencyAlertList'
import { PendingDecisionCard } from './PendingDecisionCard'
import { WeekNumbersGrid } from './WeekNumbersGrid'

type TodayContextColumnProps = {
  decisions: readonly PendingDecision[]
  alerts: readonly ConsistencyAlert[]
  week: WeekNumbers
  onUnblock: (decision: PendingDecision) => void
  onRegisterEvent: (decision: PendingDecision) => void
  onPostpone: (decision: PendingDecision) => void
  onResume: (projectId: EntityId) => void
  onOpenCapacity: () => void
}

export function TodayContextColumn({
  decisions,
  alerts,
  week,
  onUnblock,
  onRegisterEvent,
  onPostpone,
  onResume,
  onOpenCapacity,
}: TodayContextColumnProps) {
  return (
    <>
      {decisions.length > 0 && (
        <section className="grid gap-2">
          <SectionHeading
            title="Esperando sua decisão"
            count={decisions.length}
            countTone="danger"
          />
          {decisions.map((decision) => (
            <PendingDecisionCard
              key={decision.project.id}
              decision={decision}
              onUnblock={() => onUnblock(decision)}
              onRegisterEvent={() => onRegisterEvent(decision)}
              onPostpone={() => onPostpone(decision)}
              onResume={onResume}
              onReallocate={onOpenCapacity}
            />
          ))}
        </section>
      )}

      {alerts.length > 0 && (
        <section className="grid gap-2">
          <SectionHeading title="Alertas de consistência" count={alerts.length} />
          <ConsistencyAlertList alerts={alerts} onOpenCapacity={onOpenCapacity} />
        </section>
      )}

      <section className="grid gap-2">
        <SectionHeading title="Semana em números" />
        <WeekNumbersGrid week={week} />
      </section>
    </>
  )
}
